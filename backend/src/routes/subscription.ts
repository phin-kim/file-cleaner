import { Router } from 'express';

import createLogger from '../utils/logger.js';
import authenticate from '../middleware/authenticate.js';
import type { AuthenticatedRequest } from '../Types/authenticate.js';
import { UserModel } from '../schema/UsersSchema.js';
import { TransactionsModel } from '../schema/TransactionSchema.js';
import AppError from '../utils/appError.js';
import { isUserDocument } from '../helpers/miniHelpers.js';
import type { JWTUserPayload } from '../Types/authenticate.js';
export const subRouter: Router = Router();

const log = createLogger('subscriptionRoute.ts');
subRouter.get('/fetch-profile', authenticate, async (req, res, next) => {
    log.info('Fetching the user tier');
    try {
        const authReq = req as AuthenticatedRequest;
        const userPayload = authReq.user;

        if (!userPayload) {
            return next(AppError.unauthorized('Not authenticated'));
        }

        // Otherwise, it's the JWT payload, use the uid to find the record
        // We cast to 'any' or the specific payload type to access 'uid'
        const userId = (userPayload as JWTUserPayload).uid;
        const user = await UserModel.findById(userId);

        if (!user) {
            log.warn('user not found in the db');
            return next(AppError.notFound('User not found'));
        }

        res.status(200).json({
            status: 'success',
            tierId: user.tierId,
            lastUsageDate: user.lastUsageDate,
            dailyUsageCount: user.dailyUsageCount,
            walletBalance: user.walletBalance ?? 0,
            profileImageUrl: user.profileImageUrl ?? '',
            createdAt: user.createdAt,
            email: user.email,
        });
        //res.status(200).json({ tierId: tierId, dailyUsageCount });
    } catch (error) {
        log.error('Failed to fetch user', { data: { error } });
        next(error);
    }
});
subRouter.patch('/increment-usage', authenticate, async (req, res, next) => {
    try {
        const authReq = req as AuthenticatedRequest;

        // Replace findOne({ email: ... }) with findById
        if (!authReq.user) {
            return next(AppError.unauthorized('Not authenticated'));
        }

        // TYPE SAFE EXTRACTION:
        // If it's a Document, use ._id. If it's a Payload, use .uid.
        const userId = isUserDocument(authReq.user)
            ? authReq.user._id.toString()
            : authReq.user.uid;

        // Now you can proceed safely
        const user = isUserDocument(authReq.user)
            ? authReq.user
            : await UserModel.findById(userId);

        if (!user) return next(AppError.notFound('User not found'));
        user.dailyUsageCount += 1;
        user.lastUsageDate = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            currentCount: user.dailyUsageCount,
        });
    } catch (error) {
        log.error('Error in incrementing the usage ', { data: { error } });
        next(error);
    }
});

subRouter.get('/wallet-history', authenticate, async (req, res, next) => {
    try {
        const authReq = req as AuthenticatedRequest;
        const userPayload = authReq.user as JWTUserPayload | undefined;
        if (!userPayload?.uid) {
            return next(AppError.unauthorized('Not authenticated'));
        }

        const user = await UserModel.findById(userPayload.uid).select(
            'walletBalance'
        );
        if (!user) {
            return next(AppError.notFound('User not found'));
        }

        const txs = await TransactionsModel.find({
            userId: userPayload.uid,
            status: 'success',
        })
            .sort({ createdAt: -1 })
            .select(
                'amount paymentKind reference mpesaReceipt provider createdAt updatedAt payheroInternalRef'
            )
            .lean();

        const history = txs.map((tx) => {
            const isWalletCredit =
                tx.paymentKind === 'wallet_topup' ||
                tx.paymentKind === 'folder_clean' ||
                tx.paymentKind === 'file_merger';
            const isWalletRefund =
                tx.paymentKind === 'billing' &&
                typeof tx.reference === 'string' &&
                tx.reference.startsWith('WALLET_REFUND_');
            const numericAmount = Number(tx.amount || 0);
            return {
                id: String(tx._id),
                amount:
                    isWalletCredit || isWalletRefund
                        ? Math.abs(numericAmount)
                        : -Math.abs(numericAmount),
                type: (isWalletRefund
                    ? 'refund'
                    : isWalletCredit
                      ? 'top-up'
                      : 'payment') as 'top-up' | 'refund' | 'payment',
                source:
                    tx.paymentKind === 'wallet_topup'
                        ? 'wallet-topup'
                        : tx.paymentKind === 'folder_clean' ||
                            tx.paymentKind === 'billing'
                          ? 'in-app-payment'
                          : 'local',
                date: (
                    tx.createdAt ||
                    tx.updatedAt ||
                    new Date()
                ).toISOString(),
                reference: tx.reference || null,
                mpesaReference: tx.mpesaReceipt || null,
                payheroReference: tx.payheroInternalRef || null,
                provider: tx.provider || 'mpesa',
            };
        });

        return res.status(200).json({
            status: 'success',
            walletBalance: user.walletBalance ?? 0,
            total: history.length,
            history,
        });
    } catch (error) {
        log.error('Error fetching wallet history', { data: { error } });
        next(error);
    }
});
