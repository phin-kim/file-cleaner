import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { register } from '../controllers/authController.js';
import { logout } from '../controllers/logoutController.js';
import { refresh } from '../controllers/refresh.js';
export const authRoute: Router = Router();
authRoute.post('/register', asyncHandler(register));
authRoute.post('/refresh', refresh);
authRoute.post('/logout', logout);
