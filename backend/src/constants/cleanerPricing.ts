/** KES per file for folder clean — must match frontend `cleanerPricing.ts`. */
export const CLEANER_COST_PER_FILE_KES = 1.5;

export function cleanerChargeAmountKes(fileCount: number): number {
    return Math.round(fileCount * CLEANER_COST_PER_FILE_KES * 100) / 100;
}
