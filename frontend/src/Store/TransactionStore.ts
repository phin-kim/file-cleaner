import { create } from 'zustand';
import type { Tier } from '../types/transactions';
interface Transactions {
    amount: number;
    tier: Tier | null;
    selectedPeriod: string;
    fileCount: number;
    //setFileCount:(count:number)=>void
    setSelectedPeriod: (value: string) => void;
    setTier: (tier: Tier) => void;
    fileNoCheck: (count: number) => void;
    setAmount: (amt: number) => void;
}
export const useTransactions = create<Transactions>((set) => ({
    amount: 0,
    tier: null,
    selectedPeriod: '',
    fileCount: 0,
    //setFileCount:(state)=>set({fileCount:state}),
    setSelectedPeriod: (value) => set({ selectedPeriod: value }),
    setAmount: (value) => set({ amount: value }),
    setTier: (tier: Tier) => set({ tier }),
    fileNoCheck: (count) => {
        set({ fileCount: count });
    },
}));
