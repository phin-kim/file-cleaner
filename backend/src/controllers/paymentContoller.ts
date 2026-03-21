/**TO DO:
 * verify status before offering the service
 *check for the pin depending on the response from data.status
 * have a redirect url
 * create a webhook
 * When a payment is successful, Paystack sends a charge.success webhook event to webhook URL that you provide. It's highly recommended that you use webhooks to confirm the payment status before delivering value to your customers.
 * You’ll typically listen to these events on a POST endpoint called your webhook URL.
 */
import type { Response, Request, NextFunction } from 'express';
import createLogger from '../utils/logger';
import crypto from 'node:crypto';
import axios from 'axios';
import AppError from '../utils/appError';
import type { AuthenticatedRequest } from '../Types/authenticate';
import { TransactionsModel } from '../schema/TransactionSchema';
import { hashPhoneNumber } from '../utils/hashes';
import { UserModel } from '../schema/UsersSchema';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const TEST_PHONE_NUMBER = '+254710000000';
const log = createLogger('Payment.ts');
export async function mpesaPayment(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq?.user?.uid;
    const { amount, phoneNumber, email, metadata, currency } = req.body;
    if (!amount) {
        log.error('One of the values is missing ');
        return next(
            AppError.badRequest('One of the necessary fields is missing')
        );
    }
    if (!email) {
        log.error('Email is missing ');
        return next(AppError.badRequest('Email field is necessary'));
    }
    if (!phoneNumber) {
        log.error('Phone number is missing');
        return next(AppError.badRequest('Phone number  is necessary'));
    }

    const reference = 'MPESA_' + crypto.randomUUID();
    //check the mode that we are currently in to apply the correct phone number
    let formattedPhone = phoneNumber
        .toString()
        .replace(/\s/g, '') // Remove all spaces
        .replace(/[^\d]/g, '') // Remove anything not a digit
        .trim();
    const isTestMode = PAYSTACK_SECRET_KEY?.startsWith('sk_test_');
    if (isTestMode) {
        //if using real numbers in test mode, replace with test number
        formattedPhone = TEST_PHONE_NUMBER;
        log.info('Using M-Pesa test number for STK push', {
            data: {
                phone: formattedPhone,
                provider: 'mpesa',
            },
        });
        /*if (
            formattedPhone.includes('710000000') ||
            formattedPhone.endsWith('710000000') ||
            formattedPhone === '254710000000' ||
            formattedPhone === '710000000'
        ) {
            formattedPhone = '254710000000'; // Exact format Paystack expects
            log.info('Using M-Pesa test number', {
                data: {
                    phone: formattedPhone,
                },
            });
        } else {
            // If they're using any other number in test mode, warn but still format it
            log.warn(
                'Using non-standard test number. Recommended: 254710000000',
                {
                    data: {
                        original: phoneNumber,
                        formatted: formattedPhone,
                    },
                }
            );
        }*/
    } else {
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '+254' + formattedPhone.substring(1);
        } else if (
            formattedPhone.startsWith('7') ||
            formattedPhone.startsWith('1')
        ) {
            formattedPhone = '+254' + formattedPhone;
        }
        // Remove any double zeros
        formattedPhone = formattedPhone.replace(/^2540+/, '+254');
    }
    // Final validation - ensure it's exactly 12 digits (254 + 9 digits)
    /* if (!/^254[0-9]{9}$/.test(formattedPhone)) {
        log.error('Invalid phone number format after formatting', {
            data: {
                original: phoneNumber,
                formatted: formattedPhone,
            },
        });
        return next(
            AppError.badRequest(
                'Invalid phone number format. Phone number must be in format: 254XXXXXXXXX'
            )
        );
    }*/
    //this is the create charge api

    const url = 'https://api.paystack.co/charge';
    const payload = {
        amount: amount * 100,
        email: email,
        currency: currency || 'KES',
        reference: reference,
        metadata: {
            ...metadata,
            userId: userId,
            project: 'tidy-up',
        },
        mobile_money: {
            phone: formattedPhone,
            provider: 'mpesa',
        },
    };
    const phoneNumberHash = hashPhoneNumber(formattedPhone);
    log.info('Sending M-Pesa payment request to paystack', { data: payload });
    log.info('=== INFO PAYLOAD ===');
    log.info(
        `Phone number being sent:${JSON.stringify(payload.mobile_money.phone)}`
    );
    log.info('Phone number length:', payload.mobile_money.phone.length);
    log.info('Phone number regex test:', {
        data: { number: /^254[0-9]{9}$/.test(payload.mobile_money.phone) },
    });
    log.info('Full payload:', {
        data: { payload: JSON.stringify(payload, null, 2) },
    });
    log.info(`Is test mode:${isTestMode}`);
    log.info(`Key prefix: ${PAYSTACK_SECRET_KEY?.substring(0, 8)}`);
    log.info(`Checking the api key ${PAYSTACK_SECRET_KEY}`);
    log.info('===================');
    try {
        const paystackResponse = await axios.post(url, payload, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        log.info('Data fom paystack', {
            data: {
                status: paystackResponse.status,
                data: paystackResponse.data,
            },
        });
        //check if the charge was created successfully
        const paystackMetadata = paystackResponse.data.data.metadata;
        if (paystackResponse.data.status) {
            await TransactionsModel.create({
                userId,
                amount,
                email,
                phoneNumberHash,
                status: 'pending',
                reference,

                paystackReference: paystackResponse.data.data.reference,
                metadata: {
                    period: paystackMetadata.period,
                    paymentMethod: paystackMetadata.paymentMethod,
                    tierName: paystackMetadata.tierName, // Ensure these match schema keys
                    tierId: paystackMetadata.tierId,
                },
                project: 'tidy-up',
                provider: 'mpesa',
                createdAt: new Date(),
            });
            await UserModel.findOneAndUpdate(
                {
                    _id: userId,
                },
                {
                    $set: {
                        'subscription-period': paystackMetadata.period,
                        'subscription-plan': paystackMetadata.tierName,
                        'subscription-status': 'pending',
                    }, // Good idea to track this,
                },
                { returnDocument: 'after', runValidators: true } // Returns the updated document
            );
            //Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
            //pesa returns a pending state until the user has verified using their pin
            res.json({
                status: true,
                message:
                    'Please complete authorization process on your mobile phone',
                data: {
                    reference: reference,
                    paystackReference: paystackResponse.data.data.reference,
                    amount: amount,
                    phoneNumber: phoneNumber,
                },
            });
        } else {
            log.error('Paystack returned error status', {
                data: {
                    message: paystackResponse.data.message,
                    data: paystackResponse.data.data,
                },
            });
            res.status(400).json({
                status: false,
                message: paystackResponse.data.data.message,
            });
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            //this is an axios error with response frm paystack
            if (error.response) {
                //request was made but the server responded with a status code that falls out of range of the 2XX
                log.error('Paystack API responded with an error', {
                    data: {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data,
                        headers: error.response.headers,
                    },
                });
                // Special handling for test mode phone number error
                if (
                    isTestMode &&
                    error.response.data?.data?.message?.includes(
                        'test mobile money number'
                    )
                ) {
                    return next(
                        AppError.badRequest(
                            `In test mode, please use Paystack test numbers: ${TEST_PHONE_NUMBER}`
                        )
                    );
                }
                //extract meaning full error message from paystack response
                const paystackErrorMessage =
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
                return next(AppError.badRequest(paystackErrorMessage));
            } else if (error.request) {
                // request was made but no response was given

                log.error('No response from paystack', {
                    data: {
                        request: error.request,
                        message: error.message,
                    },
                });
                return next(
                    AppError.serviceUnavailable(
                        'Payment service is currently unavailable.Please try again later'
                    )
                );
            } else {
                //something happened in setting up the request that triggered the error
                log.error('Error insetting up paystack request', {
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
