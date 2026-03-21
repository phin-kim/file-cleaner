import { Schema } from 'mongoose';
import type { Transaction_Type, Metadata } from '../Types/TransactionSchema';
import { TidyUpConnection } from '../config/DB';
const MetadataSchema = new Schema<Metadata>(
    {
        period: {
            type: String,
            required: true,
            enum: ['monthly', 'quarterly'],
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
            required: true,
        },
        metadata: { type: MetadataSchema, required: true },
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
        paystackReference: {
            type: String,
            sparse: true, // Allows null/undefined but maintains uniqueness for those that exist
        },
        provider: String,
        project: String,
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
