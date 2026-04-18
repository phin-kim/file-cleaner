/** KES per file for folder clean — must match frontend `cleanerPricing.ts`. */
export const CLEANER_COST_PER_FILE_KES = 5;

export function cleanerChargeAmountKes(fileCount: number): number {
    return fileCount * CLEANER_COST_PER_FILE_KES;
}
