import type { Response, NextFunction, Request } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import { UserModel } from '../schema/UsersSchema.js';
import { hashToken, signAccessToken, signRefreshToken } from '../utils/jwt.js';
import type { JWTUserPayload, Subscription } from '../Types/authenticate.js';
import createLogger from '../utils/logger.js';
import AppError from '../utils/appError.js';

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
            return next(AppError.unauthorized('Unauthorized user'));
        }
        log.info('Refresh token received from cookie', {
            data: { token: token.substring(0, 20) + '...' },
        });
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
        log.info('Token hash calculated', {
            data: { hash: tokenHash.substring(0, 20) + '...' },
        });
        log.info('Stored tokens in DB', {
            data: {
                count: user.refreshTokens.length,
                hashes: user.refreshTokens.map(
                    (t) => t.tokenHash.substring(0, 20) + '...'
                ),
            },
        });
        const stored = user.refreshTokens.find(
            (token) => token.tokenHash === tokenHash
        );
        if (!stored) {
            /* SECURITY CHECK: Did this token exist very recently?
             * If user.refreshTokens has a token created in the last 10 seconds,
             * it's likely a double-render. Just return the current valid one.*/
            const recentToken = user.refreshTokens.find(
                (token) =>
                    new Date().getTime() - new Date(token.createdAt).getTime() <
                    10000
            );
            if (recentToken) {
                log.warn('Double render detected, ignoring revoked error');
                return res.status(200).json({ success: true });
                /**
                 * might implement this if the double render issue persists 
                 * const accessToken = signAccessToken({ uid: user._id.toString() });
                return res.status(200).json({
                    success: true,
                    accessToken,
                    user: { id: user.id, email: user.email, role: user.role }
                }); 
    */
            }
            log.error('No matching token found - REVOKED', {
                data: {
                    incomingHash: tokenHash.substring(0, 20) + '...',
                    storedHashes: user.refreshTokens.map(
                        (t) => t.tokenHash.substring(0, 20) + '...'
                    ),
                },
            });
            return next(AppError.unauthorized('Refresh token revoked'));
        }
        if (stored.expiresAt < new Date()) {
            //remove expired tokens
            user.refreshTokens = user.refreshTokens.filter(
                (token) => token.tokenHash !== tokenHash
            );
            await user.save();

            log.warn('Refresh token has expired');
            return next(AppError.unauthorized('Refresh token has expired'));
        }
        //rotate tokens - keep old token until new one is sent to client
        const userPayload: JWTUserPayload = {
            uid: user._id.toString(),
            email: user.email,
            subscriptionStatus: user.tierId as Subscription,
            role: user.role,
            displayName: user.email.split('@')[0],
        };
        const newRefreshToken = signRefreshToken(userPayload);

        const newRefreshHashedToken = hashToken(newRefreshToken!);
        //add new token to DB FIRST before removing old one
        user.refreshTokens.push({
            tokenHash: newRefreshHashedToken,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        //now remove the old token
        user.refreshTokens = user.refreshTokens.filter(
            (token) => token.tokenHash !== tokenHash
        );
        await user.save();

        const isProduction = process.env.NODE_ENV === 'production';
        const isNgrok = req.get('host')?.includes('ngrok-free.dev');

        // Use 'none' if we are on Render (Production) OR using the Ngrok tunnel
        // Use 'lax' ONLY if we are testing on plain http://localhost
        const cookieSameSite = isProduction || isNgrok ? 'none' : 'lax';

        // Use true if we are on Render OR Ngrok (since both provide HTTPS)
        const cookieSecure = isProduction || isNgrok;
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            //secure: process.env.NODE_ENV === 'production',
            secure: cookieSecure,
            path: '/',
            sameSite: cookieSameSite,
            signed: true,
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        //send the new access token
        const newAccessToken = signAccessToken(userPayload);
        res.status(200).json({
            success: true,
            accessToken: newAccessToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                profileImageUrl: user.profileImageUrl ?? '',
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
