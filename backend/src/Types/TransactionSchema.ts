import type { Document } from 'mongoose';

export interface Transaction_Type extends Document {
    userId: string;
    reference: string;
    amount: number;
    email: string;
    phoneNumberHash: string;
    tierId: string;
    tierName: string;
    metadata: Metadata;
    status: 'pending' | 'success' | 'failed' | 'processing';
    paystackReference: string;
    createdAt: Date;
    project: string;
    provider: string;
    updatedAt?: Date;
}
export interface Metadata {
    period: 'monthly' | '3 months';
    paymentMethod: string;
    //optional fields
    tierId?: string;
    tierName: string;
}
