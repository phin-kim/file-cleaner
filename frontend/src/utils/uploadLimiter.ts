import type { UploadLimitResult } from '../types/types';

const UPLOAD_LIMIT = 4; //3
const FILE_NO_THRESHOLD = 200; //100
const now = new Date();
const today = now.toDateString();
const stored = localStorage.getItem('upload-stats');
export const uploadLimiter = (fileCount: number): UploadLimitResult => {
    let uploadStats: { count: number; lastDate: string } = stored
        ? JSON.parse(stored)
        : { count: 0, lastDate: today };
    if (fileCount <= FILE_NO_THRESHOLD)
        return { allowed: true, stats: uploadStats };

    //if stored date isn't today, reset
    if (uploadStats.lastDate !== today) {
        uploadStats = { count: 0, lastDate: today };
    }
    //check if limit is reached
    if (uploadStats.count >= UPLOAD_LIMIT) {
        return {
            allowed: false,
            message:
                'Daily limit reached for multiple uploads. Resets at midnight.',
        };
    }
    return { allowed: true, stats: uploadStats };
};
