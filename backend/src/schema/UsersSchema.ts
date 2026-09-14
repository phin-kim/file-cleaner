import { Schema } from 'mongoose';
import { TidyUpConnection } from '../config/DB.js';
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
    dailyUsageCount: number;
    lastUsageDate: Date;
    resetPasswordToken: string | undefined;
    resetPasswordExpires: Date | undefined;
    refreshTokens: RefreshToken[];
    walletBalance?: number;
    profileImageUrl?: string;
    profileImagePublicId?: string;
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

const UserSchema = new Schema<User_Type>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        dailyUsageCount: {
            type: Number,
            default: 0,
        },

        lastUsageDate: {
            type: Date,
            default: Date.now,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        walletBalance: {
            type: Number,
            default: 30,
            min: 0,
        },
        profileImageUrl: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);
export const UserModel = TidyUpConnection.model<User_Type>('User', UserSchema);
