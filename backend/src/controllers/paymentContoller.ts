import type { Response, Request, NextFunction } from 'express';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_KEY;
import createLogger from '../utils/logger';
import crypto from 'node:crypto';
import axios from 'axios';
import AppError from '../utils/appError';
import { paystackApi } from '../helpers/axiosInterceptor';
const log = createLogger('Payment.ts');
export async function mpesaPayment(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const { amount, phoneNumber, email, metadata, currency } = req.body;
    if (!amount || !phoneNumber || !metadata || !currency) {
        log.error('One of the values is missing ');
        throw AppError.notFound('One f the necessary fields is missing');
    }
    const reference = 'MPESA_' + crypto.randomUUID();
    //this is the create charge api
    /**TO DO:
     * verify status before offering the service
     *check for the pin depending on the response from data.status
     * have a redirect url
     * create a webhook
     * When a payment is successful, Paystack sends a charge.success webhook event to webhook URL that you provide. It's highly recommended that you use webhooks to confirm the payment status before delivering value to your customers.
     * You’ll typically listen to these events on a POST endpoint called your webhook URL.
     */
    const url = 'https://api.paystack.co/charge';
    const payload = {
        amount: amount * 100,
        email,
        currency: currency || 'KES',
        mobile_money: {
            phone: phoneNumber,
            provider: 'mpesa_offline',
        },
    };
    try {
        const paystackResponse = await paystackApi.post(
            url,
            {
                payload,
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        log.info('This is the response from paystack', {
            data: paystackResponse.data,
        });

        log.info('Data fom paystack', { data: paystackResponse.data.data });
        if (paystackResponse.data.status) {
            res.json({
                status: true,
                message: 'STK push sent successfully',
                data: { reference },
            });
        } else {
            res.status(400).json({
                status: false,
                message: paystackResponse.data.data.message,
            });
        }
    } catch (error) {
        throw new Error(`An error has occurred in payment ${error}`);
    }
}
