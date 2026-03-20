/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    CheckCircle,
    Lock,
    CreditCard,
    Shield,
    Zap,
    ArrowLeft,
    Info,
} from 'lucide-react';
import { FaPaypal, FaCreditCard, FaCheck } from 'react-icons/fa6';
import { MdPhoneAndroid } from 'react-icons/md';
import { useTransactions } from '../Store/TransactionStore';
import { useNavigate } from 'react-router-dom';
import type { PaymentMethod } from '../types/transactions';
import useErrorStore from '../Store/ErrorStore';
import { paystackApi } from '../library/client';
import handleApiError from '../utils/apiError';
import createClientLogger from '../utils/clientLogger';
import useSuccessStore from '../Store/SuccessStore';
const log = createClientLogger('Billing.tsx');

export default function Billing() {
    const [selectedPayment, setSelectedPayment] = useState<string>('mpesa');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const amount = useTransactions((state) => state.amount);
    const selectedPeriod = useTransactions((state) => state.selectedPeriod);
    const selectedTier = useTransactions((state) => state.tier);
    const setError = useErrorStore((state) => state.setError);
    const setSuccess = useSuccessStore((state) => state.setSuccess);
    const navigate = useNavigate();

    // Redirect if no tier is selected
    useEffect(() => {
        if (!selectedTier) {
            navigate('/');
        }
    }, [selectedTier, navigate]);

    const paymentMethods: PaymentMethod[] = [
        {
            id: 'mpesa',
            name: 'M-Pesa',
            icon: (
                <span className="text-purple-600">
                    <MdPhoneAndroid />
                </span>
            ),
        },
        {
            id: 'card',
            name: 'Credit/Debit Card',
            icon: (
                <span className="text-purple-600">
                    <FaCreditCard />
                </span>
            ),
        },
        {
            id: 'paypal',
            name: 'PayPal',
            icon: (
                <span className="text-purple-600">
                    <FaPaypal />
                </span>
            ),
        },
    ];
    const formatPhoneNumber = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        //if it starts with 0 replace with 254
        if (cleaned.startsWith('0')) {
            return '+254' + cleaned;
        }
        //if its 9 digits starting with 7add 254
        if (cleaned.length === 9 && cleaned.startsWith('7')) {
            return '+254' + cleaned;
        }
        if (cleaned.startsWith('254')) {
            return '+' + cleaned;
        }
    };
    if (!selectedTier) {
        setError('Please select a plan first');
        return;
    }

    const handlePayment = async () => {
        if (selectedPayment === 'mpesa' && !phoneNumber) {
            setError('Please enter your M-Pesa phone number');
            return;
        }
        if (selectedPayment === 'mpesa' && !email) {
            setError('Please enter the email you logged in with');
            return;
        }
        setIsProcessing(true);
        setError('');
        const isTestMode = import.meta.env.MODE === 'development';
        const phoneToSend = isTestMode
            ? '+254710000000'
            : formatPhoneNumber(phoneNumber);

        try {
            const paystackResponse = await paystackApi.post(
                '/payment/initialize-payment',
                {
                    amount,
                    phoneNumber: phoneToSend,
                    currency: 'KES',
                    email,
                    metadata: {
                        period: selectedPeriod,
                        tierId: selectedTier.id,
                        tierName: selectedTier.name,
                        paymentMethod: 'mpesa',
                    },
                }
            );
            const paystackData = paystackResponse.data;
            if (paystackData.status) {
                setSuccess(paystackData.message);
            }
            log.info('Response from the paystack api', {
                data: paystackData,
            });
        } catch (error) {
            handleApiError(error, setError);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-purple-600 to-violet-800 p-4 md:p-8">
            <div className="mx-auto max-w-6xl">
                {/* Navigation */}
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/pricing')}
                    className="group mb-8 flex items-center gap-2 text-purple-200 transition-colors hover:text-white"
                >
                    <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                    <span className="font-medium">Back to Plans</span>
                </motion.button>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                            type: 'spring',
                            stiffness: 200,
                            delay: 0.2,
                        }}
                        className="mb-4 inline-block"
                    >
                        <div className="rounded-2xl bg-linear-to-r from-purple-500 to-fuchsia-500 p-4 shadow-lg shadow-purple-500/20">
                            <Sparkles className="h-12 w-12 text-white" />
                        </div>
                    </motion.div>
                    <h1 className="mb-3 text-4xl font-bold text-white md:text-5xl">
                        Complete Your{' '}
                        <span className="bg-linear-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                            Upgrade
                        </span>
                    </h1>
                    <p className="text-lg text-purple-200/80">
                        You're just one step away from unlocking{' '}
                        {selectedTier.name}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    {/* Summary Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-6 lg:col-span-7"
                    >
                        {/* Selected Plan Card */}
                        <div className="rounded-3xl border border-purple-400/20 bg-white/5 p-8 backdrop-blur-xl">
                            <div className="mb-8 flex items-start justify-between">
                                <div>
                                    <div className="mb-2 flex items-center gap-3">
                                        <div className="rounded-lg bg-purple-500/20 p-2 text-purple-400">
                                            {selectedTier.icon}
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">
                                            {selectedTier.name}
                                        </h2>
                                    </div>
                                    <p className="text-purple-200/60">
                                        {selectedTier.description}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-white">
                                        {amount}sh
                                    </div>
                                    <div className="text-sm font-medium tracking-wider text-purple-400 uppercase">
                                        {selectedPeriod}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8 h-px bg-purple-400/10" />

                            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
                                <Zap className="h-5 w-5 text-yellow-400" />
                                Included Features
                            </h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {selectedTier.features.map((feature, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: 0.4 + index * 0.1,
                                        }}
                                        className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors hover:border-purple-400/30"
                                    >
                                        <div className="shrink-0 rounded-full bg-emerald-500/20 p-1 text-emerald-400">
                                            <FaCheck />
                                        </div>
                                        <span className="text-sm font-medium text-purple-100">
                                            {feature}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Security Banner */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {[
                                {
                                    icon: Lock,
                                    label: 'Secure SSL Encryption',
                                    color: 'text-blue-400',
                                },
                                {
                                    icon: Shield,
                                    label: 'Money-Back Guarantee',
                                    color: 'text-emerald-400',
                                },
                                {
                                    icon: Info,
                                    label: '24/7 Support Access',
                                    color: 'text-purple-400',
                                },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-white/5 p-4 text-center"
                                >
                                    <item.icon
                                        className={`h-6 w-6 ${item.color}`}
                                    />
                                    <span className="text-xs font-medium tracking-tighter text-purple-200/60 uppercase">
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Payment Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-5"
                    >
                        <div className="sticky top-8 rounded-3xl border border-purple-400/30 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl">
                            <h2 className="mb-8 text-2xl font-bold text-white">
                                Payment Details
                            </h2>

                            {/* Payment Method Selection */}
                            <div className="mb-8">
                                <label className="mb-4 block text-sm font-semibold tracking-wider text-purple-200 uppercase">
                                    Select Method
                                </label>
                                <div className="grid grid-cols-1 gap-3">
                                    {paymentMethods.map((method) => (
                                        <motion.button
                                            key={method.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() =>
                                                setSelectedPayment(method.id)
                                            }
                                            className={`flex items-center gap-4 rounded-2xl border-2 p-5 transition-all ${
                                                selectedPayment === method.id
                                                    ? 'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/10'
                                                    : 'border-white/5 bg-white/5 hover:border-white/20'
                                            }`}
                                        >
                                            <div
                                                className={`rounded-xl p-3 ${selectedPayment === method.id ? 'bg-white' : 'bg-white/10'}`}
                                            >
                                                {method.icon}
                                            </div>
                                            <span className="text-lg font-bold text-white">
                                                {method.name}
                                            </span>
                                            {selectedPayment === method.id && (
                                                <div className="ml-auto rounded-full bg-purple-400 p-1 text-white">
                                                    <CheckCircle className="h-5 w-5" />
                                                </div>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic Forms */}
                            <AnimatePresence mode="wait">
                                {selectedPayment === 'mpesa' && (
                                    <motion.div
                                        key="mpesa-form"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mb-8"
                                    >
                                        <label className="mb-3 block font-semibold text-purple-100">
                                            M-Pesa Phone Number
                                        </label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                                <span className="font-bold text-purple-400">
                                                    +254
                                                </span>
                                            </div>
                                            <input
                                                type="tel"
                                                value={phoneNumber}
                                                onChange={(e) =>
                                                    setPhoneNumber(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="712345678"
                                                className="w-full rounded-2xl border-2 border-white/10 bg-white/5 py-4 pr-4 pl-16 font-medium text-white placeholder-purple-300/30 transition-all focus:border-purple-400 focus:bg-white/10 focus:outline-none"
                                            />
                                        </div>
                                        <label className="mb-3 block font-semibold text-purple-100">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"></div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) =>
                                                    setEmail(e.target.value)
                                                }
                                                placeholder="janedoe@gmail.com"
                                                className="w-full rounded-2xl border-2 border-white/10 bg-white/5 py-4 pr-4 pl-4 font-medium text-white placeholder-purple-300/30 transition-all focus:border-purple-400 focus:bg-white/10 focus:outline-none"
                                            />
                                        </div>
                                        <p className="mt-3 text-xs text-purple-300/60 italic">
                                            You will receive an STK push on your
                                            phone to authorize the payment.
                                        </p>
                                    </motion.div>
                                )}

                                {selectedPayment === 'card' && (
                                    <motion.div
                                        key="card-form"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mb-8 space-y-4"
                                    >
                                        <div>
                                            <label className="mb-2 block font-semibold text-purple-100">
                                                Card Number
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="•••• •••• •••• ••••"
                                                className="w-full rounded-2xl border-2 border-white/10 bg-white/5 px-5 py-4 text-white placeholder-purple-300/30 transition-all focus:border-purple-400 focus:outline-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="mb-2 block text-sm font-semibold text-purple-100">
                                                    Expiry
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="MM/YY"
                                                    className="w-full rounded-2xl border-2 border-white/10 bg-white/5 px-5 py-4 text-white placeholder-purple-300/30 transition-all focus:border-purple-400 focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-sm font-semibold text-purple-100">
                                                    CVV
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="•••"
                                                    className="w-full rounded-2xl border-2 border-white/10 bg-white/5 px-5 py-4 text-white placeholder-purple-300/30 transition-all focus:border-purple-400 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {selectedPayment === 'paypal' && (
                                    <motion.div
                                        key="paypal-form"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mb-8"
                                    >
                                        <label className="mb-3 block font-semibold text-purple-100">
                                            PayPal Email
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="your@email.com"
                                            className="w-full rounded-2xl border-2 border-white/10 bg-white/5 px-5 py-4 text-white placeholder-purple-300/30 transition-all focus:border-purple-400 focus:outline-none"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Payment Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-linear-to-r from-purple-500 to-fuchsia-500 py-5 font-bold text-white shadow-2xl shadow-purple-500/40 transition-all hover:from-purple-600 hover:to-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <div className="absolute inset-0 h-full w-full -translate-x-full bg-linear-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-1000 group-hover:translate-x-full" />
                                {isProcessing ? (
                                    <>
                                        <div className="absolute top-5 left-20 h-6 w-6 animate-spin rounded-full border-b-2 border-white" />

                                        <span>Processing Securely...</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-5 w-5" />
                                        <span>Pay {amount}sh Now</span>
                                    </>
                                )}
                            </motion.button>

                            <p className="mt-6 text-center text-[10px] leading-relaxed text-purple-300/40">
                                By completing this purchase, you agree to our
                                Terms of Service and Privacy Policy. Payments
                                are processed securely via encrypted channels.
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* FAQ Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-16 rounded-3xl border border-purple-400/10 bg-white/5 p-10 backdrop-blur-lg"
                >
                    <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                        <div>
                            <h3 className="mb-4 text-2xl font-bold text-white">
                                Frequently Asked Questions
                            </h3>
                            <p className="mb-6 text-purple-200/60">
                                Everything you need to know about our billing
                                process and subscription plans.
                            </p>
                            <div className="space-y-4">
                                {[
                                    {
                                        q: 'When will my plan activate?',
                                        a: 'Instantly! Once payment is confirmed, your account is upgraded immediately.',
                                    },
                                    {
                                        q: 'Can I change plans later?',
                                        a: 'Yes, you can upgrade or downgrade your plan at any time from your dashboard.',
                                    },
                                ].map((faq, i) => (
                                    <div key={i}>
                                        <h4 className="mb-1 font-semibold text-purple-100">
                                            {faq.q}
                                        </h4>
                                        <p className="text-sm text-purple-300/60">
                                            {faq.a}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 p-8 text-center">
                            <h3 className="mb-2 text-xl font-bold text-white">
                                Need Custom Help?
                            </h3>
                            <p className="mb-6 text-sm text-purple-200/60">
                                Our support team is available 24/7 for any
                                billing inquiries.
                            </p>
                            <a
                                href="mailto:phinjugushdev@gmail.com"
                                className="rounded-xl bg-white px-6 py-3 font-bold text-purple-900 transition-colors hover:bg-purple-100"
                            >
                                Contact Support
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
