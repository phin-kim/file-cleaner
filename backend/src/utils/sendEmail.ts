import type { Response, Request } from 'express';
import { UserModel } from '../schema/UsersSchema';
import type { Subscription_Period } from '../schema/UsersSchema';
import axios from 'axios';
import AppError from './appError';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
if (!BREVO_API_KEY) {
    throw AppError.badRequest('Brevo api key is missing');
}
export async function sendEmailAlert(req: Request) {
    const userId = req.query.userId;
    const user = await UserModel.findById(userId);
    const userEmail = user?.email;
    const TEMPLATE_ID = 4;
    const ADMIN_TEMPLATE_ID = 5;
    const userSubscriptionPeriod = user?.['subscription-period'];
    const lastPaymentDate = user?.['last-payment-date'];

    const now = new Date().getTime();
    const MONTHLY_LIMIT = 30 * 24 * 60 * 60 * 1000;
    const THREE_MONTH_LIMIT = 90 * 24 * 60 * 60 * 1000;

    if (lastPaymentDate && userSubscriptionPeriod) {
        const paymentTime = new Date(lastPaymentDate).getTime();
        const timeElapsed = now - paymentTime;
        const currentLimit =
            userSubscriptionPeriod ===
            ('monthly ' as unknown as Subscription_Period)
                ? MONTHLY_LIMIT
                : THREE_MONTH_LIMIT;
        if (timeElapsed > currentLimit) {
            //update ui to show subscription expired
            return {
                expired: true,
                message: 'Subscription expired',
            };
        } else {
            const daysRemaining = Math.max(
                0,
                Math.ceil((currentLimit - timeElapsed) / (24 * 60 * 60 * 1000))
            );
            if (daysRemaining === 2) {
                try {
                    await axios.post(
                        'https://api.brevo.com/v3/smtp/email',
                        {
                            to: [{ email: userEmail }],
                            TEMPLATE_ID,
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
                            ADMIN_TEMPLATE_ID,
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
            //set up an email to remind the users of their time elapse
        }
    }
}
