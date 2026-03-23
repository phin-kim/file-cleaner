import { create } from 'zustand';
interface Tiers {
    tierId: string;
    setTierId: (tierId: string) => void;
}
export const useTierStore = create<Tiers>((set) => ({
    tierId: 'free',
    setTierId: (value) => set({ tierId: value }),
}));
