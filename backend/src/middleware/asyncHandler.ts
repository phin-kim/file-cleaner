import type { Request, Response, NextFunction, RequestHandler } from 'express';

const asyncHandler =
    <T extends RequestHandler>(fn: T): RequestHandler =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

export default asyncHandler;
