import { Schema } from 'mongoose';
import type { User_Type } from '../Types/UserSchema';
import { TidyUpConnection } from '../config/DB';
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
            select: false,
        },
        refreshTokens: {
            type: [refreshTokenSchema],
            default: [],
        },

        'subscription-plan': {
            type: String,
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
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
    },
    { timestamps: true }
);
export const UserModel = TidyUpConnection.model<User_Type>('User', UserSchema);
