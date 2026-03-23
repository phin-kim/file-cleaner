import { Router } from 'express';

export const subRouter: Router = Router();
import createLogger from '../utils/logger.js';
import authenticate from '../middleware/authenticate.js';
import type { AuthenticatedRequest } from '../Types/authenticate.js';
import { UserModel } from '../schema/UsersSchema.js';
import AppError from '../utils/appError.js';
const log = createLogger('subscription route');
subRouter.get('/get-tier', authenticate, async (req, res, next) => {
    log.info('Fetching the user tier');
    try {
        const authReq = req as AuthenticatedRequest;
        const userId = authReq?.user?.uid;
        const user = await UserModel.findById(userId);
        if (!user) {
            log.warn('user not found in the db');
            return next(AppError.notFound('User not found'));
        }
        const userTier = user?.tierId;
        res.status(200).json(userTier);
    } catch (error) {
        log.error('Failed to fetch user', { data: { error } });
    }
});
