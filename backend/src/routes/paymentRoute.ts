import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { mpesaPayment } from '../controllers/paymentContoller.js';
import {
    initiateFolderCleanStk,
    initiateWalletTopupStk,
    pollFolderCleanPaymentStatus,
    pollWalletTopupPaymentStatus,
} from '../controllers/payHeroPayment.js';
import authenticate from '../middleware/authenticate.js';

export const paymentRoute: Router = Router();
paymentRoute.post(
    '/initialize-payment',
    authenticate,
    asyncHandler(mpesaPayment)
);
paymentRoute.post(
    '/folder-clean/initiate',
    authenticate,
    asyncHandler(initiateFolderCleanStk)
);
paymentRoute.get(
    '/folder-clean/status/:reference',
    authenticate,
    asyncHandler(pollFolderCleanPaymentStatus)
);
paymentRoute.post(
    '/wallet-topup/initiate',
    authenticate,
    asyncHandler(initiateWalletTopupStk)
);
paymentRoute.get(
    '/wallet-topup/status/:reference',
    authenticate,
    asyncHandler(pollWalletTopupPaymentStatus)
);
