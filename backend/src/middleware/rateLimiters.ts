import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

/**
 * General API rate limiter - 100 requests per 15 minutes per IP
 * Applied to all routes except authentication endpoints
 */
const generalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minute window
    max: 100, // 100 requests per window
    message: {
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        // Use IP address as key
        return req.ip || '';
    },
    skip: (req: Request) => {
        // Skip rate limiting for certain paths
        return req.path === '/health' || req.path === '/status';
    },
});

/**
 * Upload/File operation rate limiter - 10 requests per hour per user
 * Applied to file upload and processing routes
 */
const uploadRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 10, // 10 uploads per hour
    message: {
        error: 'Too many file uploads. Please try again later.',
    },
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        // Use authenticated user ID if available, fallback to IP
        const userId = (req as unknown as { user?: { uid: string } })?.user
            ?.uid;
        return userId || req.ip || '';
    },
});

/**
 * Payment rate limiter - 5 requests per minute per user
 * Applied to payment routes to prevent accidental duplicate charges
 */
const paymentRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 5, // 5 requests per minute
    message: {
        error: 'Too many payment requests. Please try again later.',
    },
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        // Use authenticated user ID if available
        const userId = (req as unknown as { user?: { uid: string } })?.user
            ?.uid;
        return userId || req.ip || '';
    },
});

export { generalRateLimiter, uploadRateLimiter, paymentRateLimiter };
