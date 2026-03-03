import type { Response, NextFunction, Request } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import { UserModel } from '../schema/UsersSchema';
import { hashToken, signAccessToken, signRefreshToken } from '../utils/jwt';
import createLogger from '../utils/logger';
import AppError from '../utils/appError';
const log = createLogger('Refresh controller');
export async function refresh(req: Request, res: Response, next: NextFunction) {
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
        log.error('Refresh secret not configured', { data: { refreshSecret } });
        throw AppError.notFound('Refresh token not found');
    }
    try {
        const token = req.signedCookies?.refreshToken;
        if (!token) {
            log.error('Invalid refresh token in payload', { data: token });
            return next(AppError.unauthorized('Un authorized user'));
        }
        const payload = jwt.verify(token, refreshSecret) as JwtPayload;
        //extract the uid
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
        const tokenHash = hashToken(token);
        const stored = user.refreshTokens.find(
            (token) => token.tokenHash === tokenHash
        );
        if (!stored) {
            return next(AppError.unauthorized('Refresh token revoked'));
        }
        if (stored.expiresAt < new Date()) {
            //remove expired tokens
            user.refreshTokens = user.refreshTokens.filter(
                (token) => token.tokenHash !== tokenHash
            );
            await user.save();

            return next(AppError.unauthorized('Refresh token has expired'));
        }
        //rotate tokens
        user.refreshTokens = user.refreshTokens.filter(
            (token) => token.tokenHash !== tokenHash
        );
        const newRefreshToken = signRefreshToken({ uid: user._id.toString() });

        const newRefreshHashedToken = hashToken(newRefreshToken!);
        user.refreshTokens.push({
            tokenHash: newRefreshHashedToken,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60860 * 1000),
        });
        await user.save();
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/auth/refresh',
            maxAge: 30 * 24 * 60 * 60 * 1000,
            signed: true,
        });
        //send the new access token
        const newAccessToken = signAccessToken({ uid: user._id.toString() });
        res.status(200).json({
            success: true,
            accessToken: newAccessToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        log.error('Error in the refresh token', {
            context: 'refresh token',
            data: { error },
        });
        return next(AppError.unauthorized('Invalid refresh token'));
    }
}
