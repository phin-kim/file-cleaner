import { Schema } from 'mongoose';
import type { User_Type } from '../Types/UserSchema';
import { UserConnection } from '../config/DB';
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

        subscription: {
            type: String,
            enum: ['tier-1', 'tier-2', 'tier-3'],
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
    },
    { timestamps: true }
);
export const UserModel = UserConnection.model<User_Type>('User', UserSchema);
