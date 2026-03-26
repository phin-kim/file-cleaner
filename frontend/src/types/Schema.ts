import { Document } from 'mongoose';
import type { string } from 'zod';
export interface RefreshToken {
    tokenHash: string;
    createdAt: Date;
    expiresAt: Date;
}
export interface User_Type extends Document {
    email: string;
    passwordHash?: string;
    role: 'user' | 'admin';
    createdAt: Date;
    subscription: Subscription_Status;
    refreshTokens: RefreshToken[];
}
export interface Subscription_Status {
    enum: ['tier-1', 'tier-2', 'tier-3'];
}
