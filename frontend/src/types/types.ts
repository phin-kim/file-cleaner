import type { ReactNode } from 'react';

export type Status = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
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
