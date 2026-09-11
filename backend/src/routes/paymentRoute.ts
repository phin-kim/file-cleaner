import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { mpesaPayment } from '../controllers/paymentContoller.js';
import {
    chargeWalletForFileMerger,
    chargeWalletForFolderCleaner,
    initiateFileMergerStk,
    initiateFolderCleanStk,
    initiateWalletTopupStk,
    pollFileMergerPaymentStatus,
    pollFolderCleanPaymentStatus,
    pollWalletTopupPaymentStatus,
    refundWalletCharge,
} from '../controllers/payHeroPayment.js';
import authenticate from '../middleware/authenticate.js';
import {
    paymentInitiationRateLimiter,
    paymentStatusRateLimiter,
} from '../middleware/rateLimiters.js';

export const paymentRoute: Router = Router();
paymentRoute.post(
    '/initialize-payment',
    authenticate,
    paymentInitiationRateLimiter,
    asyncHandler(mpesaPayment)
);
paymentRoute.post(
    '/folder-clean/initiate',
    authenticate,
    paymentInitiationRateLimiter,
    asyncHandler(initiateFolderCleanStk)
);
paymentRoute.get(
    '/folder-clean/status/:reference',
    authenticate,
    paymentStatusRateLimiter,
    asyncHandler(pollFolderCleanPaymentStatus)
);
paymentRoute.post(
    '/file-merger/initiate',
    authenticate,
    paymentInitiationRateLimiter,
    asyncHandler(initiateFileMergerStk)
);
paymentRoute.get(
    '/file-merger/status/:reference',
    authenticate,
    paymentStatusRateLimiter,
    asyncHandler(pollFileMergerPaymentStatus)
);
paymentRoute.post(
    '/wallet-topup/initiate',
    authenticate,
    paymentInitiationRateLimiter,
    asyncHandler(initiateWalletTopupStk)
);
paymentRoute.get(
    '/wallet-topup/status/:reference',
    authenticate,
    paymentStatusRateLimiter,
    asyncHandler(pollWalletTopupPaymentStatus)
);
paymentRoute.post(
    '/wallet/charge-folder-clean',
    authenticate,
    paymentInitiationRateLimiter,
    asyncHandler(chargeWalletForFolderCleaner)
);
paymentRoute.post(
    '/wallet/charge-file-merger',
    authenticate,
    paymentInitiationRateLimiter,
    asyncHandler(chargeWalletForFileMerger)
);
paymentRoute.post(
    '/wallet/refund-charge',
    authenticate,
    paymentInitiationRateLimiter,
    asyncHandler(refundWalletCharge)
);
