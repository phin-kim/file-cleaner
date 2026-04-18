import { motion } from 'framer-motion';
import {
    History,
    ArrowDownLeft,
    ArrowUpRight,
    ShieldCheck,
    RefreshCcw,
} from 'lucide-react';
import { useWalletStore } from '../Store/walletStore';
import WalletWidget from '../components/WalletWidget';

const Dashboard = () => {
    const { transactions } = useWalletStore();

    return (
        <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="flex flex-col gap-12 md:flex-row">
                <div className="flex-1 space-y-8">
                    <header>
                        <h1 className="mb-2 text-4xl font-black tracking-tight text-slate-900">
                            My Wallet
                        </h1>
                        <p className="text-slate-500">
                            Manage your credits and transaction history.
                        </p>
                    </header>

                    <WalletWidget />

                    <div className="relative overflow-hidden rounded-[2.5rem] bg-purple-600 p-8 text-white shadow-xl shadow-purple-500/20">
                        <div className="relative z-10 flex h-full flex-col justify-between">
                            <div>
                                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                                    <ShieldCheck size={24} />
                                </div>
                                <h3 className="mb-2 text-2xl font-bold">
                                    Protection Guarantee
                                </h3>
                                <p className="text-sm leading-relaxed text-purple-100 opacity-80">
                                    If a paid job cannot complete (for example a
                                    limit was reached after payment), the charge
                                    is returned to your wallet so you can try
                                    again or use it on your next clean.
                                </p>
                            </div>
                        </div>

                        <div className="absolute top-[-10%] right-[-10%] h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                        <div className="absolute bottom-[-10%] left-[-10%] h-48 w-48 rounded-full bg-purple-900/20 blur-3xl" />
                    </div>
                </div>

                <div className="flex flex-col md:w-[400px]">
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <History size={20} className="text-purple-600" />
                            <h2 className="text-xl font-bold text-slate-900">
                                Recent Activity
                            </h2>
                        </div>
                        <button
                            type="button"
                            className="text-xs font-bold tracking-widest text-purple-600 uppercase hover:text-purple-700"
                        >
                            View all
                        </button>
                    </div>

                    <div className="flex-1 space-y-4">
                        {transactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                <RefreshCcw
                                    size={40}
                                    className="animate-spin-slow mb-4"
                                />
                                <p className="font-medium">No activity yet</p>
                            </div>
                        ) : (
                            transactions.map((tx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={tx.id}
                                    className="group flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-5 transition-all hover:shadow-md"
                                >
                                    <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                                            tx.type === 'top-up'
                                                ? 'bg-green-50 text-green-600'
                                                : tx.type === 'refund'
                                                  ? 'bg-purple-50 text-purple-600'
                                                  : 'bg-slate-50 text-slate-500'
                                        }`}
                                    >
                                        {tx.type === 'top-up' ? (
                                            <ArrowUpRight size={20} />
                                        ) : (
                                            <ArrowDownLeft size={20} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-900">
                                            {tx.type === 'top-up'
                                                ? 'Wallet Top-up'
                                                : tx.type === 'refund'
                                                  ? 'Payment Refund'
                                                  : 'Payment'}
                                        </p>
                                        <p className="mt-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                            {new Date(
                                                tx.date
                                            ).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                    <div
                                        className={`text-right ${tx.amount > 0 ? 'text-green-600' : 'text-slate-900'}`}
                                    >
                                        <p className="font-black">
                                            {tx.amount > 0 ? '+' : ''}
                                            {tx.amount.toFixed(2)}
                                        </p>
                                        <p className="text-[10px] leading-none font-bold tracking-widest text-slate-400">
                                            KES
                                        </p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
