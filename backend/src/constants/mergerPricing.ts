/** KES charged per page for file merger. */
export const MERGER_COST_PER_PAGE_KES = 2.5;

export function mergerChargeAmountKes(pageCount: number): number {
    return Math.round(pageCount * MERGER_COST_PER_PAGE_KES * 100) / 100;
}
