import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

/**
 * Authentication rate limiter - 2 requests per 2 seconds per email/IP
 * Prevents brute force attacks on login and registration
 */
const authRateLimiter = rateLimit({
    windowMs: 2 * 1000, // 2 second window
    max: 2, // 2 requests per window
    message: {
        error: 'Too many authentication attempts. Please try again after 2 seconds.',
    },
    standardHeaders: false, // Disable the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req: Request) => {
        // Use email from body as key if available (for login/register), fallback to IP
        const email =
            (req.body?.email as string)?.toLowerCase() || req.ip || '';
        return email || req.ip || '';
    },
    skip: (req: Request) => {
        // Skip rate limiting for health check endpoints
        return req.path === '/health' || req.path === '/status';
    },
    handler: (req: Request, res: Response) => {
        res.status(429).json({
            error: 'Too many authentication attempts',
            message: 'Please try again after 2 seconds.',
            retryAfter: Math.ceil(
                req.rateLimit?.resetTime
                    ? (req.rateLimit.resetTime - Date.now()) / 1000
                    : 2
            ),
        });
    },
});

export default authRateLimiter;
