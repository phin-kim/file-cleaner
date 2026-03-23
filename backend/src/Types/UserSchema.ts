import { Document } from 'mongoose';

export interface User {
    id: string;
    tierId: tierId;
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
    tierId: 'free' | 'tier-1' | 'tier-2' | 'tier-3';
    'subscription-period': Subscription_Period;
    'subscription-status': Subscription_Status;
    'last-payment-date': Date;

    refreshTokens: RefreshToken[];
}
export interface tierId {
    enum: ['free', 'tier-1', 'tier-2', 'tier-3'];
}
export interface Subscription_Period {
    enum: ['monthly', '3 months'];
}
export interface Subscription_Status {
    enum: ['active', 'suspended', 'banned'];
}
