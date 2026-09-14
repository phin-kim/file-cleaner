import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';
import AppError from '../utils/appError';
const isProd = process.env.NODE_ENV === 'production';
const TIDY_UP_DATABASE_URL = isProd
    ? process.env.TIDY_UP_DB ||
      (() => {
          throw AppError.notFound('Missing TIDY_UP_DB in production');
      })()
    : 'mongodb://127.0.0.1:27017/tidyUpDB';
const client = new MongoClient(TIDY_UP_DATABASE_URL!);
const db = client.db();

export const auth = betterAuth({
    database: mongodbAdapter(db),
    baseURL: `http://localhost:${process.env.PORT || 5000}`,
    emailAndPassword: { enabled: true },
    trustedOrigins: ['http://localhost:5173'],
    user: {
        additionalFields: {
            dailyUsageCount: {
                type: 'number',
                defaultValue: 0,
                input: false,
            },
            lastUsageDate: {
                type: 'date',
                defaultValue: () => new Date(),
                input: false,
            },
            role: {
                type: 'string',
                defaultValue: 'user',
                input: false,
            },
            walletBalance: {
                type: 'number',
                defaultValue: 30,
                input: false,
            },
            profileImageUrl: {
                type: 'string',
                defaultValue: '',
                input: true, // Allow user input/image setting
            },
        },
    },
});
