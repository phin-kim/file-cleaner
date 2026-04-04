import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { paystackWebhook } from '../controllers/webhookController.js';
//import authenticate from '../middleware/authenticate.js';

export const webhook: Router = Router();
webhook.post('/webhook', asyncHandler(paystackWebhook));
