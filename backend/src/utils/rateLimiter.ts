import rateLimit from 'express-rate-limit';
const uploadLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, //1 minute window
    max: 5, //max 5 uploads per ip
    message: {
        error: 'Too many requests try again after one minute',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
export default uploadLimiter;
