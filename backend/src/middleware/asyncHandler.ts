import type { Request, Response, NextFunction, RequestHandler } from 'express';
import createLogger from '../utils/logger.js';

const log = createLogger('AsyncHandler');

const normalizeError = (error: unknown): Error => {
    if (error instanceof Error) {
        return error;
    }

    if (typeof error === 'string') {
        return new Error(error);
    }

    return new Error('An unexpected error occurred');
};

const asyncHandler =
    <T extends RequestHandler>(fn: T): RequestHandler =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch((error: unknown) => {
            const normalizedError = normalizeError(error);
            log.error(normalizedError, {
                context: 'controller-error',
                data: {
                    method: req.method,
                    path: req.originalUrl,
                },
            });
            next(normalizedError);
        });
    };

export default asyncHandler;
