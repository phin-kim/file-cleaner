import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import type { JWTTokenPayload } from '../Types/authenticate.js';
import createLogger from './logger.js';
import 'dotenv/config';

const log = createLogger('JWT-helper');
const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

const ACCESS_EXPIRES_IN = '10min';
const REFRESH_EXPIRES_IN = '14d';
export const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
};
export const signAccessToken = (payload: JWTTokenPayload) => {
    if (!accessSecret) {
        log.error('JWT_ACCESS_SECRET not configured');
        return;
    }
    return jwt.sign(payload, accessSecret, { expiresIn: ACCESS_EXPIRES_IN });
};
export const signRefreshToken = (payload: JWTTokenPayload) => {
    if (!refreshSecret) {
        log.error('JWT_REFRESH_TOKEN not configured');
        return;
    }
    return jwt.sign(payload, refreshSecret, { expiresIn: REFRESH_EXPIRES_IN });
};
