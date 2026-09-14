import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import {
    register,
    login,
    resetPassword,
    forgotPassword,
} from '../controllers/authController.js';
import { logout } from '../controllers/logoutController.js';
import { refresh } from '../controllers/refresh.js';
import authRateLimiter from '../middleware/authRateLimiter.js';
export const authRoute: Router = Router();

authRoute.post('/register', authRateLimiter, asyncHandler(register));
authRoute.post('/login', authRateLimiter, asyncHandler(login));
authRoute.patch('/reset-password/:token', asyncHandler(resetPassword));
authRoute.post('/forgot-password', asyncHandler(forgotPassword));
authRoute.post('/refresh', refresh);
authRoute.post('/logout', logout);
