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
import { mergerChargeAmountKes } from '../constants/mergerPricing.js';
//import { maxFolderFilesForTier } from '../constants/tierUploadLimits.js';
import PayheroService, {
    type TransactionStatusResponse,
} from '../services/payheroService.js';
const log = createLogger('payHeroPayment.ts');

const PAYHERO_AUTH_TOKEN = process.env.PAYHERO_AUTH_TOKEN;
//const PAYHERO_PAYMENTS_URL = 'https://backend.payhero.co.ke/api/v2/payments';

//const PAYHERO_CHANNEL_ID = Number(process.env.PAYHERO_CHANNEL_ID) || 7067;
const MIN_WALLET_TOPUP_KES = 10;
const MAX_WALLET_TOPUP_KES = 500_000;
const PAYHERO_STATUS_INITIAL_DELAY_MS = 3500;
const PAYHERO_STATUS_RETRY_DELAYS_MS = [2000, 3000, 5000, 8000, 12000];

const delay = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

function normalizePayHeroPollStatus(
    status: TransactionStatusResponse['status'] | undefined
): 'SUCCESS' | 'FAILED' | 'PROCESSING' {
    if (status === 'SUCCESS') return 'SUCCESS';
    if (status === 'FAILED') return 'FAILED';
    return 'PROCESSING';
}

/*export async function pollPayHeroStatusWithRetry(
    reference: string,
    options?: {
        initialDelayMs?: number;
        retryDelaysMs?: number[];
        delayFn?: (ms: number) => Promise<void>;
    }
): Promise<{
    status: 'SUCCESS' | 'FAILED' | 'PROCESSING';
    data?: TransactionStatusResponse;
} | null> {
    const initialDelayMs =
        options?.initialDelayMs ?? PAYHERO_STATUS_INITIAL_DELAY_MS;
    const retryDelaysMs =
        options?.retryDelaysMs ?? PAYHERO_STATUS_RETRY_DELAYS_MS;
    const delayFn = options?.delayFn ?? delay;

    await delayFn(initialDelayMs);

    for (let attempt = 0; attempt <= retryDelaysMs.length; attempt++) {
        try {
            const status = await PayheroService.getTransactionStatus(reference);
            return {
                status: normalizePayHeroPollStatus(status.status),
                data: status,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const responsePayload = error.response?.data as
                    | {
                          message?: string;
                          error_message?: string;
                      }
                    | undefined;
                const payloadMessage =
                    responsePayload?.message || responsePayload?.error_message;
                const isReferenceNotFound =
                    error.response?.status === 404 ||
                    (typeof payloadMessage === 'string' &&
                        payloadMessage
                            .toLowerCase()
                            .includes('reference not found'));

                if (isReferenceNotFound) {
                    log.warn(
                        'PayHero status is not indexed yet; retrying as pending',
                        {
                            data: {
                                reference,
                                attempt: attempt + 1,
                                statusCode: error.response?.status,
                                message:
                                    payloadMessage || 'reference not found',
                            },
                        }
                    );

                    if (attempt === retryDelaysMs.length) {
                        return { status: 'PROCESSING' };
                    }

                    await delayFn(retryDelaysMs[attempt]);
                    continue;
                }
            }

            throw error;
        }
    }

    return { status: 'PROCESSING' };
}*/

export type FolderCleanPollStatus = 'PROCESSING' | 'SUCCESS' | 'FAILED';

/**
 * Idempotent: pending folder_clean → success + credit wallet once.
 * Safe to call from polling and webhooks.
 */
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

    const { phoneNumber, fileCount, idempotentKey, amount } = req.body as {
        phoneNumber?: string;
        fileCount?: number;
        idempotentKey?: string;
        amount?: number;
    };
    const idempotencyKey = (req.header('Idempotency-Key') ||
        req.header('Idempotent-Key') ||
        idempotentKey) as string | undefined;

    if (phoneNumber == null || String(phoneNumber).trim() === '') {
        return next(AppError.badRequest('phoneNumber is required'));
    }
    const count = Number(fileCount);
    if (!Number.isFinite(count) || count < 1) {
        return next(
            AppError.badRequest('fileCount must be a positive integer')
        );
    }

    const user = await UserModel.findById(userId).select('email');
    if (!user?.email) {
        return next(AppError.notFound('User not found'));
    }

    /*const maxFiles = maxFolderFilesForTier(user.tierId);
    if (count > maxFiles) {
        return next(
            AppError.badRequest(
                `fileCount exceeds plan limit of ${maxFiles} files`
            )
        );
    }*/

    const computedAmount = cleanerChargeAmountKes(count);
    const rawRequestedAmount = Number(amount);
    const expectedAmount =
        Number.isFinite(rawRequestedAmount) && rawRequestedAmount > 0
            ? rawRequestedAmount
            : computedAmount;
    if (expectedAmount <= 0) {
        return next(AppError.badRequest('Invalid payment amount'));
    }
    const amountNum = Number(expectedAmount);
    if (!Number.isFinite(amountNum)) {
        return next(AppError.badRequest('amount must be a number'));
    }
    const roundedExpectedAmount = Math.ceil(amountNum);

    const reference = 'MPESA_' + crypto.randomUUID();
    if (idempotencyKey) {
        const existingTx = await TransactionsModel.findOne({ idempotencyKey });
        if (existingTx) {
            return res.status(200).json({
                success: true,
                message: 'Existing payment request returned (idempotent)',
                userId,
                amount: existingTx.amount,
                email: existingTx.email,
                status: 'PROCESSING',
                paymentKind: 'folder_clean',
                folderCleanFileCount: existingTx.folderCleanFileCount,
                reference,
            });
        }
    }
    try {
        const response = await PayheroService.initiatePayment({
            amount: roundedExpectedAmount,
            phone_number: String(phoneNumber).trim(),
            external_reference: reference,
            provider: 'm-pesa',
            customer_name: user.email,
        });
        log.debug('PAYHERO RESPONSE', {
            data: {
                reference: response.reference,
                checkoutRequestId: response.CheckoutRequestID,
                response,
            },
        });
        log.debug('PAYHERO RESPONSE WHOLE BODY', {
            data: {
                response,
            },
        });
        if (!response?.success) {
            const msg =
                // response?.data?.message ||
                // response?.message ||
                'PayHero rejected the payment request';
            return next(AppError.badRequest(msg));
        }

        const payheroInternalRef = response.reference;

        try {
            await TransactionsModel.create({
                userId,
                amount: roundedExpectedAmount,
                email: user.email,
                status: 'QUEUED',
                reference: payheroInternalRef,
                //reference
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
        log.debug(`reference sent form payment initiation ${reference}`);
        return res.json({
            success: true,
            status: response.status,
            message:
                //body?.message ||
                'Please complete authorization on your mobile phone',
            data: {
                /** Our DB / client poll key (external_reference). */
                reference,
                /** PayHero’s id when present — same as stored on transaction.payheroInternalRef. */
                payheroReference: payheroInternalRef ?? null,
                amount: roundedExpectedAmount,
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
export async function initiateFileMergerStk(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authReq = req as AuthenticatedRequest;
    const userPayload = authReq?.user as JWTUserPayload | undefined;
    const userId = userPayload?.uid;
    if (!userId) return next(AppError.unauthorized('Authentication required'));
    if (!PAYHERO_AUTH_TOKEN) {
        return next(
            new AppError(
                'Payment provider is not configured on server',
                500,
                'ConfigError'
            )
        );
    }

    const { phoneNumber, pageCount, idempotentKey, amount } = req.body as {
        phoneNumber?: string;
        pageCount?: number;
        idempotentKey?: string;
        amount?: number;
    };
    if (phoneNumber == null || String(phoneNumber).trim() === '') {
        return next(AppError.badRequest('phoneNumber is required'));
    }
    const count = Number(pageCount);
    if (!Number.isFinite(count) || count < 1) {
        return next(
            AppError.badRequest('pageCount must be a positive integer')
        );
    }
    const idempotencyKey =
        req.header('Idempotency-Key') ||
        req.header('Idempotent-Key') ||
        (idempotentKey as string | undefined);
    log.debug(`the idempotency key ${idempotencyKey}`);
    const user = await UserModel.findById(userId).select('email');
    if (!user?.email) return next(AppError.notFound('User not found'));

    const computedAmount = mergerChargeAmountKes(count);
    const rawRequestedAmount = Number(amount);
    const expectedAmount =
        Number.isFinite(rawRequestedAmount) && rawRequestedAmount > 0
            ? rawRequestedAmount
            : computedAmount;
    if (expectedAmount <= 0) {
        return next(AppError.badRequest('Invalid payment amount'));
    }

    const reference = 'MPESA_' + crypto.randomUUID();
    if (idempotencyKey) {
        const existingTx = await TransactionsModel.findOne({ idempotencyKey });
        if (existingTx) {
            return res.status(200).json({
                success: true,
                message: 'Existing payment request returned (idempotent)',
                userId,
                amount: existingTx.amount,
                email: existingTx.email,
                status: 'PROCESSING',
                paymentKind: 'file_merger',
                mergerPageCount: existingTx.mergerPageCount,

                reference,
            });
        }
    }
    try {
        const response = await PayheroService.initiatePayment({
            amount: expectedAmount,
            phone_number: String(phoneNumber).trim(),
            external_reference: reference,
            provider: 'm-pesa',
            customer_name: user.email,
        });
        log.debug('PAYHERO RESPONSE', {
            data: {
                reference: response.reference,
                checkoutRequestId: response.CheckoutRequestID,
                response,
            },
        });
        log.debug('PAYHERO RESPONSE WHOLE BODY', {
            data: {
                response,
            },
        });
        if (!response?.success) {
            const msg =
                // response?.data?.message ||
                // response?.message ||
                'PayHero rejected the payment request';
            return next(AppError.badRequest(msg));
        }

        const payheroInternalRef = response.reference;

        await TransactionsModel.create({
            userId,
            amount: expectedAmount,
            email: user.email,
            status: 'QUEUED',
            reference,
            project: 'tidy-up',
            provider: 'mpesa',
            paymentKind: 'file_merger',
            mergerPageCount: count,
            ...(payheroInternalRef ? { payheroInternalRef } : {}),
            createdAt: new Date(),
        });

        return res.json({
            status: true,
            message:
                //body?.message ||
                'Please complete authorization on your mobile phone',
            data: {
                reference,
                payheroReference: payheroInternalRef ?? null,
                amount: expectedAmount,
                pageCount: count,
            },
        });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                const msg =
                    error.response.data?.data?.message ||
                    error.response.data?.message ||
                    error.response.statusText;
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
export async function initiateWalletTopupStk(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authReq = req as AuthenticatedRequest;
    const userPayload = authReq?.user as JWTUserPayload | undefined;
    const userId = userPayload?.uid;
    const {
        phoneNumber,
        amount: rawAmount,
        idempotentKey,
    } = req.body as {
        phoneNumber?: string;
        amount?: number;
        idempotentKey?: string;
    };
    const idempotencyKey = (req.header('Idempotency-Key') || idempotentKey) as
        | string
        | undefined;
    if (!userId) {
        return next(AppError.unauthorized('Authentication required'));
    }
    const user = await UserModel.findById(userId).select('email');
    if (!user?.email) {
        return next(AppError.notFound('User not found'));
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

    if (phoneNumber == null || String(phoneNumber).trim() === '') {
        return next(AppError.badRequest('pPhone Number is required'));
    }

    const amountNum = Number(rawAmount);
    if (!Number.isFinite(amountNum)) {
        return next(AppError.badRequest('amount must be a number'));
    }
    const rounded = Math.ceil(amountNum);
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

    const reference = 'MPESA_' + crypto.randomUUID();
    if (idempotencyKey) {
        const existingTx = await TransactionsModel.findOne({ idempotencyKey });
        if (existingTx) {
            return res.status(200).json({
                success: true,
                message: 'Existing payment request returned (idempotent)',
                userId,
                amount: existingTx.amount,
                email: existingTx.email,
                status: 'PROCESSING',
                paymentKind: 'wallet_topup',

                reference,
            });
        }
    }
    try {
        const response = await PayheroService.initiatePayment({
            amount: rounded,
            phone_number: String(phoneNumber).trim(),
            external_reference: reference,
            provider: 'm-pesa',
            customer_name: user.email,
        });

        log.debug('PAYHERO RESPONSE WHOLE BODY', {
            data: {
                response,
            },
        });
        if (!response?.success) {
            const msg =
                // response?.data?.message ||
                // response?.message ||
                'PayHero rejected the payment request';
            return next(AppError.badRequest(msg));
        }

        const payheroInternalRef = response.reference;

        try {
            await TransactionsModel.create({
                userId,
                amount: rounded,
                email: user.email,
                status: 'QUEUED',
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

        return res.status(200).json({
            status: true,
            message:
                //body?.message ||
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

//this is what updates the transaction collection
export async function pollFolderCleanPaymentStatus(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const { reference } = req.params;
    const authReq = req as AuthenticatedRequest;
    const userPayload = authReq?.user as JWTUserPayload | undefined;
    const userId = userPayload?.uid;
    if (!userId) {
        return next(AppError.unauthorized('Authentication required'));
    }
    const user = await UserModel.findById(userId).select('walletBalance');

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
    log.debug(` transaction status ${tx.status}`);
    if (tx.status === 'SUCCESS') {
        return res.status(200).json({
            status: 'SUCCESS' as const,
            amount: tx.amount,
            walletBalance: user?.walletBalance ?? 0,
        });
    }
    if (tx.status === 'FAILED') {
        return res.status(400).json({
            status: 'FAILED' as const,
            reason: 'Payment was not completed',
        });
    }
    if (tx.webhookReceived) {
        return res.status(200).json({
            status: 'SUCCESS' as const,
            amount: tx.amount,
            reference: tx.reference,
            walletBalance: user?.walletBalance ?? 0,
        });
    } else {
        log.warn('No webhook received proceeding with status checking ...');
    }

    try {
        log.debug(`the reference number ${reference}`);
        const statusResponse =
            await PayheroService.getTransactionStatus(reference);
        log.debug(
            `The status response from the transaction poll ${statusResponse.status}`,
            { data: { statusResponse } }
        );

        //const statusResponse = await pollPayHeroStatusWithRetry(reference);
        if (!statusResponse || statusResponse.status === 'PROCESSING') {
            return res.status(200).json({ status: 'PROCESSING' as const });
        }

        const status = statusResponse.status as
            | { status?: 'SUCCESS' | 'FAILED' | 'PROCESSING' | 'QUEUED' }
            | undefined;

        if (status?.status === 'SUCCESS') {
            const final =
                await finalizeFolderCleanIfPendingByReference(reference);
            if (final.outcome === 'SUCCESS') {
                return res.status(200).json({
                    status: 'SUCCESS' as const,
                    amount: final.amount ?? tx.amount,
                    walletBalance: final.walletBalance ?? 0,
                });
            }
            if (final.outcome === 'PROCESSING') {
                return res.status(200).json({ status: 'PROCESSING' as const });
            }
        }

        if (status?.status === 'FAILED') {
            const failureReason = describePayHeroFailure(status.status);
            await markFolderCleanFailed(tx, failureReason);
            return res.status(400).json({
                status: 'FAILED' as const,
                reason: failureReason,
            });
        }

        return res.status(200).json({ status: 'PROCESSING' as const });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
                log.warn('PayHero status network 404 — returning pending', {
                    data: { reference: tx.reference },
                });
                return res.json({ status: 'PROCESSING' as const });
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
    const user = await UserModel.findById(userId).select('walletBalance');
    const tx = await TransactionsModel.findOne({
        reference,
        userId,
        paymentKind: 'wallet_topup',
    });
    if (!tx) {
        return next(AppError.notFound('Transaction not found'));
    }

    if (tx.status === 'SUCCESS') {
        return res.status(200).json({
            status: 'SUCCESS' as const,
            amount: tx.amount,
            walletBalance: user?.walletBalance ?? 0,
        });
    }
    if (tx.status === 'FAILED') {
        return res.status(400).json({
            status: 'FAILED' as const,
            reason: 'Payment was not completed',
        });
    }
    if (tx.webhookReceived) {
        return res.status(200).json({
            status: 'SUCCESS' as const,
            amount: tx.amount,
            reference: tx.reference,
            walletBalance: user?.walletBalance ?? 0,
        });
    } else {
        log.warn('No webhook received proceeding with status checking ...');
    }

    try {
        const statusResponse =
            await PayheroService.getTransactionStatus(reference);
        if (!statusResponse || statusResponse.status === 'PROCESSING') {
            return res.json({ status: 'PROCESSING' as const });
        }

        const status = statusResponse.status as
            | { status?: 'SUCCESS' | 'FAILED' | 'PROCESSING' | 'QUEUED' }
            | undefined;

        if (status?.status === 'SUCCESS') {
            const final =
                await finalizeWalletTopupIfPendingByReference(reference);
            if (final.outcome === 'SUCCESS') {
                return res.json({
                    status: 'SUCCESS' as const,
                    amount: final.amount ?? tx.amount,
                    walletBalance: final.walletBalance ?? 0,
                });
            }
            if (final.outcome === 'PROCESSING') {
                return res.json({ status: 'PROCESSING' as const });
            }
        }

        if (status?.status === 'FAILED') {
            const failureReason = describePayHeroFailure(status.status);
            await markWalletTopupFailed(tx, failureReason);
            return res.json({
                status: 'FAILED' as const,
                reason: failureReason,
            });
        }

        return res.json({ status: 'PROCESSING' as const });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
                log.warn('PayHero wallet top-up status network 404 — pending', {
                    data: { reference: tx.reference },
                });
                return res.json({ status: 'PROCESSING' as const });
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

export async function pollFileMergerPaymentStatus(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authReq = req as AuthenticatedRequest;
    const userPayload = authReq?.user as JWTUserPayload | undefined;
    const userId = userPayload?.uid;
    if (!userId) return next(AppError.unauthorized('Authentication required'));

    const { reference } = req.params;
    if (!reference || typeof reference !== 'string') {
        return next(AppError.badRequest('reference is required'));
    }
    const user = await UserModel.findById(userId).select('walletBalance');
    const tx = await TransactionsModel.findOne({
        reference,
        userId,
        paymentKind: 'file_merger',
    });
    if (!tx) return next(AppError.notFound('Transaction not found'));

    if (tx.status === 'SUCCESS') {
        return res.json({
            status: 'SUCCESS' as const,
            amount: tx.amount,
            walletBalance: user?.walletBalance ?? 0,
        });
    }
    if (tx.status === 'FAILED') {
        return res.json({
            status: 'FAILED' as const,
            reason: 'Payment was not completed',
        });
    }
    if (tx.webhookReceived) {
        return res.status(200).json({
            status: 'SUCCESS' as const,
            amount: tx.amount,
            reference: tx.reference,
            walletBalance: user?.walletBalance ?? 0,
        });
    } else {
        log.warn('No webhook received proceeding with status checking ...');
    }
    try {
        const statusResponse =
            await PayheroService.getTransactionStatus(reference);
        if (!statusResponse || statusResponse.status === 'PROCESSING') {
            return res.json({ status: 'PROCESSING' as const });
        }

        const status = statusResponse.status as
            | { status?: 'SUCCESS' | 'FAILED' | 'PROCESSING' | 'QUEUED' }
            | undefined;

        if (status?.status === 'SUCCESS') {
            const final = await finalizeFileMergerIfPendingByReference(
                reference
                //receipt
            );
            if (final.outcome === 'SUCCESS') {
                return res.json({
                    status: 'SUCCESS' as const,
                    amount: final.amount ?? tx.amount,
                    walletBalance: final.walletBalance ?? 0,
                });
            }
            if (final.outcome === 'PROCESSING') {
                return res.json({ status: 'PROCESSING' as const });
            }
        }
        if (status?.status === 'FAILED') {
            const failureReason = describePayHeroFailure(status.status);
            await markFileMergerFailed(tx, failureReason);
            return res.json({
                status: 'FAILED' as const,
                reason: failureReason,
            });
        }
        return res.json({ status: 'PROCESSING' as const });
    } catch (error) {
        if (axios.isAxiosError(error) && error.request) {
            return next(
                new AppError(
                    'Payment service is currently unavailable.',
                    503,
                    'PaymentError'
                )
            );
        }
        return next(error);
    }
}

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
    if (tx.status === 'SUCCESS') {
        const user = await UserModel.findById(tx.userId).select(
            'walletBalance'
        );
        return {
            outcome: 'SUCCESS',
            walletBalance: user?.walletBalance ?? 0,
            amount: tx.amount,
        };
    }
    if (tx.status === 'FAILED') {
        return { outcome: 'FAILED', reason: 'Transaction failed' };
    }

    const updated = await TransactionsModel.findOneAndUpdate(
        { _id: tx._id, status: 'PROCESSING', paymentKind: 'folder_clean' },
        {
            $set: {
                status: 'SUCCESS',
                ...(payheroReceipt ? { mpesaReceipt: payheroReceipt } : {}),
            },
        },
        { returnDocument: 'after' }
    );

    if (!updated) {
        const again = await TransactionsModel.findOne({ reference });
        if (again?.status === 'SUCCESS') {
            const user = await UserModel.findById(again.userId).select(
                'walletBalance'
            );
            return {
                outcome: 'SUCCESS',
                walletBalance: user?.walletBalance ?? 0,
                amount: again.amount,
            };
        }
        return { outcome: 'PROCESSING' };
    }

    const userAfter = await UserModel.findByIdAndUpdate(
        tx.userId,
        { $inc: { walletBalance: tx.amount } },
        { returnDocument: 'after', select: 'walletBalance' }
    );

    log.info('Folder clean payment finalized; wallet credited', {
        data: { reference, amount: tx.amount },
    });

    return {
        outcome: 'SUCCESS',
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
    if (tx.status === 'SUCCESS') {
        const user = await UserModel.findById(tx.userId).select(
            'walletBalance'
        );
        return {
            outcome: 'SUCCESS',
            walletBalance: user?.walletBalance ?? 0,
            amount: tx.amount,
        };
    }
    if (tx.status === 'FAILED') {
        return { outcome: 'FAILED', reason: 'Transaction failed' };
    }

    const updated = await TransactionsModel.findOneAndUpdate(
        { _id: tx._id, status: 'PROCESSING', paymentKind: 'wallet_topup' },
        {
            $set: {
                status: 'SUCCESS',
                ...(payheroReceipt ? { mpesaReceipt: payheroReceipt } : {}),
            },
        },
        { returnDocument: 'after' }
    );

    if (!updated) {
        const again = await TransactionsModel.findOne({ reference });
        if (again?.status === 'SUCCESS') {
            const user = await UserModel.findById(again.userId).select(
                'walletBalance'
            );
            return {
                outcome: 'SUCCESS',
                walletBalance: user?.walletBalance ?? 0,
                amount: again.amount,
            };
        }
        return { outcome: 'PROCESSING' };
    }

    const userAfter = await UserModel.findByIdAndUpdate(
        tx.userId,
        { $inc: { walletBalance: tx.amount } },
        { returnDocument: 'after', select: 'walletBalance' }
    );

    log.info('Wallet top-up finalized; wallet credited', {
        data: { reference, amount: tx.amount },
    });

    return {
        outcome: 'SUCCESS',
        walletBalance: userAfter?.walletBalance ?? tx.amount,
        amount: tx.amount,
    };
}

export async function finalizeFileMergerIfPendingByReference(
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
        paymentKind: 'file_merger',
    });
    if (!tx) {
        return { outcome: 'not_found' };
    }
    if (tx.status === 'SUCCESS') {
        const user = await UserModel.findById(tx.userId).select(
            'walletBalance'
        );
        return {
            outcome: 'SUCCESS',
            walletBalance: user?.walletBalance ?? 0,
            amount: tx.amount,
        };
    }
    if (tx.status === 'FAILED') {
        return { outcome: 'FAILED', reason: 'Transaction failed' };
    }

    const updated = await TransactionsModel.findOneAndUpdate(
        { _id: tx._id, status: 'PROCESSING', paymentKind: 'file_merger' },
        {
            $set: {
                status: 'SUCCESS',
                ...(payheroReceipt ? { mpesaReceipt: payheroReceipt } : {}),
            },
        },
        { returnDocument: 'after' }
    );

    if (!updated) {
        const again = await TransactionsModel.findOne({ reference });
        if (again?.status === 'SUCCESS') {
            const user = await UserModel.findById(again.userId).select(
                'walletBalance'
            );
            return {
                outcome: 'SUCCESS',
                walletBalance: user?.walletBalance ?? 0,
                amount: again.amount,
            };
        }
        return { outcome: 'PROCESSING' };
    }

    const userAfter = await UserModel.findByIdAndUpdate(
        tx.userId,
        { $inc: { walletBalance: tx.amount } },
        { returnDocument: 'after', select: 'walletBalance' }
    );

    return {
        outcome: 'SUCCESS',
        walletBalance: userAfter?.walletBalance ?? tx.amount,
        amount: tx.amount,
    };
}

async function markFolderCleanFailed(
    tx: Transaction_Type,
    reason: string
): Promise<void> {
    await TransactionsModel.updateOne(
        { _id: tx._id, status: 'PROCESSING' },
        { $set: { status: 'FAILED' } }
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
        { _id: tx._id, status: 'PROCESSING' },
        { $set: { status: 'FAILED' } }
    );
    log.warn('Wallet top-up transaction failed', {
        data: { reference: tx.reference, reason },
    });
}
async function markFileMergerFailed(
    tx: Transaction_Type,
    reason: string
): Promise<void> {
    await TransactionsModel.updateOne(
        { _id: tx._id, status: 'PROCESSING' },
        { $set: { status: 'FAILED' } }
    );
    log.warn('File merger transaction failed', {
        data: { reference: tx.reference, reason },
    });
}

// function mapPayHeroToPollStatus(
//     statusRaw: string | undefined
// ): FolderCleanPollStatus {
//     if (!statusRaw) return 'pending';
//     const s = statusRaw.toLowerCase();
//     if (
//         s.includes('success') ||
//         s.includes('complete') ||
//         s.includes('paid') ||
//         s === 'completed'
//     ) {
//         return 'success';
//     }
//     if (
//         s.includes('fail') ||
//         s.includes('cancel') ||
//         s.includes('error') ||
//         s.includes('declin') ||
//         s.includes('timeout') ||
//         s.includes('expired') ||
//         s.includes('rejected') ||
//         s.includes('insufficient')
//     ) {
//         return 'failed';
//     }
//     return 'pending';
// }

function describePayHeroFailure(statusRaw: string | undefined): string {
    if (!statusRaw) return 'Payment failed';
    const s = statusRaw.toLowerCase();

    if (
        s.includes('cancel') ||
        s.includes('decline') ||
        s.includes('reject') ||
        s.includes('abort')
    ) {
        return 'Payment was cancelled or declined before completion.';
    }

    if (s.includes('insufficient') || s.includes('fund')) {
        return 'Your account or phone balance is insufficient to complete this M-Pesa payment.';
    }

    if (
        s.includes('timeout') ||
        s.includes('expired') ||
        s.includes('timed out')
    ) {
        return 'The M-Pesa request timed out before payment was completed.';
    }

    if (s.includes('fail') || s.includes('error')) {
        return 'M-Pesa payment failed. Please try again.';
    }

    return `Payment was not completed (${statusRaw}).`;
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

    const { fileCount, amount: requestAmount } = req.body as {
        fileCount?: number;
        amount?: number;
    };
    const count = Number(fileCount);
    if (!Number.isFinite(count) || count < 1) {
        return next(
            AppError.badRequest('fileCount must be a positive integer')
        );
    }

    const amountFromBody = Number(requestAmount);
    const chargeAmount =
        Number.isFinite(amountFromBody) && amountFromBody > 0
            ? amountFromBody
            : cleanerChargeAmountKes(count);
    const chargingAmount = Math.ceil(chargeAmount);
    if (chargeAmount <= 0) {
        return next(AppError.badRequest('Invalid charge amount'));
    }
    log.debug(`This is the charging amount ${chargingAmount}`);
    const userAfterDebit = await UserModel.findOneAndUpdate(
        { _id: userId, walletBalance: { $gte: chargeAmount } },
        { $inc: { walletBalance: -chargeAmount } },
        { returnDocument: 'after', select: 'walletBalance email' }
    );
    if (!userAfterDebit) {
        return next(
            AppError.badRequest(
                `Insufficient wallet balance for this service (KES ${chargeAmount.toFixed(2)}).`
            )
        );
    }

    const chargeReference = `WALLET_CHARGE_${crypto.randomUUID()}`;
    const amountNum = Number(chargeAmount);
    if (!Number.isFinite(amountNum)) {
        return next(AppError.badRequest('amount must be a number'));
    }
    const rounded = Math.ceil(amountNum);
    log.debug(`Whats the rounded amount ${rounded}`);
    try {
        await TransactionsModel.create({
            userId,
            amount: rounded,
            email: userAfterDebit.email,
            status: 'SUCCESS',
            reference: chargeReference,
            project: 'tidy-up',
            provider: 'wallet',
            paymentKind: 'billing',
            folderCleanFileCount: count,
            createdAt: new Date(),
        });
    } catch (error) {
        await UserModel.findByIdAndUpdate(userId, {
            $inc: { walletBalance: chargeAmount },
        });
        throw error;
    }

    return res.status(200).json({
        status: 'SUCCESS',
        walletBalance: userAfterDebit.walletBalance ?? 0,
        amount: chargingAmount,
        chargeReference,
    });
}

export async function chargeWalletForFileMerger(
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

    const { pageCount, amount: requestAmount } = req.body as {
        pageCount?: number;
        amount?: number;
    };
    const count = Number(pageCount);
    if (!Number.isFinite(count) || count < 1) {
        return next(
            AppError.badRequest('pageCount must be a positive integer')
        );
    }

    const amountFromBody = Number(requestAmount);
    const chargeAmount =
        Number.isFinite(amountFromBody) && amountFromBody > 0
            ? amountFromBody
            : mergerChargeAmountKes(count);
    if (chargeAmount <= 0) {
        return next(AppError.badRequest('Invalid charge amount'));
    }

    const userAfterDebit = await UserModel.findOneAndUpdate(
        { _id: userId, walletBalance: { $gte: chargeAmount } },
        { $inc: { walletBalance: -chargeAmount } },
        { returnDocument: 'after', select: 'walletBalance email' }
    );
    if (!userAfterDebit) {
        return next(
            AppError.badRequest(
                `Insufficient wallet balance for this service (KES ${chargeAmount.toFixed(2)}).`
            )
        );
    }

    const chargeReference = `WALLET_CHARGE_${crypto.randomUUID()}`;
    const hydratedAmount = Math.ceil(chargeAmount);
    try {
        await TransactionsModel.create({
            userId,
            amount: hydratedAmount,
            email: userAfterDebit.email,
            status: 'SUCCESS',
            reference: chargeReference,
            project: 'tidy-up',
            provider: 'wallet',
            paymentKind: 'billing',
            mergerPageCount: count,
            createdAt: new Date(),
        });
    } catch (error) {
        await UserModel.findByIdAndUpdate(userId, {
            $inc: { walletBalance: chargeAmount },
        });
        throw error;
    }

    return res.status(200).json({
        status: 'SUCCESS',
        walletBalance: userAfterDebit.walletBalance ?? 0,
        amount: hydratedAmount,
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
            status: 'SUCCESS',
            walletBalance: user?.walletBalance ?? 0,
            refundReference,
            amount: chargeTx.amount,
        });
    }

    const user = await UserModel.findByIdAndUpdate(
        userId,
        { $inc: { walletBalance: chargeTx.amount } },
        { returnDocument: 'after', select: 'walletBalance email' }
    );
    const amountNum = Number(chargeTx.amount);
    if (!Number.isFinite(amountNum)) {
        return next(AppError.badRequest('amount must be a number'));
    }
    const rounded = Math.ceil(amountNum);
    await TransactionsModel.create({
        userId,
        amount: rounded,
        email: user?.email ?? chargeTx.email,
        status: 'SUCCESS',
        reference: refundReference,
        project: reason ? `refund:${reason}` : 'refund:upload_failed',
        provider: 'wallet',
        paymentKind: 'billing',
        createdAt: new Date(),
    });

    return res.status(200).json({
        status: 'SUCCESS',
        walletBalance: user?.walletBalance ?? 0,
        refundReference,
        amount: chargeTx.amount,
    });
}
