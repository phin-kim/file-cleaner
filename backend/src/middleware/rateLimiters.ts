import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
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
        return ipKeyGenerator(req.ip || '');
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
        error: 'Too many requests. Please try again later.',
    },
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        // Use authenticated user ID if available, fallback to IP
        const userId = (req as unknown as { user?: { uid: string } })?.user
            ?.uid;
        return userId || ipKeyGenerator(req.ip || '');
    },
});

const paymentKeyGenerator = (req: Request) => {
    const userId = (req as unknown as { user?: { uid: string } })?.user?.uid;
    return userId || ipKeyGenerator(req.ip || '');
};

/** Payment initiation limiter. Initiation requests can create charges. */
const paymentInitiationRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 5, // 5 requests per minute
    message: {
        error: 'Too many payment requests. Please try again later.',
    },
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: paymentKeyGenerator,
});

/** Status polling limiter. Normal payment polling must not be mistaken for new charges. */
const paymentStatusRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: {
        error: 'Too many payment status checks. Please try again shortly.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: paymentKeyGenerator,
});

export {
    generalRateLimiter,
    uploadRateLimiter,
    paymentInitiationRateLimiter,
    paymentStatusRateLimiter,
};
