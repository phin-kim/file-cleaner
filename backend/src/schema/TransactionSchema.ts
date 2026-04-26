import { Schema } from 'mongoose';
import { TidyUpConnection } from '../config/DB.js';
import type { Document } from 'mongoose';

export type PaymentKind =
    | 'subscription'
    | 'folder_clean'
    | 'file_merger'
    | 'billing'
    | 'wallet_topup';

export interface Transaction_Type extends Document {
    userId: string;
    reference: string;
    amount: number;
    email: string;
    phoneNumberHash?: string;
    tierId?: string;
    tierName?: string;
    metadata?: Metadata;
    status: 'pending' | 'success' | 'failed' | 'processing';
    mpesaReceipt?: string;
    createdAt: Date;
    project: string;
    provider: string;
    updatedAt?: Date;
    paymentKind?: PaymentKind;
    folderCleanFileCount?: number;
    mergerPageCount?: number;
    payheroInternalRef?: string;
}
export interface Metadata {
    period: 'monthly' | '3 months';
    paymentMethod: string;
    //optional fields
    tierId?: string;
    tierName: string;
}

const MetadataSchema = new Schema<Metadata>(
    {
        period: {
            type: String,
            required: true,
            enum: ['monthly', '3 months'],
        },
        paymentMethod: {
            type: String,
            required: true,
        },
        tierName: {
            type: String,
            required: true,
        },
        tierId: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);
const TransactionsSchema = new Schema<Transaction_Type>(
    {
        userId: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,

            trim: true,
            lowercase: true,
            index: true,
        },
        phoneNumberHash: {
            type: String,
            //required: true,
        },
        metadata: { type: MetadataSchema },
        amount: {
            type: Number,
            required: true,
        },
        reference: {
            type: String,
            unique: true,
            required: true,
            sparse: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'success', 'failed', 'processing'],
            default: 'pending',
        },
        mpesaReceipt: {
            type: String,
            sparse: true, // Allows null/undefined but maintains uniqueness for those that exist
        },
        provider: String,
        project: String,
        paymentKind: {
            type: String,
            enum: [
                'subscription',
                'folder_clean',
                'file_merger',
                'billing',
                'wallet_topup',
            ],
        },
        folderCleanFileCount: { type: Number },
        mergerPageCount: { type: Number },
        payheroInternalRef: { type: String, sparse: true },
        createdAt: {
            type: Date,
            default: Date.now,
            required: true,
        },
    },
    { timestamps: true }
);
export const TransactionsModel = TidyUpConnection.model<Transaction_Type>(
    'Transaction',
    TransactionsSchema
);
