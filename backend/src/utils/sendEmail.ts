import type { Request } from 'express';
import axios from 'axios';

import { UserModel } from '../schema/UsersSchema.js';
import type { Subscription_Period } from '../schema/UsersSchema.js';
import AppError from './appError.js';
import createLogger from './logger.js';

const log = createLogger('sendEmailAlert.ts');
const BREVO_API_KEY = process.env.BREVO_API_KEY;
if (!BREVO_API_KEY) {
    throw AppError.badRequest('Brevo api key is missing');
}
interface SendEmailResponse {
    expired: boolean;
    message: string;
}
export async function sendEmailAlert(
    req: Request
): Promise<SendEmailResponse | undefined> {
    const userId = req.query.userId;
    const user = await UserModel.findById(userId);
    const userEmail = user?.email;
    const TEMPLATE_ID = 4;
    const ADMIN_TEMPLATE_ID = 5;
    const userSubscriptionPeriod = user?.['subscription-period'];
    const lastPaymentDate = user?.['last-payment-date'];

    const now = new Date().getTime();
    const MONTHLY_LIMIT = 2 * 24 * 60 * 60 * 1000; //test for 2 days to see if the email wll be sent
    const THREE_MONTH_LIMIT = 2 * 24 * 60 * 60 * 1000;

    if (lastPaymentDate && userSubscriptionPeriod) {
        const paymentTime = new Date(lastPaymentDate).getTime();
        const timeElapsed = now - paymentTime;
        const currentLimit =
            userSubscriptionPeriod ===
            ('monthly' as unknown as Subscription_Period)
                ? MONTHLY_LIMIT
                : THREE_MONTH_LIMIT;
        if (timeElapsed > currentLimit) {
            //update ui to show subscription expired
            await UserModel.findByIdAndUpdate(
                userId,
                {
                    $set: { 'subscription-status': 'suspended' },
                },
                { returnDocument: 'after', runValidators: true }
            );
            log.debug(
                'This is what is supposed to be sent over to the routes',
                { data: { expired: true, message: 'Subscription expired' } }
            );
            return {
                expired: true,
                message: 'Subscription expired',
            };
        } else {
            const daysRemaining = Math.max(
                0,
                Math.ceil((currentLimit - timeElapsed) / (24 * 60 * 60 * 1000))
            );
            log.highlight(
                `THis are the days remaining for ${userEmail}: ${daysRemaining}`
            );
            if (daysRemaining <= 2) {
                try {
                    await axios.post(
                        'https://api.brevo.com/v3/smtp/email',
                        {
                            to: [{ email: userEmail }],
                            templateId: TEMPLATE_ID,
                            params: {
                                daysRemaining,
                                adminName: 'Phinehas Njuguna',
                                year: new Date().getFullYear(),
                            },
                        },
                        {
                            headers: {
                                'api-key': BREVO_API_KEY,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                } catch (error) {
                    // send alert to me as the admin
                    await axios.post(
                        'https://api.brevo.com/v3/smtp/email',
                        {
                            to: [{ email: 'phinjugushdev@gmail.com' }],
                            templateId: ADMIN_TEMPLATE_ID,
                            params: {
                                subject: `Email alert fail for ${userEmail}`,
                                timestamp: new Date().toLocaleDateString(),
                                priority: 'High',
                                content: `${userEmail} has had an error when we try to send the subscription alert `,
                                year: new Date().getFullYear(),
                            },
                        },
                        {
                            headers: {
                                'api-key': BREVO_API_KEY,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                }
            }
            return {
                expired: false,
                message: 'Subscription active',
            };
        }
    }
    return {
        expired: false,
        message: 'No subscription data',
    };
}
