/** Max files per tier for folder cleaner — aligned with frontend `library/tier.ts`. */
export const TIER_MAX_FOLDER_FILES: Record<string, number> = {
    free: 70,
    'tier-1': 700,
    'tier-2': 200,
    'tier-3': 2000,
};

export function maxFolderFilesForTier(tierId: string): number {
    return TIER_MAX_FOLDER_FILES[tierId] ?? TIER_MAX_FOLDER_FILES.free;
}
