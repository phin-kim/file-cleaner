import type { ReactNode } from 'react';

export type Status = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
export type UploadedFolder = {
    name: string;
    files: File[];
};
export type CleaningStats = {
    originalFiles: number;
    duplicatesRemoved: number;
    finalFiles: number;
    spaceSaved: string;
};
export interface PaymentMethod {
    id: string;
    name: string;
    icon: ReactNode;
}
