import type { NextFunction, Request, Response } from 'express';
import { UserModel } from '../schema/UsersSchema.js';
import AppError from '../utils/appError.js';
import { comparePasswords, hashPassword } from '../utils/hashes.js';
import { validateRegisterInput } from '../config/validator.js';
import { hashToken, signAccessToken, signRefreshToken } from '../utils/jwt.js';
import createLogger from '../utils/logger.js';
import validateAndNormalizeEmail from '../middleware/emailValidator.js';
import axios from 'axios';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
if (!BREVO_API_KEY) {
    throw AppError.badRequest('Brevo api key is missing');
}
const log = createLogger('AUTH CONTROLLER');

export async function register(req: Request, res: Response) {
    const { email, password } = validateRegisterInput(req.body);
    const isValid = validateAndNormalizeEmail(email);
    if (!isValid) {
        throw AppError.validation('Invalid email format ');
    }
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
    const isValid = validateAndNormalizeEmail(email);
    if (!isValid) {
        throw AppError.validation('Invalid email format ');
    }
    const user = await UserModel.findOne({ email });
    log.debug(`This is the user records`, { data: { user } });
    if (!user) {
        log.error('Theres no user in the data base');
        throw AppError.notFound('User not found ');
    }
    const databaseHashedPassword = user.passwordHash;

    if (!databaseHashedPassword) {
        log.error('User found but has no password hash stored');
        return next(
            new AppError('Account configuration error', 500, 'ServerError')
        );
    }
    const isMatched = await comparePasswords(password, databaseHashedPassword);
    if (!isMatched) {
        return next(AppError.unauthorized('Wrong password input.'));
    }
    const accessToken = signAccessToken({ uid: user._id.toString() });
    const refreshToken = signRefreshToken({ uid: user._id.toString() });

    const refreshTokenHash = hashToken(refreshToken!);

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
const TEMPLATE_ID = 6;
const ADMIN_TEMPLATE_ID = 5;
export async function forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
        return res.status(200);
    }
    const resetToken = crypto.randomUUID().toString();
    user.resetPasswordToken = resetToken;
    // Sets expiration to 10 minutes from now
    user.resetPasswordExpires = new Date(Date.now() + 600000);
    await user.save();
    const incomingOrigin = req.get('origin') || req.get('referer');

    let frontendBaseUrl = process.env.FRONTEND_URL;

    if (incomingOrigin) {
        // Remove trailing slashes if they exist to prevent // in the URL
        frontendBaseUrl = incomingOrigin.replace(/\/$/, '');
    } else if (!frontendBaseUrl) {
        frontendBaseUrl = 'http://localhost:5173';
    }

    const resetURL = `${frontendBaseUrl}/auth/reset-password?token=${resetToken}`;

    log.info(`Reset link generated for origin: ${frontendBaseUrl}`);
    try {
        await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                to: [{ email: email }],
                templateId: TEMPLATE_ID,
                params: {
                    resetLink: resetURL,
                },
            },
            {
                headers: {
                    'api-key': BREVO_API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        );
        res.status(200).json({ success: true });
    } catch (error) {
        // send alert to me as the admin
        await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                to: [{ email: 'phinjugushdev@gmail.com' }],
                templateId: ADMIN_TEMPLATE_ID,
                params: {
                    subject: `Failure for  ${email} in resetting password`,
                    timestamp: new Date().toLocaleDateString(),
                    priority: 'High',
                    content: `${email} has had an error when we try reset the email `,
                    year: new Date().getFullYear(),
                },
            },
            {
                headers: {
                    'api-key': BREVO_API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        );
    }
}
export async function resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const { password } = req.body;
    const { token } = req.params;
    const user = await UserModel.findOne({
        resetPasswordExpires: { $gt: Date.now() }, //must not be expired
        resetPasswordToken: token,
    });
    if (!user) {
        return next(AppError.badRequest('Token is invalid or expired'));
    }
    const hashedPassword = await hashPassword(password);
    user.passwordHash = hashedPassword;
    user.resetPasswordExpires = undefined;
    user.resetPasswordToken = undefined;
    await user.save();
    res.status(200).json({ success: true });
}
