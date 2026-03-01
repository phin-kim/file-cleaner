import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { register } from '../controllers/authController';
import { logout } from '../controllers/logoutController';
import { refresh } from '../controllers/refresh';
export const authRoute = Router();
authRoute.post('/register', asyncHandler(register));
authRoute.post('/refresh', refresh);
authRoute.post('/logout', logout);
