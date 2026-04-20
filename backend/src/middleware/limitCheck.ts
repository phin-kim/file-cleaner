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
    // 1. Get User's Timezone Offset from headers (sent by frontend)
    // Frontend should send: headers: { 'x-timezone-offset': new Date().getTimezoneOffset() }
    const clientOffset =
        parseInt(req.headers['x-timezone-offset'] as string) || 0;
    // 2. Calculate "Today" relative to the user's timezone
    const now = new Date();
    // Adjust UTC time to User's local time
    const userLocalTime = new Date(now.getTime() - clientOffset * 60000);
    const todayStr = userLocalTime.toISOString().split('T')[0]; // Format: "2026-04-20"
    // 3. Compare with last usage date (stored as a string or Date)
    // Use .getTime() to turn the Date into a number (milliseconds)
    const lastUpdateStr = new Date(
        new Date(user.lastUsageDate).getTime() - clientOffset * 60000
    )
        .toISOString()
        .split('T')[0];

    // 4. Reset logic
    if (todayStr !== lastUpdateStr) {
        user.dailyUsageCount = 0;
        user.lastUsageDate = new Date(); // Update to actual current time

        // CRITICAL: Save the reset to the database!
        await user.save();
    }

    // 5. Check limit
    if (user.dailyUsageCount >= DAILY_MAX) {
        return next(
            AppError.tooManyRequests(
                'Daily limit reached. Please try again tomorrow.'
            )
        );
    }
    //attach user request to avoid a second DB call in the controller
    (req as AuthenticatedRequest).user = user;
    next();
};
export default checkDailyLimit;
