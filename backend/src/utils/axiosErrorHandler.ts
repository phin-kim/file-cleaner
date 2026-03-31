import axios from 'axios';
import createLogger from './logger';
const log = createLogger('AxiosErrorhandler.ts');
import AppError from './appError';
import type { NextFunction } from 'express';
const handleAxiosError = (error: unknown, next: NextFunction): void => {
    if (axios.isAxiosError(error)) {
        if (error.response) {
            log.error('ERROR:Server responded with an error', {
                data: {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                },
            });
            const message =
                error.response.data?.error?.message ||
                error.response.data?.error ||
                error.response.data?.message ||
                'Something went wrong on the server';
            return next(new AppError(message, 500, 'PaystackError'));
        }
        if (error.request) {
            const reqError = error.request;
            log.error('No response received from server', {
                data: { reqError },
            });
            return next(
                new AppError(
                    'Network error:Server not responding or offline',
                    503,
                    'ServerError'
                )
            );
        }
        const axiosConfigMessage = error.message;
        log.error('Axios configuration error:', {
            data: {
                axiosConfigMessage,
            },
        });
        return next(new AppError(axiosConfigMessage, 503, 'AxiosConfigError'));
    }
    //handle custom rejected objects(e.g. from interceptors)
    if (typeof error === 'object' && error !== null && 'message' in error) {
        const errorMessage = (error as { message: string }).message;
        log.error(errorMessage);
        return next(new AppError(errorMessage));
    }
    //native js errors
    if (error instanceof Error) {
        const errorMessage = error.message;
        log.error('Unexpected JS error:', { data: { errorMessage } });
        return next(new AppError(errorMessage));
    }
    log.error('Unknown error: ', { data: { error } });
    return next(new AppError('Unknown error occurred', 500, 'ServerError'));
};
export default handleAxiosError;
