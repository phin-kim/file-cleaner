/**TO DO:
 * verify status before offering the service
 *check for the pin depending on the response from data.status
 * have a redirect url
 * create a webhook
 * When a payment is successful, payhero sends a charge.success webhook event to webhook URL that you provide. It's highly recommended that you use webhooks to confirm the payment status before delivering value to your customers.
 * You’ll typically listen to these events on a POST endpoint called your webhook URL.
 */
import crypto from 'node:crypto';
import axios from 'axios';
import type { Response, Request, NextFunction } from 'express';
import createLogger from '../utils/logger.js';
import AppError from '../utils/appError.js';
import type {
    AuthenticatedRequest,
    JWTUserPayload,
} from '../Types/authenticate.js';
import { TransactionsModel } from '../schema/TransactionSchema.js';
import { UserModel } from '../schema/UsersSchema.js';
const PAYHERO_AUTH_TOKEN = process.env.PAYHERO_AUTH_TOKEN;
const log = createLogger('Payment.ts');
export async function mpesaPayment(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authReq = req as AuthenticatedRequest;
    const userPayload = authReq?.user;
    const userId = (userPayload as JWTUserPayload)?.uid;
    const { amount, email, phoneNumber } = req.body;

    if (!amount) {
        log.error('Amount is missing ');
        return next(AppError.badRequest('Amount field is necessary'));
    }
    if (!email) {
        log.error('Email is missing ');
        return next(AppError.badRequest('Email field is necessary'));
    }
    if (!phoneNumber) {
        log.error('Phone number is missing');
        return next(AppError.badRequest('Phone number  is necessary'));
    }
    log.info('What email is being passed ', { data: email });
    const user = await UserModel.findOne({ email });
    log.warn(`is the user there ${user ? 'YES' : 'NO'}`);

    if (!user) {
        log.warn(`The user isn't there for email : ${email}`);
        return next(new AppError(`${email} not found`, 404, 'NotFound'));
    }
    const reference = 'MPESA_' + crypto.randomUUID();

    /*if (!/^\+254[0-9]{9}$/.test(phoneNumber)) {
        log.error('Invalid phone number format after formatting', {
            data: {
                original: phoneNumber,
            },
        });
        return next(
            AppError.badRequest(
                'Invalid phone number format. Phone number must be in format: 7XXXXXXXX'
            )
        );
    }
    //check the mode that we are currently in to apply the correct phone number
    let formattedPhone = phoneNumber
        .toString()
        .replace(/\s/g, '')
        .replace(/[^\d]/g, '')
        .trim();

    if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.substring(1);
    } else if (
        formattedPhone.startsWith('7') ||
        formattedPhone.startsWith('1')
    ) {
        formattedPhone = '+254' + formattedPhone;
    }
    formattedPhone = formattedPhone.replace(/^2540+/, '+254');*/

    //this is the create charge api

    const url = 'https://backend.payhero.co.ke/api/v2/payments';
    const payload = {
        amount: amount,
        customer_name: email,
        channel_id: 6761,
        //currency: 'KES',
        phone_number: phoneNumber,
        provider: 'm-pesa',
        external_reference: reference,
        /*metadata: {
            ...metadata,
            userId: userId,
            project: 'tidy-up',
        },
        mobile_money: {
           
            
        },*/
    };
    //const phoneNumberHash = hashPhoneNumber(formattedPhone);
    log.info('Sending M-Pesa payment request to payhero', { data: payload });
    log.info('=== INFO PAYLOAD ===');

    log.info('Full payload:', {
        data: { payload: JSON.stringify(payload, null, 2) },
    });
    //log.info(`Is test mode:${isTestMode}`);

    log.info('===================');
    try {
        const payheroResponse = await axios.post(url, payload, {
            headers: {
                Authorization: `Basic ${PAYHERO_AUTH_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });
        const resp = payheroResponse.data;
        log.info('Data fom payhero', {
            data: {
                resp,
            },
        });

        if (payheroResponse.data.success) {
            log.debug('Are the db being touched');

            await TransactionsModel.create({
                userId,
                amount,
                email,
                //phoneNumberHash,
                status: 'pending',
                reference,
                //commented out coz of the shape of the response
                /*payheroReference: payheroResponse.data.data.reference,
                metadata: {
                    period: payheroMetadata.period,
                    paymentMethod: payheroMetadata.paymentMethod,
                    tierName: payheroMetadata.tierName, // Ensure these match schema keys
                    tierId: payheroMetadata.tierId,
                },*/
                project: 'tidy-up',
                provider: 'mpesa',
                createdAt: new Date(),
            });
            /*await UserModel.findByIdAndUpdate(
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
            );*/
            //Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
            //pesa returns a pending state until the user has verified using their pin
            if (payheroResponse.data.success) {
                res.json({
                    status: true,
                    message:
                        'Please complete authorization process on your mobile phone',
                    data: {
                        reference: reference,
                        amount: amount,
                    },
                });
            }
        } else {
            log.error('payhero returned error status', {
                data: {
                    message: payheroResponse.data.message,
                    data: payheroResponse.data.data,
                },
            });
            res.status(400).json({
                status: false,
                message: payheroResponse.data.data.message,
            });
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            //this is an axios error with response frm payhero
            if (error.response) {
                //request was made but the server responded with a status code that falls out of range of the 2XX
                log.error('payhero API responded with an error', {
                    data: {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data,
                        headers: error.response.headers,
                    },
                });

                //extract meaning full error message from payhero response
                const payheroErrorMessage =
                    error.response.data?.data?.message ||
                    error.response.data?.data?.error ||
                    `Payment failed: ${error.response.statusText}`;
                //check for specifically for mpesa errors,
                if (
                    error.response.data?.data?.code === 'mobile_money_required'
                ) {
                    return next(
                        AppError.badRequest(
                            'Invalid phone number format for M-Pesa'
                        )
                    );
                }
                return next(AppError.badRequest(payheroErrorMessage));
            } else if (error.request) {
                // request was made but no response was given

                log.error('No response from payhero', {
                    data: {
                        // DO NOT log error.request directly
                        message: error.message,
                        method: error.config?.method,
                        url: error.config?.url,
                        // If you need request details, pick specific fields
                        path: error.request._path || error.request.path,
                    },
                });
                return next(
                    new AppError(
                        'Payment service is currently unavailable.Please try again later',
                        503,
                        'PaymentError'
                    )
                );
            } else {
                //something happened in setting up the request that triggered the error
                log.error('Error insetting up payhero request', {
                    data: {
                        message: error.message,
                        config: error.config,
                    },
                });
                return next(
                    new AppError(
                        'Failed to process payment request',
                        500,
                        'Config-Error'
                    )
                );
            }
        } else if (error instanceof AppError) {
            //rethrow app errors to be handled by global error handler
            return next(error);
        } else if (error instanceof Error) {
            //generic errors
            log.error('Unexpected error in mpesaPayment', {
                data: {
                    name: error.name,

                    message: error.message,
                    stack: error.stack,
                },
            });
            return next(
                new AppError(
                    'An unexpected error occurred while processing payment',
                    500,
                    'UnknownError'
                )
            );
        } else {
            //unknown error type
            log.error('Unknown error type in mpesaPayment', {
                data: { error },
            });
            return next(new AppError('An unknown error occurred'));
        }
    }
}
