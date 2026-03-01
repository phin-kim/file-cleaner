import { Document } from 'mongoose';

export interface User {
    id: string;
    plan: Subscription_Plan;
}
export interface RefreshToken {
    tokenHash: string;
    createdAt: Date;
    expiresAt: Date;
}
export interface User_Type extends Document {
    email: string;
    passwordHash: string;
    role: 'user' | 'admin';
    createdAt: Date;
    subscription: Subscription_Plan;
    refreshTokens: RefreshToken[];
}
export interface Subscription_Plan {
    enum: ['tier-1', 'tier-2', 'tier-3'];
}
