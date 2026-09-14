import { Schema } from 'mongoose';
import { TidyUpConnection } from '../config/DB.js';
import type { Document } from 'mongoose';
/**
 * Imagine a big notebook where everyone in the world has to write down their favorite secret password.

unique: true means every single password has to be completely different—no two people are allowed to pick the exact same one, or the teacher gets mad.

required: true means you must write something down. You aren't allowed to leave the line blank.

sparse: true is like a special rule that says, "Hey, it's totally okay if a few people leave this line completely blank." Normally, if the computer sees a blank line, it gets confused and thinks nobody else is allowed to leave a line blank either. sparse tells it to calm down and ignore the blank ones.
 */
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
    idempotencyKey?: string;
    phoneNumberHash?: string;

    webhookReceived: boolean;
    status: 'QUEUED' | 'PROCESSING' | 'FAILED' | 'SUCCESS';
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

export const MetadataSchema = new Schema<Metadata>(
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
        amount: {
            type: Number,
            required: true,
        },
        reference: {
            type: String,
            unique: true,
            required: true,
            //sparse: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['QUEUED', 'SUCCESS', 'FAILED', 'PROCESSING'],
            default: 'QUEUED',
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
