import { motion } from 'framer-motion';
import { Wallet, ShieldCheck } from 'lucide-react';
import WalletWidget from '../components/WalletWidget';

const WalletPage = () => {
    return (
        <div className="mx-auto max-w-7xl px-6 py-12">
            <header className="mb-12">
                <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-500/20">
                        <Wallet size={20} />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">
                        Available Balance
                    </h1>
                </div>
                <p className="text-lg text-slate-500">
                    Manage your secure wallet and top up funds.
                </p>
            </header>

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <WalletWidget />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative overflow-hidden rounded-[2.5rem] bg-purple-600 p-10 text-white shadow-xl shadow-purple-500/30"
                >
                    <div className="relative z-10">
                        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="mb-4 text-3xl font-bold">
                            Zero-Risk Processing
                        </h3>
                        <p className="mb-6 text-lg leading-relaxed text-purple-100 opacity-90">
                            Your security is our priority. We charge only for
                            successful results. If any automated process fails,
                            your credits are instantly returned to this wallet.
                        </p>
                        <div className="flex gap-4">
                            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold tracking-widest uppercase">
                                Encrypted
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold tracking-widest uppercase">
                                Instant Refund
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-[-10%] right-[-10%] h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute bottom-[-10%] left-[-10%] h-80 w-80 rounded-full bg-purple-900/20 blur-[100px]" />
                </motion.div>
            </div>
        </div>
    );
};

export default WalletPage;
