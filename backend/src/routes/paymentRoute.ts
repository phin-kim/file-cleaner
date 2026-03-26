import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { mpesaPayment } from '../controllers/paymentContoller';
import authenticate from '../middleware/authenticate';

export const paymentRoute: Router = Router();
paymentRoute.post(
    '/initialize-payment',
    authenticate,
    asyncHandler(mpesaPayment)
);
