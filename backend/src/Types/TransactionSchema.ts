import type { Document } from 'mongoose';

export interface Transaction_Type extends Document {
    reference: string;
    amount: number;
    email: string;
    phoneNumberHash: string;
    metadata: Metadata;
    status: 'pending' | 'success' | 'failed' | 'processing';
    paystackReference: string;
    createdAt: Date;
    updatedAt?: Date;
}
export interface Metadata {
    period: 'monthly' | 'quarterly';
    paymentMethod: string;
    //optional fields
    tieId?: string;
    tierName: string;
}
