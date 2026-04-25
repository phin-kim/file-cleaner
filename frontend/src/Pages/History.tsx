import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    History,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCcw,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useWalletStore } from '../Store/walletStore';
import { welcomePageApi } from '../library/client';

const HistoryPage = () => {
    const { transactions, setBalanceFromServer, setTransactionsFromServer } =
        useWalletStore();
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // --- Pagination Logic ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; // Adjust this number as needed

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                setLoadError(null);
                const { data } = await welcomePageApi.get<{
                    walletBalance: number;
                    history: Array<{
                        id: string;
                        amount: number;
                        type: 'top-up' | 'refund' | 'payment';
                        date: string;
                        reference?: string | null;
                        mpesaReference?: string | null;
                        source?: 'wallet-topup' | 'in-app-payment' | 'local';
                    }>;
                }>('/wallet-history');
                if (!mounted) return;
                setBalanceFromServer(Number(data.walletBalance ?? 0));
                setTransactionsFromServer(
                    Array.isArray(data.history) ? data.history : []
                );
            } catch (err) {
                if (!mounted) return;
                setLoadError(
                    'Could not load full wallet history right now. Showing local activity only.'
                );
            } finally {
                if (mounted) setLoading(false);
            }
        };
        void load();
        return () => {
            mounted = false;
        };
    }, [setBalanceFromServer, setTransactionsFromServer]);

    // Calculate pagination values
    const totalPages = Math.max(
        1,
        Math.ceil(transactions.length / itemsPerPage)
    );

    // Get current slice of transactions
    const currentTransactions = useMemo(() => {
        const lastIndex = currentPage * itemsPerPage;
        const firstIndex = lastIndex - itemsPerPage;
        return transactions.slice(firstIndex, lastIndex);
    }, [transactions, currentPage]);

    // Pagination handlers
    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
    };

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage((prev) => prev - 1);
    };

    return (
        <div className="mx-auto flex h-full min-h-0 max-w-5xl flex-col px-6 py-6">
            <header className="mb-6 shrink-0">
                <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-500/20">
                        <History size={20} />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">
                        Activity History
                    </h1>
                </div>
                <p className="text-lg text-slate-500">
                    A transparent record of all your wallet transactions.
                </p>
            </header>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-8">
                    <h2 className="text-xl font-bold text-slate-900">
                        All Transactions
                    </h2>
                    <div className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                        {transactions.length} total events
                    </div>
                </div>

                {loadError && (
                    <div className="border-b border-slate-100 bg-amber-50 px-8 py-3 text-sm text-amber-700">
                        {loadError}
                    </div>
                )}

                <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                            <RefreshCcw
                                size={36}
                                className="mb-3 animate-spin"
                            />
                            <p className="text-sm font-semibold">
                                Loading transaction history...
                            </p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center opacity-30">
                            <RefreshCcw size={48} className="mb-4" />
                            <p className="text-xl font-bold">
                                No transactions recorded
                            </p>
                            <p className="text-sm">
                                Start using services to see your history here.
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentPage}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                {currentTransactions.map((tx, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        key={tx.id}
                                        className="group flex items-center gap-6 p-6 transition-colors hover:bg-slate-50"
                                    >
                                        <div
                                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                                                tx.type === 'top-up'
                                                    ? 'bg-green-100 text-green-600'
                                                    : tx.type === 'refund'
                                                      ? 'bg-purple-100 text-purple-600'
                                                      : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {tx.type === 'top-up' ? (
                                                <ArrowUpRight size={24} />
                                            ) : tx.type === 'refund' ? (
                                                <RefreshCcw
                                                    size={22}
                                                    className="animate-spin-slow"
                                                />
                                            ) : (
                                                <ArrowDownLeft size={24} />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-center gap-2">
                                                <span className="text-lg font-bold text-slate-900 capitalize">
                                                    {tx.type === 'top-up'
                                                        ? 'Wallet Top-up'
                                                        : tx.type === 'refund'
                                                          ? 'Automated Refund'
                                                          : 'Service Payment'}
                                                </span>
                                                {tx.type === 'refund' && (
                                                    <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-black tracking-tighter text-white uppercase">
                                                        Failure Recovery
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm font-medium text-slate-400">
                                                {new Date(
                                                    tx.date
                                                ).toLocaleDateString(
                                                    undefined,
                                                    {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    }
                                                )}
                                            </div>
                                            {(tx.reference ||
                                                tx.mpesaReference) && (
                                                <div className="mt-2 space-y-1 text-xs text-slate-500">
                                                    {tx.source && (
                                                        <p>
                                                            Channel:{' '}
                                                            <span className="font-semibold text-slate-700">
                                                                {tx.source ===
                                                                'wallet-topup'
                                                                    ? 'Wallet Top-up'
                                                                    : tx.source ===
                                                                        'in-app-payment'
                                                                      ? 'In-app Service'
                                                                      : 'Local'}
                                                            </span>
                                                        </p>
                                                    )}
                                                    {tx.reference && (
                                                        <p>
                                                            Ref:{' '}
                                                            <span className="font-semibold text-slate-700">
                                                                {tx.reference}
                                                            </span>
                                                        </p>
                                                    )}
                                                    {tx.mpesaReference && (
                                                        <p>
                                                            M-Pesa:{' '}
                                                            <span className="font-semibold text-slate-700">
                                                                {
                                                                    tx.mpesaReference
                                                                }
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            className={`text-right ${tx.amount > 0 ? 'text-green-600' : 'text-slate-900'}`}
                                        >
                                            <p className="text-2xl font-black tracking-tight">
                                                {tx.amount > 0 ? '+' : ''}
                                                {tx.amount.toFixed(2)}
                                            </p>
                                            <p className="text-[10px] leading-none font-bold tracking-[0.2em] text-slate-400">
                                                KES
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                {/* --- Pagination Controls --- */}
                {!loading && transactions.length > 0 && (
                    <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-8 py-5">
                        <div className="text-sm font-semibold text-slate-500">
                            Showing page{' '}
                            <span className="text-slate-900">
                                {currentPage}
                            </span>{' '}
                            of{' '}
                            <span className="text-slate-900">{totalPages}</span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handlePrev}
                                disabled={currentPage === 1}
                                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
                            >
                                <ChevronLeft size={18} />
                                Previous
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
                            >
                                Next
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </footer>
                )}
            </div>
        </div>
    );
};

export default HistoryPage;
