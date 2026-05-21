import { Schema } from 'mongoose';
import { TidyUpConnection } from '../config/DB.js';
interface DeletedAccount {
    email: string;
    deletedAt: Date;
}
const DeletedAccountSchema = new Schema<DeletedAccount>({
    email: { type: String, required: true, unique: true },
    deletedAt: { type: Date, default: Date.now },
});
export const DeletedAccountModel = TidyUpConnection.model<DeletedAccount>(
    'DeletedAccount',
    DeletedAccountSchema
);
