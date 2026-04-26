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
    '/file-merger/initiate',
    authenticate,
    asyncHandler(initiateFileMergerStk)
);
paymentRoute.get(
    '/file-merger/status/:reference',
    authenticate,
    asyncHandler(pollFileMergerPaymentStatus)
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
paymentRoute.post(
    '/wallet/charge-folder-clean',
    authenticate,
    asyncHandler(chargeWalletForFolderCleaner)
);
paymentRoute.post(
    '/wallet/charge-file-merger',
    authenticate,
    asyncHandler(chargeWalletForFileMerger)
);
paymentRoute.post(
    '/wallet/refund-charge',
    authenticate,
    asyncHandler(refundWalletCharge)
);
