import { motion } from 'framer-motion';
import { History, ArrowUpRight, ArrowDownLeft, RefreshCcw } from 'lucide-react';
import { useWalletStore } from '../Store/walletStore';

const HistoryPage = () => {
    const { transactions } = useWalletStore();

    return (
        <div className="mx-auto max-w-5xl px-6 py-12">
            <header className="mb-12">
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

            <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-8">
                    <h2 className="text-xl font-bold text-slate-900">
                        Recent Transactions
                    </h2>
                    <div className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                        {transactions.length} total events
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {transactions.length === 0 ? (
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
                        transactions.map((tx, idx) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
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
                                        {new Date(tx.date).toLocaleDateString(
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
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;
