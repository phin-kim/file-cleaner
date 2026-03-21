import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { paystackWebhook } from '../controllers/webhookController';
import authenticate from '../middleware/authenticate';

export const webhook: Router = Router();
webhook.post('/webhook', asyncHandler(paystackWebhook));
