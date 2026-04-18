/**
 * PayHero M-Pesa (API v2)
 *
 * **Authorization header:** `Authorization: Basic <credentials>`
 * - `PAYHERO_AUTH_TOKEN` should be the **Base64** encoding of `API_USERNAME:API_PASSWORD`
 *   (same as PayHero dashboard / “API key” — NOT the raw password alone).
 * - Example: `echo -n 'your_username:your_password' | base64` → put output in env.
 * - The code sends `Basic ${PAYHERO_AUTH_TOKEN}` — do not add another `Basic` prefix in .env.
 */
import crypto from 'node:crypto';
import axios from 'axios';
import type { Response, Request, NextFunction } from 'express';
import createLogger from '../utils/logger.js';
import AppError from '../utils/appError.js';
import type {
    AuthenticatedRequest,
    JWTUserPayload,
} from '../Types/authenticate.js';
import {
    TransactionsModel,
    type Transaction_Type,
} from '../schema/TransactionSchema.js';
import { UserModel } from '../schema/UsersSchema.js';
import { cleanerChargeAmountKes } from '../constants/cleanerPricing.js';
import { maxFolderFilesForTier } from '../constants/tierUploadLimits.js';

const log = createLogger('payHeroPayment.ts');

const PAYHERO_AUTH_TOKEN = process.env.PAYHERO_AUTH_TOKEN;
const PAYHERO_PAYMENTS_URL = 'https://backend.payhero.co.ke/api/v2/payments';
/** Base URL for transaction status (no query string). Override with `PAYHERO_TRANSACTION_STATUS_BASE_URL`. */
const PAYHERO_TRANSACTION_STATUS_BASE =
    process.env.PAYHERO_TRANSACTION_STATUS_BASE_URL ||
    'https://backend.payhero.co.ke/api/v2/transaction-status';
const PAYHERO_CHANNEL_ID = Number(process.env.PAYHERO_CHANNEL_ID) || 7067;
const MIN_WALLET_TOPUP_KES = 10;
const MAX_WALLET_TOPUP_KES = 500_000;

/** Build candidate status URLs — PayHero docs / versions may use different paths. */
function statusUrlCandidates(referenceQuery: string): string[] {
    const q = encodeURIComponent(referenceQuery);
    return [
        `${PAYHERO_TRANSACTION_STATUS_BASE}?reference=${q}`,
        `${PAYHERO_PAYMENTS_URL}/status?reference=${q}`,
    ];
}

function payheroAuthHeaders() {
    return {
        Authorization: `Basic ${PAYHERO_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
    } as const;
}

/** Pull status string from PayHero JSON (shapes vary by API version). */
function extractPayHeroStatus(payload: unknown): string | undefined {
    if (!payload || typeof payload !== 'object') return undefined;
    const root = payload as Record<string, unknown>;
    const data = root.data;
    const inner =
        data && typeof data === 'object'
            ? (data as Record<string, unknown>)
            : root;
    const raw =
        inner.status ??
        inner.payment_status ??
        inner.transaction_status ??
        root.status;
    return typeof raw === 'string' ? raw.trim().toLowerCase() : undefined;
}

/** IDs PayHero may return on STK initiate — status API often needs this, not only external_reference. */
function extractPayHeroInitiateTransactionId(body: unknown): string | undefined {
    if (!body || typeof body !== 'object') return undefined;
    const root = body as Record<string, unknown>;
    const data = root.data;
    const inner =
        data && typeof data === 'object'
            ? (data as Record<string, unknown>)
            : root;

    const pick = (v: unknown): string | undefined =>
        typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;

    return (
        pick(inner.reference) ??
        pick(inner.transaction_reference) ??
        pick(inner.transaction_id) ??
        pick(inner.payment_reference) ??
        pick(inner.checkout_request_id) ??
        pick(inner.CheckoutRequestID) ??
        pick(inner.merchant_request_id) ??
        pick(inner.MerchantRequestID) ??
        pick(inner.id)
    );
}

function extractPayHeroReceipt(payload: unknown): string | undefined {
    if (!payload || typeof payload !== 'object') return undefined;
    const root = payload as Record<string, unknown>;
    const data = root.data;
    const inner =
        data && typeof data === 'object'
            ? (data as Record<string, unknown>)
            : root;
    const r =
        inner.mpesa_receipt ??
        inner.mpesaReceipt ??
        inner.receipt ??
        inner.provider_reference ??
        inner.providerReference;
    return typeof r === 'string' ? r : undefined;
}

export type FolderCleanPollStatus = 'pending' | 'success' | 'failed';

/**
 * Idempotent: pending folder_clean → success + credit wallet once.
 * Safe to call from polling and webhooks.
 */
export async function finalizeFolderCleanIfPendingByReference(
    reference: string,
    payheroReceipt?: string
): Promise<{
    outcome: FolderCleanPollStatus | 'not_found' | 'wrong_kind';
    walletBalance?: number;
    amount?: number;
    reason?: string;
}> {
    const tx = await TransactionsModel.findOne({
        reference,
        paymentKind: 'folder_clean',
    });
    if (!tx) {
        return { outcome: 'not_found' };
    }
    if (tx.status === 'success') {
        const user = await UserModel.findById(tx.userId).select(
            'walletBalance'
        );
        return {
            outcome: 'success',
            walletBalance: user?.walletBalance ?? 0,
            amount: tx.amount,
        };
    }
    if (tx.status === 'failed') {
        return { outcome: 'failed', reason: 'Transaction failed' };
    }

    const updated = await TransactionsModel.findOneAndUpdate(
        { _id: tx._id, status: 'pending', paymentKind: 'folder_clean' },
        {
            $set: {
                status: 'success',
                ...(payheroReceipt ? { mpesaReceipt: payheroReceipt } : {}),
            },
        },
        { new: true }
    );

    if (!updated) {
        const again = await TransactionsModel.findOne({ reference });
        if (again?.status === 'success') {
            const user = await UserModel.findById(again.userId).select(
                'walletBalance'
            );
            return {
                outcome: 'success',
                walletBalance: user?.walletBalance ?? 0,
                amount: again.amount,
            };
        }
        return { outcome: 'pending' };
    }

    const userAfter = await UserModel.findByIdAndUpdate(
        tx.userId,
        { $inc: { walletBalance: tx.amount } },
        { new: true, select: 'walletBalance' }
    );

    log.info('Folder clean payment finalized; wallet credited', {
        data: { reference, amount: tx.amount },
    });

    return {
        outcome: 'success',
        walletBalance: userAfter?.walletBalance ?? tx.amount,
        amount: tx.amount,
    };
}

export async function finalizeWalletTopupIfPendingByReference(
    reference: string,
    payheroReceipt?: string
): Promise<{
    outcome: FolderCleanPollStatus | 'not_found' | 'wrong_kind';
    walletBalance?: number;
    amount?: number;
    reason?: string;
}> {
    const tx = await TransactionsModel.findOne({
        reference,
        paymentKind: 'wallet_topup',
    });
    if (!tx) {
        return { outcome: 'not_found' };
    }
    if (tx.status === 'success') {
        const user = await UserModel.findById(tx.userId).select(
            'walletBalance'
        );
        return {
            outcome: 'success',
            walletBalance: user?.walletBalance ?? 0,
            amount: tx.amount,
        };
    }
    if (tx.status === 'failed') {
        return { outcome: 'failed', reason: 'Transaction failed' };
    }

    const updated = await TransactionsModel.findOneAndUpdate(
        { _id: tx._id, status: 'pending', paymentKind: 'wallet_topup' },
        {
            $set: {
                status: 'success',
                ...(payheroReceipt ? { mpesaReceipt: payheroReceipt } : {}),
            },
        },
        { new: true }
    );

    if (!updated) {
        const again = await TransactionsModel.findOne({ reference });
        if (again?.status === 'success') {
            const user = await UserModel.findById(again.userId).select(
                'walletBalance'
            );
            return {
                outcome: 'success',
                walletBalance: user?.walletBalance ?? 0,
                amount: again.amount,
            };
        }
        return { outcome: 'pending' };
    }

    const userAfter = await UserModel.findByIdAndUpdate(
        tx.userId,
        { $inc: { walletBalance: tx.amount } },
        { new: true, select: 'walletBalance' }
    );

    log.info('Wallet top-up finalized; wallet credited', {
        data: { reference, amount: tx.amount },
    });

    return {
        outcome: 'success',
        walletBalance: userAfter?.walletBalance ?? tx.amount,
        amount: tx.amount,
    };
}

async function markFolderCleanFailed(
    tx: Transaction_Type,
    reason: string
): Promise<void> {
    await TransactionsModel.updateOne(
        { _id: tx._id, status: 'pending' },
        { $set: { status: 'failed' } }
    );
    log.warn('Folder clean transaction failed', {
        data: { reference: tx.reference, reason },
    });
}

async function markWalletTopupFailed(
    tx: Transaction_Type,
    reason: string
): Promise<void> {
    await TransactionsModel.updateOne(
        { _id: tx._id, status: 'pending' },
        { $set: { status: 'failed' } }
    );
    log.warn('Wallet top-up transaction failed', {
        data: { reference: tx.reference, reason },
    });
}

function mapPayHeroToPollStatus(
    statusRaw: string | undefined
): FolderCleanPollStatus {
    if (!statusRaw) return 'pending';
    const s = statusRaw.toLowerCase();
    if (
        s.includes('success') ||
        s.includes('complete') ||
        s.includes('paid') ||
        s === 'completed'
    ) {
        return 'success';
    }
    if (
        s.includes('fail') ||
        s.includes('cancel') ||
        s.includes('error') ||
        s.includes('declin') ||
        s.includes('timeout') ||
        s.includes('rejected')
    ) {
        return 'failed';
    }
    return 'pending';
}

export async function initiateFolderCleanStk(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authReq = req as AuthenticatedRequest;
    const userPayload = authReq?.user as JWTUserPayload | undefined;
    const userId = userPayload?.uid;
    if (!userId) {
        return next(AppError.unauthorized('Authentication required'));
    }
    if (!PAYHERO_AUTH_TOKEN) {
        log.error('PAYHERO_AUTH_TOKEN is not configured');
        return next(
            new AppError(
                'Payment provider is not configured on server',
                500,
                'ConfigError'
            )
        );
    }

    const { phoneNumber, fileCount } = req.body as {
        phoneNumber?: string;
        fileCount?: number;
    };

    if (phoneNumber == null || String(phoneNumber).trim() === '') {
        return next(AppError.badRequest('phoneNumber is required'));
    }
    const count = Number(fileCount);
    if (!Number.isFinite(count) || count < 1) {
        return next(
            AppError.badRequest('fileCount must be a positive integer')
        );
    }

    const user = await UserModel.findById(userId).select('email tierId');
    if (!user?.email) {
        return next(AppError.notFound('User not found'));
    }

    const maxFiles = maxFolderFilesForTier(user.tierId);
    if (count > maxFiles) {
        return next(
            AppError.badRequest(
                `fileCount exceeds plan limit of ${maxFiles} files`
            )
        );
    }

    const expectedAmount = cleanerChargeAmountKes(count);
    if (expectedAmount <= 0) {
        return next(AppError.badRequest('Invalid payment amount'));
    }

    const reference = 'MPESA_' + crypto.randomUUID();
    const payload = {
        amount: expectedAmount,
        customer_name: user.email,
        channel_id: PAYHERO_CHANNEL_ID,
        phone_number: String(phoneNumber).trim(),
        provider: 'm-pesa',
        external_reference: reference,
    };

    try {
        const payheroResponse = await axios.post(
            PAYHERO_PAYMENTS_URL,
            payload,
            { headers: payheroAuthHeaders() }
        );
        const body = payheroResponse.data;
        log.info('PayHero initiate folder clean response', {
            data: { success: body?.success },
        });

        if (!body?.success) {
            const msg =
                body?.data?.message ||
                body?.message ||
                'PayHero rejected the payment request';
            return next(AppError.badRequest(msg));
        }

        const payheroInternalRef = extractPayHeroInitiateTransactionId(body);
        if (payheroInternalRef) {
            log.debug('PayHero initiate transaction id for status polling', {
                data: {
                    payheroInternalRef,
                    external_reference: reference,
                },
            });
        } else {
            log.warn(
                'PayHero initiate: no internal transaction id in response — status checks will use external_reference only',
                {
                    data: {
                        keys:
                            body?.data && typeof body.data === 'object'
                                ? Object.keys(body.data as object)
                                : [],
                    },
                }
            );
        }

        try {
            await TransactionsModel.create({
                userId,
                amount: expectedAmount,
                email: user.email,
                status: 'pending',
                reference,
                project: 'tidy-up',
                provider: 'mpesa',
                paymentKind: 'folder_clean',
                folderCleanFileCount: count,
                ...(payheroInternalRef ? { payheroInternalRef } : {}),
                createdAt: new Date(),
            });
        } catch (dbErr: unknown) {
            const code =
                dbErr && typeof dbErr === 'object' && 'code' in dbErr
                    ? (dbErr as { code?: number }).code
                    : undefined;
            if (code === 11000) {
                return next(AppError.badRequest('Duplicate payment reference'));
            }
            throw dbErr;
        }

        return res.json({
            status: true,
            message:
                body?.message ||
                'Please complete authorization on your mobile phone',
            data: {
                /** Our DB / client poll key (external_reference). */
                reference,
                /** PayHero’s id when present — same as stored on transaction.payheroInternalRef. */
                payheroReference: payheroInternalRef ?? null,
                amount: expectedAmount,
                fileCount: count,
            },
        });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                const msg =
                    error.response.data?.data?.message ||
                    error.response.data?.message ||
                    error.response.statusText;
                log.error('PayHero initiate error', {
                    data: { status: error.response.status, msg },
                });
                return next(
                    AppError.badRequest(msg || 'PayHero request failed')
                );
            }
            if (error.request) {
                return next(
                    new AppError(
                        'Payment service is currently unavailable. Please try again later.',
                        503,
                        'PaymentError'
                    )
                );
            }
        }
        return next(error);
    }
}

export async function pollFolderCleanPaymentStatus(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authReq = req as AuthenticatedRequest;
    const userPayload = authReq?.user as JWTUserPayload | undefined;
    const userId = userPayload?.uid;
    if (!userId) {
        return next(AppError.unauthorized('Authentication required'));
    }
    if (!PAYHERO_AUTH_TOKEN) {
        return next(
            new AppError(
                'Payment provider is not configured on server',
                500,
                'ConfigError'
            )
        );
    }

    const { reference } = req.params;
    if (!reference || typeof reference !== 'string') {
        return next(AppError.badRequest('reference is required'));
    }

    const tx = await TransactionsModel.findOne({
        reference,
        userId,
        paymentKind: 'folder_clean',
    });
    if (!tx) {
        return next(AppError.notFound('Transaction not found'));
    }

    if (tx.status === 'success') {
        const user = await UserModel.findById(userId).select('walletBalance');
        return res.json({
            status: 'success' as const,
            amount: tx.amount,
            walletBalance: user?.walletBalance ?? 0,
        });
    }
    if (tx.status === 'failed') {
        return res.json({
            status: 'failed' as const,
            reason: 'Payment was not completed',
        });
    }

    try {
        const refCandidates = [
            tx.payheroInternalRef,
            tx.reference,
        ].filter((x): x is string => typeof x === 'string' && x.length > 0);
        const uniqueRefs = [...new Set(refCandidates)];

        let body: unknown | undefined;
        let saw404 = false;

        outer: for (const refQuery of uniqueRefs) {
            for (const statusUrl of statusUrlCandidates(refQuery)) {
                const phRes = await axios.get(statusUrl, {
                    headers: { Authorization: `Basic ${PAYHERO_AUTH_TOKEN}` },
                    validateStatus: (s) => s < 600,
                });

                if (phRes.status === 404) {
                    saw404 = true;
                    log.debug('PayHero status 404 (try next URL/ref)', {
                        data: {
                            refQuery: refQuery.slice(0, 40),
                            path: statusUrl.split('?')[0],
                        },
                    });
                    continue;
                }

                if (phRes.status >= 500) {
                    log.error('PayHero status server error', {
                        data: { status: phRes.status, data: phRes.data },
                    });
                    return next(
                        new AppError(
                            'Payment service is currently unavailable.',
                            503,
                            'PaymentError'
                        )
                    );
                }

                if (phRes.status >= 400) {
                    log.error('PayHero status client error', {
                        data: { status: phRes.status, data: phRes.data },
                    });
                    return next(
                        AppError.badRequest(
                            'Unable to verify payment status. Try again shortly.'
                        )
                    );
                }

                body = phRes.data;
                break outer;
            }
        }

        if (body === undefined) {
            if (saw404) {
                log.warn(
                    'PayHero status: transaction not found yet (all attempts 404) — returning pending',
                    { data: { reference: tx.reference } }
                );
            }
            return res.json({ status: 'pending' as const });
        }

        const statusRaw = extractPayHeroStatus(body);
        const mapped = mapPayHeroToPollStatus(statusRaw);
        const receipt = extractPayHeroReceipt(body);

        log.debug('PayHero transaction status', {
            data: { reference, statusRaw, mapped },
        });

        if (mapped === 'success') {
            const fin = await finalizeFolderCleanIfPendingByReference(
                reference,
                receipt
            );
            if (fin.outcome === 'success') {
                return res.json({
                    status: 'success' as const,
                    amount: fin.amount ?? tx.amount,
                    walletBalance: fin.walletBalance ?? 0,
                });
            }
            if (fin.outcome === 'pending') {
                return res.json({ status: 'pending' as const });
            }
        }

        if (mapped === 'failed') {
            await markFolderCleanFailed(tx, statusRaw || 'failed');
            return res.json({
                status: 'failed' as const,
                reason: statusRaw || 'Payment failed',
            });
        }

        return res.json({ status: 'pending' as const });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
                log.warn('PayHero status network 404 — returning pending', {
                    data: { reference: tx.reference },
                });
                return res.json({ status: 'pending' as const });
            }
            if (error.response) {
                log.error('PayHero status check error', {
                    data: {
                        status: error.response.status,
                        data: error.response.data,
                    },
                });
                return next(
                    AppError.badRequest(
                        'Unable to verify payment status. Try again shortly.'
                    )
                );
            }
            if (error.request) {
                return next(
                    new AppError(
                        'Payment service is currently unavailable.',
                        503,
                        'PaymentError'
                    )
                );
            }
        }
        return next(error);
    }
}

export async function initiateWalletTopupStk(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authReq = req as AuthenticatedRequest;
    const userPayload = authReq?.user as JWTUserPayload | undefined;
    const userId = userPayload?.uid;
    if (!userId) {
        return next(AppError.unauthorized('Authentication required'));
    }
    if (!PAYHERO_AUTH_TOKEN) {
        log.error('PAYHERO_AUTH_TOKEN is not configured');
        return next(
            new AppError(
                'Payment provider is not configured on server',
                500,
                'ConfigError'
            )
        );
    }

    const { phoneNumber, amount: rawAmount } = req.body as {
        phoneNumber?: string;
        amount?: number;
    };

    if (phoneNumber == null || String(phoneNumber).trim() === '') {
        return next(AppError.badRequest('phoneNumber is required'));
    }

    const amountNum = Number(rawAmount);
    if (!Number.isFinite(amountNum)) {
        return next(AppError.badRequest('amount must be a number'));
    }
    const rounded = Math.round(amountNum * 100) / 100;
    if (rounded < MIN_WALLET_TOPUP_KES) {
        return next(
            AppError.badRequest(
                `Minimum top-up is KES ${MIN_WALLET_TOPUP_KES.toFixed(2)}`
            )
        );
    }
    if (rounded > MAX_WALLET_TOPUP_KES) {
        return next(
            AppError.badRequest(
                `Maximum top-up is KES ${MAX_WALLET_TOPUP_KES.toLocaleString()}`
            )
        );
    }

    const user = await UserModel.findById(userId).select('email');
    if (!user?.email) {
        return next(AppError.notFound('User not found'));
    }

    const reference = 'MPESA_' + crypto.randomUUID();
    const payload = {
        amount: rounded,
        customer_name: user.email,
        channel_id: PAYHERO_CHANNEL_ID,
        phone_number: String(phoneNumber).trim(),
        provider: 'm-pesa',
        external_reference: reference,
    };

    try {
        const payheroResponse = await axios.post(
            PAYHERO_PAYMENTS_URL,
            payload,
            { headers: payheroAuthHeaders() }
        );
        const body = payheroResponse.data;
        log.info('PayHero initiate wallet top-up response', {
            data: { success: body?.success },
        });

        if (!body?.success) {
            const msg =
                body?.data?.message ||
                body?.message ||
                'PayHero rejected the payment request';
            return next(AppError.badRequest(msg));
        }

        const payheroInternalRef = extractPayHeroInitiateTransactionId(body);

        try {
            await TransactionsModel.create({
                userId,
                amount: rounded,
                email: user.email,
                status: 'pending',
                reference,
                project: 'tidy-up',
                provider: 'mpesa',
                paymentKind: 'wallet_topup',
                ...(payheroInternalRef ? { payheroInternalRef } : {}),
                createdAt: new Date(),
            });
        } catch (dbErr: unknown) {
            const code =
                dbErr && typeof dbErr === 'object' && 'code' in dbErr
                    ? (dbErr as { code?: number }).code
                    : undefined;
            if (code === 11000) {
                return next(AppError.badRequest('Duplicate payment reference'));
            }
            throw dbErr;
        }

        return res.json({
            status: true,
            message:
                body?.message ||
                'Please complete authorization on your mobile phone',
            data: {
                reference,
                payheroReference: payheroInternalRef ?? null,
                amount: rounded,
            },
        });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                const msg =
                    error.response.data?.data?.message ||
                    error.response.data?.message ||
                    error.response.statusText;
                log.error('PayHero initiate wallet top-up error', {
                    data: { status: error.response.status, msg },
                });
                return next(
                    AppError.badRequest(msg || 'PayHero request failed')
                );
            }
            if (error.request) {
                return next(
                    new AppError(
                        'Payment service is currently unavailable. Please try again later.',
                        503,
                        'PaymentError'
                    )
                );
            }
        }
        return next(error);
    }
}

export async function pollWalletTopupPaymentStatus(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authReq = req as AuthenticatedRequest;
    const userPayload = authReq?.user as JWTUserPayload | undefined;
    const userId = userPayload?.uid;
    if (!userId) {
        return next(AppError.unauthorized('Authentication required'));
    }
    if (!PAYHERO_AUTH_TOKEN) {
        return next(
            new AppError(
                'Payment provider is not configured on server',
                500,
                'ConfigError'
            )
        );
    }

    const { reference } = req.params;
    if (!reference || typeof reference !== 'string') {
        return next(AppError.badRequest('reference is required'));
    }

    const tx = await TransactionsModel.findOne({
        reference,
        userId,
        paymentKind: 'wallet_topup',
    });
    if (!tx) {
        return next(AppError.notFound('Transaction not found'));
    }

    if (tx.status === 'success') {
        const user = await UserModel.findById(userId).select('walletBalance');
        return res.json({
            status: 'success' as const,
            amount: tx.amount,
            walletBalance: user?.walletBalance ?? 0,
        });
    }
    if (tx.status === 'failed') {
        return res.json({
            status: 'failed' as const,
            reason: 'Payment was not completed',
        });
    }

    try {
        const refCandidates = [
            tx.payheroInternalRef,
            tx.reference,
        ].filter((x): x is string => typeof x === 'string' && x.length > 0);
        const uniqueRefs = [...new Set(refCandidates)];

        let body: unknown | undefined;
        let saw404 = false;

        outer: for (const refQuery of uniqueRefs) {
            for (const statusUrl of statusUrlCandidates(refQuery)) {
                const phRes = await axios.get(statusUrl, {
                    headers: { Authorization: `Basic ${PAYHERO_AUTH_TOKEN}` },
                    validateStatus: (s) => s < 600,
                });

                if (phRes.status === 404) {
                    saw404 = true;
                    log.debug('PayHero status 404 (wallet top-up)', {
                        data: {
                            refQuery: refQuery.slice(0, 40),
                            path: statusUrl.split('?')[0],
                        },
                    });
                    continue;
                }

                if (phRes.status >= 500) {
                    log.error('PayHero status server error', {
                        data: { status: phRes.status, data: phRes.data },
                    });
                    return next(
                        new AppError(
                            'Payment service is currently unavailable.',
                            503,
                            'PaymentError'
                        )
                    );
                }

                if (phRes.status >= 400) {
                    log.error('PayHero status client error', {
                        data: { status: phRes.status, data: phRes.data },
                    });
                    return next(
                        AppError.badRequest(
                            'Unable to verify payment status. Try again shortly.'
                        )
                    );
                }

                body = phRes.data;
                break outer;
            }
        }

        if (body === undefined) {
            if (saw404) {
                log.warn(
                    'PayHero wallet top-up status: not found yet — pending',
                    { data: { reference: tx.reference } }
                );
            }
            return res.json({ status: 'pending' as const });
        }

        const statusRaw = extractPayHeroStatus(body);
        const mapped = mapPayHeroToPollStatus(statusRaw);
        const receipt = extractPayHeroReceipt(body);

        log.debug('PayHero wallet top-up transaction status', {
            data: { reference, statusRaw, mapped },
        });

        if (mapped === 'success') {
            const fin = await finalizeWalletTopupIfPendingByReference(
                reference,
                receipt
            );
            if (fin.outcome === 'success') {
                return res.json({
                    status: 'success' as const,
                    amount: fin.amount ?? tx.amount,
                    walletBalance: fin.walletBalance ?? 0,
                });
            }
            if (fin.outcome === 'pending') {
                return res.json({ status: 'pending' as const });
            }
        }

        if (mapped === 'failed') {
            await markWalletTopupFailed(tx, statusRaw || 'failed');
            return res.json({
                status: 'failed' as const,
                reason: statusRaw || 'Payment failed',
            });
        }

        return res.json({ status: 'pending' as const });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
                log.warn('PayHero wallet top-up status network 404 — pending', {
                    data: { reference: tx.reference },
                });
                return res.json({ status: 'pending' as const });
            }
            if (error.response) {
                log.error('PayHero wallet top-up status check error', {
                    data: {
                        status: error.response.status,
                        data: error.response.data,
                    },
                });
                return next(
                    AppError.badRequest(
                        'Unable to verify payment status. Try again shortly.'
                    )
                );
            }
            if (error.request) {
                return next(
                    new AppError(
                        'Payment service is currently unavailable.',
                        503,
                        'PaymentError'
                    )
                );
            }
        }
        return next(error);
    }
}

export async function chargeWalletForFolderCleaner(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authReq = req as AuthenticatedRequest;
    const userPayload = authReq?.user as JWTUserPayload | undefined;
    const userId = userPayload?.uid;
    if (!userId) {
        return next(AppError.unauthorized('Authentication required'));
    }

    const { fileCount } = req.body as { fileCount?: number };
    const count = Number(fileCount);
    if (!Number.isFinite(count) || count < 1) {
        return next(
            AppError.badRequest('fileCount must be a positive integer')
        );
    }

    const amount = cleanerChargeAmountKes(count);
    if (amount <= 0) {
        return next(AppError.badRequest('Invalid charge amount'));
    }

    const userAfterDebit = await UserModel.findOneAndUpdate(
        { _id: userId, walletBalance: { $gte: amount } },
        { $inc: { walletBalance: -amount } },
        { new: true, select: 'walletBalance email' }
    );
    if (!userAfterDebit) {
        return next(
            AppError.badRequest(
                `Insufficient wallet balance for this service (KES ${amount.toFixed(2)}).`
            )
        );
    }

    const chargeReference = `WALLET_CHARGE_${crypto.randomUUID()}`;
    try {
        await TransactionsModel.create({
            userId,
            amount,
            email: userAfterDebit.email,
            status: 'success',
            reference: chargeReference,
            project: 'tidy-up',
            provider: 'wallet',
            paymentKind: 'billing',
            folderCleanFileCount: count,
            createdAt: new Date(),
        });
    } catch (error) {
        await UserModel.findByIdAndUpdate(userId, {
            $inc: { walletBalance: amount },
        });
        throw error;
    }

    return res.status(200).json({
        status: 'success',
        walletBalance: userAfterDebit.walletBalance ?? 0,
        amount,
        chargeReference,
    });
}

export async function refundWalletCharge(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authReq = req as AuthenticatedRequest;
    const userPayload = authReq?.user as JWTUserPayload | undefined;
    const userId = userPayload?.uid;
    if (!userId) {
        return next(AppError.unauthorized('Authentication required'));
    }

    const { chargeReference, reason } = req.body as {
        chargeReference?: string;
        reason?: string;
    };
    if (!chargeReference || typeof chargeReference !== 'string') {
        return next(AppError.badRequest('chargeReference is required'));
    }

    const chargeTx = await TransactionsModel.findOne({
        userId,
        reference: chargeReference,
        paymentKind: 'billing',
    });
    if (!chargeTx) {
        return next(AppError.notFound('Original service charge not found'));
    }

    const refundReference = `WALLET_REFUND_${chargeReference}`;
    const existingRefund = await TransactionsModel.findOne({
        reference: refundReference,
        userId,
    });
    if (existingRefund) {
        const user = await UserModel.findById(userId).select('walletBalance');
        return res.status(200).json({
            status: 'success',
            walletBalance: user?.walletBalance ?? 0,
            refundReference,
            amount: chargeTx.amount,
        });
    }

    const user = await UserModel.findByIdAndUpdate(
        userId,
        { $inc: { walletBalance: chargeTx.amount } },
        { new: true, select: 'walletBalance email' }
    );

    await TransactionsModel.create({
        userId,
        amount: chargeTx.amount,
        email: user?.email ?? chargeTx.email,
        status: 'success',
        reference: refundReference,
        project: reason ? `refund:${reason}` : 'refund:upload_failed',
        provider: 'wallet',
        paymentKind: 'billing',
        createdAt: new Date(),
    });

    return res.status(200).json({
        status: 'success',
        walletBalance: user?.walletBalance ?? 0,
        refundReference,
        amount: chargeTx.amount,
    });
}
