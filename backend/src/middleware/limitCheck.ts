import type { Request, Response, NextFunction } from 'express';
import { UserModel } from '../schema/UsersSchema.js';
import AppError from '../utils/appError.js';
import type {
    JWTUserPayload,
    AuthenticatedRequest,
} from '../Types/authenticate.js';
import createLogger from '../utils/logger.js';
const log = createLogger('Limitcheck.ts');
const checkDailyLimit = (fileLimitThreshold: number = 30, dailyMax = 4) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
        const authReq = req as AuthenticatedRequest;
        const payload = authReq.user;
        const userId = (payload as JWTUserPayload)?.uid;
        //Get the number of files from the request
        const fileCount = Array.isArray(req.files) ? req.files?.length : 0;
        //attach this flag into the request object
        (req as AuthenticatedRequest).isHeavyUpload =
            fileCount > fileLimitThreshold;
        if (!(req as AuthenticatedRequest).isHeavyUpload) {
            return next();
        }

        if (fileCount > 300) {
            return next(
                AppError.badRequest('Maximum upload limit is 300 files at once')
            );
        }
        log.debug(
            `From the limit check middleware: User ${userId} is uploading ${fileCount} files.`
        );
        //skip if its smaller than the threshold
        if (fileCount <= fileLimitThreshold) {
            return next();
        }
        const user = await UserModel.findById(userId);

        if (!user) return next(AppError.notFound('User not found'));

        // 1. Get User's Timezone Offset from headers (sent by frontend)
        // Frontend should send: headers: { 'x-timezone-offset': new Date().getTimezoneOffset() }
        const clientOffset =
            parseInt(req.headers['x-timezone-offset'] as string) || 0;

        // 2. Calculate "Today" relative to the user's timezone
        const now = new Date();
        // Adjust UTC time to User's local time
        const userLocalTime = new Date(now.getTime() - clientOffset * 60000);
        //24 hours ago in users time
        const twentyFourHoursAgo = new Date(
            userLocalTime.getTime() - 24 * 60 * 60 * 1000
        );
        //last usage date converted into the users local time
        const lastUsageLocal = new Date(
            new Date(user.lastUsageDate).getTime() - clientOffset * 60000
        );
        //sliding window logic
        if (lastUsageLocal < twentyFourHoursAgo) {
            user.dailyUsageCount = 0;
            //save only in the processing logic
        }
        //check heavy usage limit
        if (user.dailyUsageCount >= dailyMax) {
            const expiryTimeLocal =
                lastUsageLocal.getTime() + 24 * 60 * 60 * 1000;
            const timeLeftMs = expiryTimeLocal - userLocalTime.getTime();
            const hoursLeft = Math.ceil(timeLeftMs / (1000 * 60 * 60));
            return next(
                AppError.tooManyRequests(
                    `Heavy upload limit reached.Please try again in ${hoursLeft} hour(s)`
                )
            );
        }

        //attach user request to avoid a second DB call in the controller
        (req as AuthenticatedRequest).user = user;
        next();
    };
};
export default checkDailyLimit;
