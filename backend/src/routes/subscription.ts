import { Router } from 'express';

import createLogger from '../utils/logger.js';
import authenticate from '../middleware/authenticate.js';
import type {
    AuthenticatedRequest,
    UserDocument,
} from '../Types/authenticate.js';
import { UserModel } from '../schema/UsersSchema.js';
import AppError from '../utils/appError.js';
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
        const payload = authReq.user as JWTUserPayload;
        const user = await UserModel.findOne({ email: payload.email });

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
