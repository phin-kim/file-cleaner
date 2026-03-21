import { UserModel } from '../schema/UsersSchema';
import type { Response, Request, NextFunction } from 'express';
import createLogger from '../utils/logger';
import crypto from 'node:crypto';
import AppError from '../utils/appError';
import { TransactionsModel } from '../schema/TransactionSchema';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const log = createLogger('webhook.ts');
export async function paystackWebhook(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        //validate signature
        log.info('webhook url is called');
        const hash = crypto
            .createHmac('sha512', PAYSTACK_SECRET_KEY!)
            .update(JSON.stringify(req.body))
            .digest('hex');
        if (hash !== req.headers['x-paystack-signature']) {
            log.warn('Invalid webhook signature');
            return next(AppError.badRequest('Invalid signature'));
        }
        res.sendStatus(200);
        const event = req.body;
        if (event.event === 'charge.success') {
            const { reference, metadata } = event.data;
            const userId = metadata.userId;
            log.info('Payment successful webhook received', {
                data: {
                    reference,
                    userId,
                },
            });
            await TransactionsModel.findOneAndUpdate(
                { paystackReference: reference },
                {
                    $set: { status: 'success' },
                },
                { returnDocument: 'after' }
            );
            //update the user
            log.warn('metadata period ', { data: metadata.period });
            await UserModel.findByIdAndUpdate(
                userId,

                {
                    $set: {
                        'subscription-period': metadata.period,
                        'subscription-plan': metadata.tierId,
                        'subscription-status': 'active',
                        'last-payment-date': new Date(),
                    },
                },
                { returnDocument: 'after', runValidators: true } // Returns the updated document
            );
        }
    } catch (error) {
        log.error('Web hook error', { data: { error } });
    }
}
