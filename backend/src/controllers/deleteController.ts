import type { NextFunction, Request, Response } from 'express';
import { UserModel } from '../schema/UsersSchema.js';
import AppError from '../utils/appError.js';
import { DeletedAccountModel } from '../schema/DeletedAccountSchema.js';
import type {
    AuthenticatedRequest,
    JWTUserPayload,
} from '../Types/authenticate.js';
import createLogger from '../utils/logger.js';
const log = createLogger('DeleteAccountController.ts');
export const deleteAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authReq = req as AuthenticatedRequest;
    const userPayload = authReq.user;
    log.debug('Inside Controller', { data: { user: authReq.user } });
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
        await UserModel.findByIdAndDelete(userId);
        res.status(200).json({
            success: true,
            message: 'Account deleted successfully',
        });
    } catch (error) {
        return next(AppError.badRequest('Failed to delete account'));
    }
};
