import type { Request, Response, NextFunction } from 'express';
import { UserModel } from '../schema/UsersSchema.js';
import AppError from '../utils/appError.js';
import type {
    JWTUserPayload,
    AuthenticatedRequest,
} from '../Types/authenticate.js';
import createLogger from '../utils/logger.js';
const log = createLogger('Limitcheck.ts');
const checkDailyLimit = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const authReq = req as AuthenticatedRequest;
    const payload = authReq.user;
    const userId = (payload as JWTUserPayload)?.uid;
    log.warn('User payload ', { data: { payload } });
    const user = await UserModel.findById(userId);

    if (!user) return next(AppError.notFound('User not found'));
    const DAILY_MAX = 4;
    //log.debug('User object from database', { data: { user } });

    const today = new Date().setHours(0, 0, 0, 0);
    const lastUpdate = new Date(user.lastUsageDate).setHours(0, 0, 0, 0);
    //reset usage date if the last usage was the previous day
    if (today > lastUpdate) {
        user.dailyUsageCount = 0;
        user.lastUsageDate = new Date();
    }
    if (user.dailyUsageCount >= DAILY_MAX) {
        return next(
            AppError.tooManyRequests('Daily limit reached.Please try again')
        );
    }
    //attach user request to avoid a second DB call in the controller
    (req as AuthenticatedRequest).user = user;
    next();
};
export default checkDailyLimit;
