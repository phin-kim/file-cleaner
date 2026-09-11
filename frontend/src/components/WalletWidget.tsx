import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUp,
    //Gift,
    X,
    //CreditCard,
    //ChevronRight,
    Loader2,
} from 'lucide-react';
import { welcomePageApi } from '../library/client';
import { useWalletStore } from '../Store/walletStore';
import useErrorStore from '../Store/ErrorStore';
import handleApiError from '../utils/apiError';
import { useWalletBalanceTopUp } from '../hooks/walletSynch';
const WalletWidget = () => {
    const { balance, currency, setBalanceFromServer } = useWalletStore();
    const setError = useErrorStore((state) => state.setError);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [mpesaPhone, setMpesaPhone] = useState('');
    const [inlineError, setInlineError] = useState<string | null>(null);

    const mpesaDigitsOk = mpesaPhone.replace(/\D/g, '').length >= 10;
    const {
        mutateAsync: topUp,

        isPending: topUpLoading,
    } = useWalletBalanceTopUp();
    const { data, isLoading, error, isError } = useQuery({
        queryKey: ['wallet-balance'],
        queryFn: async () => {
            const response = await welcomePageApi.get<{
                walletBalance?: number;
            }>('/fetch-profile');
            if (typeof response.data.walletBalance !== 'number') {
                throw new Error('Invalid wallet balance response');
            }

            return response.data.walletBalance;
        },
        refetchInterval: 1000 * 60 * 30, // Automatically refetches every 30 minutes
        staleTime: 1000 * 60 * 5,
    });
    useEffect(() => {
        if (data !== undefined) {
            setBalanceFromServer(data);
        }
    }, [data, setBalanceFromServer]);

    const handleTopUp = async () => {
        setInlineError(null);
        const val = parseFloat(amount);
        if (!Number.isFinite(val) || val <= 0) {
            setInlineError('Enter a valid amount.');
            return;
        }
        if (!mpesaDigitsOk) {
            setInlineError('Enter a valid M-Pesa phone number.');
            return;
        }

        await topUp(
            { mpesaPhone, val },
            {
                onSuccess: (walletBalance) => {
                    setBalanceFromServer(walletBalance);
                    setIsModalOpen(false);
                },
                onError: (error: Error) => {
                    setInlineError(error.message);
                },
            }
        );
    };
    useEffect(() => {
        if (isError && error) {
            handleApiError(error, setError);
        }
    }, [isError, error, setError]);

    if (isLoading) return <div>Loading balance...</div>;

    return (
        <div className="w-full max-w-2xl rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-8 space-y-1">
                <p className="ml-1 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                    Available Balance
                </p>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-slate-400 uppercase">
                        {currency}
                    </span>
                    <span className="text-5xl font-black tracking-tight text-slate-900">
                        {balance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </span>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => {
                        setInlineError(null);
                        setIsModalOpen(true);
                    }}
                    className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-purple-600 font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:bg-purple-700 active:scale-[0.98]"
                >
                    Top up <ArrowUp size={18} />
                </button>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-sm rounded-[2.5rem] bg-white p-8 shadow-2xl"
                        >
                            <button
                                type="button"
                                disabled={topUpLoading}
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 disabled:opacity-40"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-slate-900">
                                    Add funds
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    PayHero STK push — balance updates when
                                    payment succeeds
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="mb-2 ml-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                        Amount ({currency})
                                    </label>
                                    <input
                                        type="number"
                                        disabled={topUpLoading}
                                        value={amount}
                                        onChange={(e) =>
                                            setAmount(e.target.value)
                                        }
                                        className="w-full rounded-2xl border-none bg-slate-50 px-6 py-4 text-3xl font-bold text-slate-900 ring-2 ring-transparent transition-all outline-none placeholder:text-slate-300 focus:ring-purple-600 disabled:opacity-60"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 ml-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                        M-Pesa phone
                                    </label>
                                    <input
                                        type="tel"
                                        disabled={topUpLoading}
                                        value={mpesaPhone}
                                        onChange={(e) =>
                                            setMpesaPhone(e.target.value)
                                        }
                                        placeholder="07XXXXXXXX"
                                        className="w-full rounded-2xl border-none bg-slate-50 px-6 py-4 text-lg font-semibold text-slate-900 ring-2 ring-transparent transition-all outline-none placeholder:text-slate-300 focus:ring-purple-600 disabled:opacity-60"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <p className="ml-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                        Quick select
                                    </p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['10', '50', '100'].map((val) => (
                                            <button
                                                key={val}
                                                type="button"
                                                disabled={topUpLoading}
                                                onClick={() => setAmount(val)}
                                                className={`rounded-xl border py-3 text-sm font-bold transition-all disabled:opacity-50 ${
                                                    amount === val
                                                        ? 'border-purple-600 bg-purple-600 text-white shadow-md'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:border-purple-600'
                                                }`}
                                            >
                                                +{val}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/*<div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white">
                                        <CreditCard
                                            size={18}
                                            className="text-purple-600"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs leading-none font-bold tracking-wider text-slate-900 uppercase">
                                            M-Pesa
                                        </p>
                                        <p className="mt-1 text-[10px] text-slate-500">
                                            STK push to your phone
                                        </p>
                                    </div>
                                    <ChevronRight
                                        size={16}
                                        className="text-slate-300"
                                    />
                                </div>*/}

                                <p className="text-xs leading-relaxed text-slate-500">
                                    After you tap{' '}
                                    <strong>Confirm top up</strong>, an M-Pesa
                                    prompt appears on your phone — enter your{' '}
                                    <strong>
                                        M-Pesa PIN on the phone keypad
                                    </strong>{' '}
                                    (Safaricom never asks for your PIN inside
                                    this website). When payment succeeds, your
                                    wallet balance matches the server and you
                                    can use Pay &amp; Process from wallet when
                                    you have enough balance.
                                </p>

                                {inlineError && (
                                    <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {inlineError}
                                    </p>
                                )}

                                <button
                                    type="button"
                                    disabled={
                                        topUpLoading ||
                                        !mpesaDigitsOk ||
                                        !Number.isFinite(parseFloat(amount)) ||
                                        parseFloat(amount) <= 0
                                    }
                                    onClick={handleTopUp}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-4 font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:bg-purple-700 enabled:active:scale-[0.98] disabled:opacity-50"
                                >
                                    {topUpLoading && (
                                        <Loader2
                                            className="animate-spin"
                                            size={20}
                                        />
                                    )}
                                    {topUpLoading
                                        ? 'Waiting for M-Pesa…'
                                        : 'Confirm top up'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WalletWidget;
