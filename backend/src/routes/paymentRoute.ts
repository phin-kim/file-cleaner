import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { mpesaPayment } from '../controllers/paymentContoller';

export const paymentRoute = Router();
paymentRoute.post('/initialize-payment', asyncHandler(mpesaPayment));
