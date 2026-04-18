import { create } from 'zustand';

interface Transaction {
    id: string;
    amount: number;
    type: 'top-up' | 'refund' | 'payment';
    date: string;
}

interface WalletState {
    balance: number;
    currency: string;
    transactions: Transaction[];
    addFunds: (amount: number) => void;
    /** Replace balance from server after M-Pesa / wallet sync. */
    setBalanceFromServer: (balance: number) => void;
    processPaymentFailure: (amount: number) => void;
    spendFunds: (amount: number) => boolean;
    hasSufficientFunds: (amount: number) => boolean;
}

export const useWalletStore = create<WalletState>((set, get) => ({
    balance: 0,
    currency: 'KES',
    transactions: [
        {
            id: '1',
            amount: 0,
            type: 'top-up',
            date: new Date().toISOString(),
        },
    ],
    hasSufficientFunds: (amount) => get().balance >= amount,
    setBalanceFromServer: (balance) =>
        set(() => ({
            balance,
        })),
    addFunds: (amount) =>
        set((state) => ({
            balance: state.balance + amount,
            transactions: [
                {
                    id: Math.random().toString(36).substring(7),
                    amount,
                    type: 'top-up',
                    date: new Date().toISOString(),
                },
                ...state.transactions,
            ],
        })),
    processPaymentFailure: (amount) =>
        set((state) => ({
            balance: state.balance + amount,
            transactions: [
                {
                    id: Math.random().toString(36).substring(7),
                    amount,
                    type: 'refund',
                    date: new Date().toISOString(),
                },
                ...state.transactions,
            ],
        })),
    spendFunds: (amount) => {
        const { balance } = get();
        if (balance >= amount) {
            set((state) => ({
                balance: state.balance - amount,
                transactions: [
                    {
                        id: Math.random().toString(36).substring(7),
                        amount: -amount,
                        type: 'payment',
                        date: new Date().toISOString(),
                    },
                    ...state.transactions,
                ],
            }));
            return true;
        }
        return false;
    },
}));
