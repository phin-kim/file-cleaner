import type { NextFunction, Request, Response } from 'express';
import { UserModel } from '../schema/UsersSchema.js';
import AppError from '../utils/appError.js';
import { comparePasswords, hashPassword } from '../utils/hashes.js';
import { validateRegisterInput } from '../config/validator.js';
import { hashToken, signAccessToken, signRefreshToken } from '../utils/jwt.js';
import createLogger from '../utils/logger.js';
const log = createLogger('AUTH CONTROLLER');

export async function register(req: Request, res: Response) {
    const { email, password } = validateRegisterInput(req.body);
    log.info('Data from the front end', { data: { email, password } });
    //check if user exists
    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
        log.warn('User already exists');

        throw AppError.conflict('Email already in use.Try logging in ');
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
    const isProduction = process.env.NODE_ENV === 'production';
    const isNgrok = req.get('host')?.includes('ngrok-free.dev');

    // Use 'none' if we are on Render (Production) OR using the Ngrok tunnel
    // Use 'lax' ONLY if we are testing on plain http://localhost
    const cookieSameSite = isProduction || isNgrok ? 'none' : 'lax';

    // Use true if we are on Render OR Ngrok (since both provide HTTPS)
    const cookieSecure = isProduction || isNgrok;
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        //secure: process.env.NODE_ENV === 'production',
        secure: cookieSecure,
        path: '/',
        sameSite: cookieSameSite,
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
export async function login(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;
    log.debug('This is the password', {
        data: {
            email,
            password,
        },
    });
    if (!password) {
        return next(AppError.badRequest('Password is required'));
    }
    const user = await UserModel.findOne({ email });
    log.debug('This is the user records', {
        data: { user },
    });
    if (!user) {
        log.error('Theres no user in the data base');
        throw AppError.notFound('User not found in the database');
    }
    const databaseHashedPassword = user.passwordHash;
    log.debug('Password hash from data base', {
        data: { passwordHashed: databaseHashedPassword },
    });
    if (!databaseHashedPassword) {
        log.error('User found but has no password hash stored');
        return next(
            new AppError('Account configuration error', 500, 'ServerError')
        );
    }
    const isMatched = await comparePasswords(password, databaseHashedPassword);
    if (!isMatched) {
        return next(AppError.unauthorized('Unauthorized user.Kindly Signup'));
    }
    const accessToken = signAccessToken({ uid: user._id.toString() });
    const refreshToken = signRefreshToken({ uid: user._id.toString() });

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
    const isProduction = process.env.NODE_ENV === 'production';
    const isNgrok = req.get('host')?.includes('ngrok-free.dev');

    // Use 'none' if we are on Render (Production) OR using the Ngrok tunnel
    // Use 'lax' ONLY if we are testing on plain http://localhost
    const cookieSameSite = isProduction || isNgrok ? 'none' : 'lax';

    // Use true if we are on Render OR Ngrok (since both provide HTTPS)
    const cookieSecure = isProduction || isNgrok;
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        //secure: process.env.NODE_ENV === 'production',
        secure: cookieSecure,
        path: '/',
        sameSite: cookieSameSite,
        signed: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
        success: true,
        accessToken,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
        },
    });
}
