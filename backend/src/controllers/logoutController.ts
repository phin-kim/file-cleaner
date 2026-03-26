import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import AppError from '../utils/appError';
import { UserModel } from '../schema/UsersSchema';
import { hashToken } from '../utils/jwt';
import 'dotenv/config';
import createLogger from '../utils/logger';
const log = createLogger('Logout');
const refreshSecret = process.env.JWT_REFRESH_SECRET;

export async function logout(req: Request, res: Response, next: NextFunction) {
    if (!refreshSecret) {
        log.error('Refresh secret not configured', { data: { refreshSecret } });
        throw AppError.notFound('Refresh token not found');
    }
    try {
        const refreshToken = req.signedCookies?.refreshToken;
        if (!refreshToken) {
            log.error('Missing refresh token', { data: { refreshToken } });
            return next(AppError.unauthorized('Missing refresh token'));
        }
        //verify token
        const payload = jwt.verify(refreshToken, refreshSecret) as JwtPayload;
        const userId = payload.uid as string;
        if (!userId) {
            log.error('Invalid refresh token payload', { data: { payload } });
            return next(AppError.unauthorized('Unauthorized user'));
        }
        const user = await UserModel.findById(userId);
        if (!user) {
            log.warn('User not found in db');
            return next(AppError.unauthorized('User not found '));
        }
        const tokenHash = hashToken(refreshToken);
        user.refreshTokens = user.refreshTokens.filter(
            (token: string) => token.tokenHash !== tokenHash
        );
        await user.save();
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/auth/refresh',
        });
        log.info('User has signed out successfully', {
            context: 'logout',
            data: { userId },
        });
        res.status(200).json({ success: true, message: 'Logout successful' });
    } catch (error) {
        log.error('Logout failed', {
            context: 'Logout',
            data: { error },
        });
        return next(AppError.unauthorized('Invalid refresh token'));
    }
}
