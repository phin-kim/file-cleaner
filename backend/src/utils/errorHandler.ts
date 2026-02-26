import type { Request, Response, NextFunction } from 'express';
import AppError from './appError.js';
import type { ErrorType } from '../Types/ErrorHandler.js';

import crypto from 'node:crypto';

const errorHandler = (
    err: ErrorType,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    const isProd = process.env.NODE_ENV === 'production'; //not to return generic errors in prod
    const requestId = req.headers['x-request-id'] ?? crypto.randomUUID();
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('🔥 Caught in Error Handler', {
        requestId,
        message: err.message,
        stack: stack,
    });
    let appError: AppError;
    if (err instanceof AppError) {
        appError = err;
    } else {
        appError = AppError.database('Internal server error');
    }
    const statusCode = appError.statusCode || 500;
    const message = isProd ? 'Something went wrong' : appError.message;
    const type = appError.type || 'Server Error';
    return res.status(appError.statusCode).json({
        success: false,
        requestId,
        error: {
            message,
            type,
            statusCode,
        },
    });
};
export default errorHandler;
