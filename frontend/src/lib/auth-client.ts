import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';
export const authClient = createAuthClient({
    baseURL: 'http://localhost:5000',
    plugins: [
        inferAdditionalFields({
            user: {
                dailyUsageCount: { type: 'number' },
                lastUsageDate: { type: 'date' },
                role: { type: 'string' },
                walletBalance: { type: 'number' },
                profileImageUrl: { type: 'string' },
            },
        }),
    ],
});
