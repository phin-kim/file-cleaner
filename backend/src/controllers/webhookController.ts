import { UserModel } from '../schema/UsersSchema';
import type { Response, Request, NextFunction } from 'express';
import axios from 'axios';
import createLogger from '../utils/logger';
import crypto from 'node:crypto';
import AppError from '../utils/appError';
import { TransactionsModel } from '../schema/TransactionSchema';
import type { PaystackVerificationResponse } from '../Types/transactions';
import handleAxiosError from '../utils/axiosErrorHandler';

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
            const verification = await verifyTransaction(reference, next);
            log.debug('The response from verification', {
                data: { verification },
            });
            if (
                !verification?.status &&
                verification?.data.status !== 'success'
            ) {
                log.error(
                    `Error occurred after the paystack 200 for email ${verification?.data.customer.email}`,
                    {
                        data: {
                            message: verification?.data.message,
                        },
                    }
                );
            } else {
                log.debug(
                    'Debug check to see if the data base is being updated'
                );
                await TransactionsModel.findOneAndUpdate(
                    { reference: reference },
                    {
                        $set: { status: 'success' },
                    },
                    { returnDocument: 'after' }
                );
                //update the user

                await UserModel.findByIdAndUpdate(
                    userId,

                    {
                        $set: {
                            tierId: metadata.tierId,
                            'subscription-period': metadata.period,
                            'subscription-status': 'active',
                            'last-payment-date': new Date(),
                        },
                    },
                    { returnDocument: 'after', runValidators: true } // Returns the updated document
                );
                log.info('Databases updated');
            }
        }
    } catch (error) {
        log.error('Web hook error', { data: { error } });
        return next(error);
    }
}
export const verifyTransaction = async (
    reference: string,
    next: NextFunction
): Promise<PaystackVerificationResponse | undefined> => {
    try {
        log.debug(`We are verifying the transaction for ${reference}`);
        const response = await axios.get<PaystackVerificationResponse>(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        handleAxiosError(error, next);
        return;
    }
};
