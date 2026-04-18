/**import axios from 'axios';
import crypto from 'node:crypto';
import type { PaystackVerificationResponse } from '../Types/transactions.js';
import handleAxiosError from '../utils/axiosErrorHandler.js';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;*/
import type { Response, Request, NextFunction } from 'express';

import { UserModel } from '../schema/UsersSchema.js';
import createLogger from '../utils/logger.js';
//import AppError from '../utils/appError.js';
import { TransactionsModel } from '../schema/TransactionSchema.js';
import {
    finalizeFolderCleanIfPendingByReference,
    finalizeWalletTopupIfPendingByReference,
} from './payHeroPayment.js';

const log = createLogger('webhook.ts');
export async function paystackWebhook(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const body = req.body || {};
        const { paymentSuccess, user_reference, providerReference, amount } =
            body;

        // 1. Check if paymentSuccess is true (based on your logs)
        if (paymentSuccess !== true) {
            log.warn('Payment not successful according to Payhero', {
                data: {
                    ref: user_reference,
                },
            });
            return res.status(200).json({ status: 'ignored' });
        }

        const externalRef =
            (body as { external_reference?: string }).external_reference ??
            (body as { data?: { external_reference?: string } }).data
                ?.external_reference ??
            user_reference;

        if (
            typeof externalRef === 'string' &&
            externalRef.startsWith('MPESA_')
        ) {
            const mpesaTx = await TransactionsModel.findOne({
                reference: externalRef,
                paymentKind: { $in: ['folder_clean', 'wallet_topup'] },
            });
            if (mpesaTx?.paymentKind === 'folder_clean') {
                await finalizeFolderCleanIfPendingByReference(
                    externalRef,
                    typeof providerReference === 'string'
                        ? providerReference
                        : undefined
                );
                log.info('Folder clean webhook finalized', {
                    data: { reference: externalRef },
                });
                return res
                    .status(200)
                    .json({ success: true, kind: 'folder_clean' });
            }
            if (mpesaTx?.paymentKind === 'wallet_topup') {
                await finalizeWalletTopupIfPendingByReference(
                    externalRef,
                    typeof providerReference === 'string'
                        ? providerReference
                        : undefined
                );
                log.info('Wallet top-up webhook finalized', {
                    data: { reference: externalRef },
                });
                return res
                    .status(200)
                    .json({ success: true, kind: 'wallet_topup' });
            }
            return res.status(200).json({
                success: true,
                message: 'mpesa_reference_acknowledged',
            });
        }

        // 2. Parse the metadata from 'user_reference'
        // Format: "user_ID|tier_ID|name_EMAIL|period_MONTHLY|TIMESTAMP"
        const parts = user_reference?.split('|') || [];

        // Helper to find specific keys in your pipe-delimited string
        const getVal = (prefix: string) =>
            parts.find((p: string) => p.startsWith(prefix))?.split('_')[1];

        const userId = getVal('user');
        const tierId = getVal('tier');
        const email = getVal('name');
        const period = getVal('period');

        if (!userId || !tierId) {
            log.error('Critical metadata missing in user_reference', {
                data: {
                    user_reference,
                },
            });
            return res.status(200).json({ message: 'Metadata error' });
        }
        // 1. Check if this transaction already exists before trying to create it
        const existingTransaction = await TransactionsModel.findOne({
            reference: user_reference,
        });

        if (existingTransaction) {
            log.info('Transaction already processed, skipping duplicate.', {
                data: {
                    ref: user_reference,
                },
            });
            return res
                .status(200)
                .json({ success: true, message: 'Already processed' });
        }

        // 3. Update Transaction Database
        try {
            await TransactionsModel.create({
                userId,
                amount: amount,
                email: email,
                status: 'success',
                reference: user_reference,
                mpesaReceipt: providerReference, // This is "UD6KQ0A5WX" in your logs
                project: 'tidy-up',
                provider: 'mpesa',
                createdAt: new Date(),
            });
        } catch (dbError: any) {
            if (dbError.code === 11000) {
                return res
                    .status(200)
                    .json({ success: true, message: 'Duplicate blocked' });
            }
            throw dbError;
        }

        // 4. Upgrade User Tier
        await UserModel.findByIdAndUpdate(userId, {
            $set: {
                tierId: tierId,
                'subscription-period': period,
                'subscription-status': 'active',
                'last-payment-date': new Date(),
            },
        });

        log.info(`✅ Successfully upgraded ${email} to ${tierId}`);

        // Always return 200 so Payhero stops retrying
        return res.status(200).json({ success: true });
    } catch (error) {
        log.error('Web hook error', { data: { error } });
        return next(error);
    }
}
/*export const verifyTransaction = async (
    reference: string,
    next: NextFunction
): Promise<PaystackVerificationResponse | undefined> => {
    try {
        log.debug(`We are verifying the transaction for ${reference}`);
        const response = await axios.get<PaystackVerificationResponse>(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        handleAxiosError(error, next);
        return;
    }
};*/
