import type { Request, Response } from 'express';
import { UserModel } from '../schema/UsersSchema';
import AppError from '../utils/appError';
import { comparePasswords, hashPassword } from '../utils/passwords';
import { validateRegisterInput } from '../config/validator';
import { hashToken, signAccessToken, signRefreshToken } from '../utils/jwt';
export async function register(req: Request, res: Response) {
    const { email, password } = validateRegisterInput(req.body);
    //check if user exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
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
    if (!refreshToken) {
        throw AppError.tokenExpired('Kindly log in again');
    }
    const refreshTokenHash = hashToken(refreshToken);
    user.refreshTokens.push({
        tokenHash: refreshTokenHash,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await user.save();
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: 'auth/refresh',
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
