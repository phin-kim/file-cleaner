import { create } from 'zustand';
import type { CleaningStats } from '../types/types';
interface GeneralStore {
    cleaningStats: CleaningStats | null;
    setCleaningStats: (stats: CleaningStats) => void;
    resetStats: () => void;
}

export const useGeneralStore = create<GeneralStore>((set) => ({
    cleaningStats: null,
    setCleaningStats: (stats) => set({ cleaningStats: stats }),
    resetStats: () => set({ cleaningStats: null }),
}));
