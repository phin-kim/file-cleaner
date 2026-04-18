/** KES charged per file for folder cleaning (must match Cleaner UI). */
export const CLEANER_COST_PER_FILE_KES = 1.5;

export function cleanerChargeAmountKes(fileCount: number): number {
    return Math.round(fileCount * CLEANER_COST_PER_FILE_KES * 100) / 100;
}
