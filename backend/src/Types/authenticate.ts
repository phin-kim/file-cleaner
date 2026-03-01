import type { Request } from 'express';
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
export type AuthenticatedRequest = Request & { user?: JWTUserPayload };
