import type { Request } from 'express';
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
}
