import type { Request, Response } from 'express';
import { UserModel } from '../schema/UsersSchema';
import AppError from '../utils/appError';
import { hashPassword } from '../utils/hashes';
import { validateRegisterInput } from '../config/validator';
import { hashToken, signAccessToken, signRefreshToken } from '../utils/jwt';
import createLogger from '../utils/logger';
const log = createLogger('AUTH CONTROLLER');
export async function register(req: Request, res: Response) {
    const { email, password } = validateRegisterInput(req.body);
    log.info('Data from the front end', { data: { email, password } });
    //check if user exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
        log.warn('User already exists');

        throw AppError.conflict('Email already in use');
    }
    //hash password
    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({
        email,
        passwordHash,
    });
    const accessToken = signAccessToken({ uid: user._id.toString() });
    const refreshToken = signRefreshToken({
        uid: user._id.toString(),
    });
    //nb this if statement is there not necessarily for logic but coz the hash token brings an error so its either this or the non null assertion

    /*if (!refreshToken) {
        log.warn('Token has expired');
        throw AppError.tokenExpired('Kindly log in again');
    }*/
    const refreshTokenHash = hashToken(refreshToken!);
    log.info('Storing refresh token hash in DB', {
        data: {
            hash: refreshTokenHash.substring(0, 20) + '...',
            token: refreshToken!.substring(0, 20) + '...',
        },
    });
    user.refreshTokens.push({
        tokenHash: refreshTokenHash,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await user.save();
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/api/auth',
        sameSite: 'strict',
        signed: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({
        success: true,
        accessToken,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
        },
    });
}
