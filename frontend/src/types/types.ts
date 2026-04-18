import type { ReactNode } from 'react';

export type Status =
    | 'idle'
    | 'awaiting_payment'
    | 'uploading'
    | 'processing'
    | 'complete'
    | 'error';
export type UploadedFolder = {
    name: string;
    files: File[];
};
export interface ExtensionStats {
    [category: string]: {
        count: number;
        sizeByBytes: number;
    };
}
export type CleaningStats = {
    originalFiles: number;
    duplicatesRemoved: number;
    finalFiles: number;
    spaceSaved: string;
    breakdown: ExtensionStats;
};
export interface PaymentMethod {
    id: string;
    name: string;
    icon: ReactNode;
}

export interface AnalysisResult {
    filesProcessed: number;
    pdfUrl: string;
}
export interface BackendError {
    expired?: boolean;
    message: string;
    status: number;
    type: string;
}
export type UnknownApiError = {
    status?: number;
    data?: BackendError;
    type?: string;
    response?: { status: number; data: BackendError };
};
export type UploadLimitResult =
    | { allowed: true; stats?: { count: number; lastDate: string } }
    | { allowed: false; message: string };
