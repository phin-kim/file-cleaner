import { betterAuth } from 'better-auth';
import type { Auth, BetterAuthOptions } from 'better-auth';
import { admin } from 'better-auth/plugins';
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

type AppAuthOptions = BetterAuthOptions & {
    plugins: [ReturnType<typeof admin>];
    user: {
        additionalFields: {
            userId: { type: 'string'; defaultValue: string; input: false };
            dailyUsageCount: {
                type: 'number';
                defaultValue: number;
                input: false;
            };
            lastUsageDate: {
                type: 'date';
                defaultValue: () => Date;
                input: false;
            };
            role: { type: 'string'; defaultValue: string; input: false };
            walletBalance: {
                type: 'number';
                defaultValue: number;
                input: false;
            };
            profileImageUrl: {
                type: 'string';
                defaultValue: string;
                input: true;
            };
            profileImagePublicId: { type: 'string'; defaultValue: string };
        };
    };
};

const authOptions: AppAuthOptions = {
    database: mongodbAdapter(db),
    baseURL: `http://localhost:${process.env.PORT || 5000}`,
    emailAndPassword: { enabled: true },
    trustedOrigins: ['http://localhost:5173'],
    plugins: [admin()],
    user: {
        additionalFields: {
            userId: {
                type: 'string',
                defaultValue: '',
                input: false,
            },
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
            profileImagePublicId: {
                type: 'string',
                defaultValue: '',
            },
        },
    },
};

export const auth: Auth<AppAuthOptions> = betterAuth(authOptions);

export interface ManagedUserUpdate {
    userId: string;
    data: {
        dailyUsageCount?: number;
        lastUsageDate?: Date;
    };
}

export const updateManagedUser = async (
    body: ManagedUserUpdate,
    headers: Headers
): Promise<unknown> => {
    const adminApi = auth.api as typeof auth.api & {
        adminUpdateUser: (input: {
            body: ManagedUserUpdate;
            headers: Headers;
        }) => Promise<unknown>;
    };

    return adminApi.adminUpdateUser({ body, headers });
};
