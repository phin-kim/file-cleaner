import type { Response, Request, NextFunction } from 'express';
import { UserModel } from '../schema/UsersSchema';
import { DeletedAccountModel } from '../schema/DeletedAccountSchema.js';
import { auth, updateManagedUser } from '../lib/auth.js';
import { fromNodeHeaders } from 'better-auth/node';

import type { AuthenticatedRequest } from '../Types/authenticate';
import createLogger from '../utils/logger';
const log = createLogger('userController.ts');
import AppError from '../utils/appError';
import cloudinary from '../utils/cloudinary.js';
import { TransactionsModel } from '../schema/TransactionSchema';
export async function fetchProfile(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const authReq = req as AuthenticatedRequest;

        const userId = authReq.user?.id;
        log.debug(`the user id ${userId}`);
        log.debug('The authenticated user', { data: authReq?.user });
        if (!userId) {
            return next(AppError.unauthorized('Not authenticated'));
        }
        const user = authReq?.user;

        if (!user) {
            log.warn('user not found in the db');
            return next(AppError.notFound('User not found'));
        }
        log.debug('User data', { data: { user } });
        res.status(200).json({
            status: 'SUCCESS',
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
        return next(error);
    }
}
export async function uploadProfileImage(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authReq = req as AuthenticatedRequest;

    const userId = authReq?.user?.id;
    if (!userId) {
        return next(AppError.unauthorized('Not authenticated'));
    }
    const user = authReq?.user;
    if (!user) {
        throw AppError.notFound('User not found');
    }
    const image = req.file;
    if (!image || !image.buffer) {
        throw AppError.badRequest('Image file is required');
    }
    const uploaded = await new Promise<{
        secure_url: string;
        public_id: string;
    }>((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
            {
                folder: `tidy-up/users/${userId}/profile`,
                resource_type: 'image',
                overwrite: true,
            },
            (error, result) => {
                if (error || !result) {
                    reject(error || new Error('Cloudinary upload failed'));
                    return;
                }
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                });
            }
        );
        upload.end(image.buffer);
    });

    if (user.profileImagePublicId) {
        await cloudinary.uploader.destroy(user.profileImagePublicId, {
            resource_type: 'image',
        });
    }

    await auth.api.updateUser({
        body: {
            profileImageUrl: uploaded.secure_url,
            profileImagePublicId: uploaded.public_id,
        },
        headers: fromNodeHeaders(req.headers),
    });

    return res.status(200).json({
        success: true,
        profileImageUrl: user.profileImageUrl,
    });
}

export async function removeProfileImage(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authReq = req as AuthenticatedRequest;

    const userId = authReq?.user?.id;
    if (!userId) {
        return next(AppError.unauthorized('Not authenticated'));
    }
    const user = authReq?.user;
    if (!user) {
        throw AppError.notFound('User not found');
    }
    if (user.profileImagePublicId) {
        await cloudinary.uploader.destroy(user.profileImagePublicId, {
            resource_type: 'image',
        });
    }
    await auth.api.updateUser({
        body: {
            profileImageUrl: '',
            profileImagePublicId: '',
        },
        headers: fromNodeHeaders(req.headers),
    });
    return res.status(200).json({ success: true, profileImageUrl: '' });
}
export async function incrementUsage(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const authReq = req as AuthenticatedRequest;
        // Replace findOne({ email: ... }) with findById

        // TYPE SAFE EXTRACTION:
        // If it's a Document, use ._id. If it's a Payload, use .uid.
        const userId = authReq?.user?.id;
        if (!userId) {
            return next(AppError.unauthorized('Not authenticated'));
        }
        // Now you can proceed safely
        const user = authReq?.user;

        if (!user) return next(AppError.notFound('User not found'));
        const nextCount = Number(user.dailyUsageCount ?? 0) + 1;

        await updateManagedUser(
            {
                userId,
                data: {
                    dailyUsageCount: nextCount,
                    lastUsageDate: new Date(),
                },
            },
            fromNodeHeaders(req.headers)
        );
        res.status(200).json({
            success: true,
            currentCount: nextCount,
        });
    } catch (error) {
        log.error('Error in incrementing the usage ', { data: { error } });
        next(error);
    }
}
export async function getWalletHistory(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const authReq = req as AuthenticatedRequest;
        const user = authReq?.user;
        const userId = authReq?.user?.id;
        if (!userId) {
            return next(AppError.unauthorized('Not authenticated'));
        }
        // const user = await UserModel.findOne({ userId }).select(
        //     'walletBalance'
        // );
        if (!user) {
            return next(AppError.notFound('User not found'));
        }

        const txs = await TransactionsModel.find({
            userId,
            status: 'SUCCESS',
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
            status: 'SUCCESS',
            walletBalance: user.walletBalance ?? 0,
            total: history.length,
            history,
        });
    } catch (error) {
        log.error('Error fetching wallet history', { data: { error } });
        next(error);
    }
}
export const deleteAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq?.user?.id;
    log.debug('Inside Controller', { data: { user: authReq.user } });
    if (!userId) {
        return next(AppError.unauthorized('Not authenticated'));
    }

    // Otherwise, it's the JWT payload, use the uid to find the record
    // We cast to 'any' or the specific payload type to access 'uid'

    const user = authReq?.user;

    if (!user) {
        log.warn('user not found in the db');
        return next(AppError.notFound('User not found'));
    }

    // If walletBalance is undefined, it defaults to 0, and the check passes
    if ((user?.walletBalance ?? 0) > 0) {
        return next(
            AppError.badRequest(
                `Cannot delete account. You still have KES ${user.walletBalance} in your wallet. Please spend your balance first.`
            )
        );
    }
    try {
        await DeletedAccountModel.create({ email: user.email });
        await UserModel.findOneAndDelete({ userId });
        res.status(200).json({
            success: true,
            message: 'Account deleted successfully',
        });
    } catch (error: unknown) {
        log.error(error instanceof Error ? error : 'Failed to delete account', {
            context: 'delete-account',
            data: { userId },
        });
        return next(
            error instanceof Error
                ? error
                : AppError.badRequest('Failed to delete account')
        );
    }
};
