/*import type { Request } from 'express';
import { Document } from 'mongoose';
import type { User_Type } from '../schema/UsersSchema';
export type JWTUserPayload = {
    uid: string;
    email: string;
    subscriptionStatus: Subscription;
    role: Role;
    displayName: string;
};
export type Subscription = {
    enum: ['tier-1', 'tier-2', 'tier-3'];
};
export type Role = {
    USER: 'user';
    ADMIN: 'admin';
};
export type JWTTokenPayload = {
    uid: string;
};
// This represents the full user document from MongoDB
export type UserDocument = Document<unknown, {}, User_Type> & User_Type;

export interface AuthenticatedRequest extends Request {
    // Allow the user to be the initial JWT payload OR the full DB document
    user?: JWTUserPayload | UserDocument;
    isHeavyUpload?: boolean;
}*/

/*import type { Request } from 'express';
import { Document } from 'mongoose';
import type { User_Type } from '../schema/UsersSchema';

// 1. Use String Literal Unions for cleaner logic
export type Subscription = 'tier-1' | 'tier-2' | 'tier-3';
export type Role = 'user' | 'admin';

export type JWTUserPayload = {
    uid: string;
    email: string;
    subscriptionStatus: Subscription;
    role: Role;
    displayName: string;
};

// 2. Full User Document from Mongoose
export type UserDocument = Document<unknown, {}, User_Type> & User_Type;

// 3. The Request Interface
export interface AuthenticatedRequest extends Request {
    // We keep the union, but we will handle the "extraction" in a type-safe way
    user?: JWTUserPayload | UserDocument;
    isHeavyUpload?: boolean;
}*/
import type { Request } from 'express';

export interface BetterAuthUser {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
    [key: string]: unknown;
    dailyUsageCount?: number;
    lastUsageDate?: Date | null;
    role?: string;
    walletBalance?: number;
    profileImageUrl?: string;
    profileImagePublicId?: string;
}
export interface BetterAuthSession {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
}
export type AuthenticatedRequest = Request & {
    user?: BetterAuthUser;
    session?: BetterAuthSession;
    isHeavyUpload?: boolean;
};
