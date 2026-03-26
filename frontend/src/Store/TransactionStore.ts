import { create } from 'zustand';
import type { Tier } from '../types/transactions';
interface Transactions {
    amount: number;
    tier: Tier | null;
    selectedPeriod: string;
    setSelectedPeriod: (value: string) => void;
    setTier: (tier: Tier) => void;
    setAmount: (amt: number) => void;
}
export const useTransactions = create<Transactions>((set) => ({
    amount: 0,
    tier: null,
    selectedPeriod: '',
    setSelectedPeriod: (value) => set({ selectedPeriod: value }),
    setAmount: (value) => set({ amount: value }),
    setTier: (tier: Tier) => set({ tier }),
}));
