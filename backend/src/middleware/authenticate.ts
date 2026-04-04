import type { RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import AppError from '../utils/appError.js';

import type {
    JWTUserPayload,
    AuthenticatedRequest,
} from '../Types/authenticate.js';
import createLogger from '../utils/logger.js';

const log = createLogger('AUTHENTICATE');
const authenticate: RequestHandler = async (req, _res, next) => {
    const requestIdHeader = req.headers['x-request-id'];
    const requestId = Array.isArray(requestIdHeader)
        ? requestIdHeader[0]
        : requestIdHeader;
    log.highlight('=== AUTHENTICATE MIDDLEWARE DEBUG START ===', {
        requestId,
        context: 'authenticate',
    });
    log.debug('Request method', {
        requestId,
        context: 'authenticate',
        data: { method: req.method, url: req.url },
    });
    log.debug('Request body', {
        requestId,
        context: 'authenticate',
        data: req.body,
    });
    log.debug('Content-Type', {
        requestId,
        context: 'authenticate',
        data: { contentType: req.headers['content-type'] },
    });
    try {
        const authHeader = req.headers.authorization || '';
        let token: string | undefined =
            authHeader && authHeader.startsWith('Bearer ')
                ? authHeader.split(' ')[1]
                : undefined;
        log.warn('Token from header', {
            requestId,
            context: 'authenticate',
            data: { token: token ? `${token.slice(0, 30)}...` : 'undefined' },
        });
        log.info(
            `is there token from body ${req.body?.idToken ? 'yes' : 'no'}`
        );
        if (!token && req.body?.idToken) {
            token = req.body.idToken;
            log.debug('Token from body', {
                requestId,
                context: 'authenticate',
                data: {
                    token: token ? `${token.slice(0, 30)}...` : 'undefined',
                },
            });
        }
        if (!token) {
            throw AppError.unauthorized('Unauthorized user');
        }
        const secret = process.env.JWT_ACCESS_SECRET;
        if (!secret) {
            log.error('JWT_SECRET not configured');
            return next(
                new AppError('Internal Server Configuration Error', 500)
            );
        }
        const decoded = jwt.verify(token, secret) as JwtPayload;
        if (typeof decoded !== 'object' || decoded === null) {
            return next(AppError.invalidToken('Invalid token'));
        }
        if (!('uid' in decoded)) {
            log.error('Token payload is missing uid', { data: { decoded } });
            return next(AppError.unauthorized('Unauthorized user'));
        }
        const payload = decoded as JWTUserPayload;
        log.debug('Decoded token', {
            requestId,
            context: 'authenticate',
            data: decoded,
        });
        log.debug('Payload', {
            requestId,
            context: 'authenticate payload',
            data: payload,
        });
        (req as AuthenticatedRequest).user = payload;
        log.highlight('=== AUTHENTICATE MIDDLEWARE DEBUG END ===', {
            requestId,
            context: 'authenticate',
        });
        return next();
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        log.error('Authentication middleware error', {
            requestId,
            context: 'authenticate',
            data: { message: error.message, stack: error.stack },
        });

        if (error instanceof AppError) return next(error);
        return next(AppError.unauthorized('Invalid or expired token'));
    }
};
export default authenticate;
