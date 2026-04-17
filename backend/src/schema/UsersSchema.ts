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

const refreshTokenSchema = new Schema(
    {
        tokenHash: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true },
    },
    { _id: false }
);
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
        passwordHash: {
            type: String,
        },
        refreshTokens: {
            type: [refreshTokenSchema],
            default: [],
        },
        resetPasswordToken: String,
        resetPasswordExpires: Date,
        tierId: {
            type: String,
            required: true,
            default: 'free',
            enum: ['free', 'tier-1', 'tier-2', 'tier-3'],
        },
        'subscription-period': {
            type: String,
            enum: ['monthly', '3 months'],
        },
        'subscription-status': {
            type: String,
            enum: ['active', 'suspended', 'banned', 'pending'],
        },
        'last-payment-date': {
            type: Date,
            required: true,
            default: Date.now,
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
    },
    { timestamps: true }
);
export const UserModel = TidyUpConnection.model<User_Type>('User', UserSchema);
