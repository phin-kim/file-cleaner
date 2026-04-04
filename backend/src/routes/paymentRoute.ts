import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { mpesaPayment } from '../controllers/paymentContoller.js';
import authenticate from '../middleware/authenticate.js';

export const paymentRoute: Router = Router();
paymentRoute.post(
    '/initialize-payment',
    authenticate,
    asyncHandler(mpesaPayment)
);
