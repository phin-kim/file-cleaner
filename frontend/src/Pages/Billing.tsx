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
import { useTransactions } from '../Store/useTransactions';
import { useNavigate } from 'react-router-dom';
import type { PaymentMethod } from '../types/transactions';

export default function Billing() {
    const [selectedPayment, setSelectedPayment] = useState<string>('mpesa');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const amount = useTransactions((state) => state.amount);
    const selectedPeriod = useTransactions((state) => state.selectedPeriod);
    const selectedTier = useTransactions((state) => state.tier);
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

    const handlePayment = () => {
        if (selectedPayment === 'mpesa' && !phoneNumber) {
            alert('Please enter your M-Pesa phone number');
            return;
        }

        setIsProcessing(true);
        // Backend payment processing simulation
        setTimeout(() => {
            setIsProcessing(false);
            alert(
                `Payment of ${amount}sh for ${selectedTier?.name} (${selectedPeriod}) initiated! Check your phone for the STK push.`
            );
        }, 2000);
    };

    if (!selectedTier) return null;

    return (
        <div className="min-h-screen p-4 bg-linear-to-br from-purple-600 to-violet-800 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Navigation */}
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/pricing')}
                    className="flex items-center gap-2 mb-8 text-purple-200 transition-colors group hover:text-white"
                >
                    <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
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
                        className="inline-block mb-4"
                    >
                        <div className="p-4 shadow-lg rounded-2xl bg-linear-to-r from-purple-500 to-fuchsia-500 shadow-purple-500/20">
                            <Sparkles className="w-12 h-12 text-white" />
                        </div>
                    </motion.div>
                    <h1 className="mb-3 text-4xl font-bold text-white md:text-5xl">
                        Complete Your{' '}
                        <span className="text-transparent bg-linear-to-r from-purple-400 to-fuchsia-400 bg-clip-text">
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
                        <div className="p-8 border rounded-3xl border-purple-400/20 bg-white/5 backdrop-blur-xl">
                            <div className="flex items-start justify-between mb-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 text-purple-400 rounded-lg bg-purple-500/20">
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

                            <div className="h-px mb-8 bg-purple-400/10" />

                            <h3 className="flex items-center gap-2 mb-6 text-lg font-semibold text-white">
                                <Zap className="w-5 h-5 text-yellow-400" />
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
                                        className="flex items-center gap-3 p-4 transition-colors border rounded-2xl border-white/5 bg-white/5 hover:border-purple-400/30"
                                    >
                                        <div className="p-1 rounded-full shrink-0 bg-emerald-500/20 text-emerald-400">
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
                                    className="flex flex-col items-center gap-2 p-4 text-center border rounded-2xl border-white/5 bg-white/5"
                                >
                                    <item.icon
                                        className={`h-6 w-6 ${item.color}`}
                                    />
                                    <span className="text-xs font-medium tracking-tighter uppercase text-purple-200/60">
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
                        <div className="sticky p-8 border shadow-2xl top-8 rounded-3xl border-purple-400/30 bg-white/10 backdrop-blur-2xl">
                            <h2 className="mb-8 text-2xl font-bold text-white">
                                Payment Details
                            </h2>

                            {/* Payment Method Selection */}
                            <div className="mb-8">
                                <label className="block mb-4 text-sm font-semibold tracking-wider text-purple-200 uppercase">
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
                                                <div className="p-1 ml-auto text-white bg-purple-400 rounded-full">
                                                    <CheckCircle className="w-5 h-5" />
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
                                        <label className="block mb-3 font-semibold text-purple-100">
                                            M-Pesa Phone Number
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
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
                                                className="w-full py-4 pl-16 pr-4 font-medium text-white transition-all border-2 rounded-2xl border-white/10 bg-white/5 placeholder-purple-300/30 focus:border-purple-400 focus:bg-white/10 focus:outline-none"
                                            />
                                        </div>
                                        <p className="mt-3 text-xs italic text-purple-300/60">
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
                                            <label className="block mb-2 font-semibold text-purple-100">
                                                Card Number
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="•••• •••• •••• ••••"
                                                className="w-full px-5 py-4 text-white transition-all border-2 rounded-2xl border-white/10 bg-white/5 placeholder-purple-300/30 focus:border-purple-400 focus:outline-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block mb-2 text-sm font-semibold text-purple-100">
                                                    Expiry
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="MM/YY"
                                                    className="w-full px-5 py-4 text-white transition-all border-2 rounded-2xl border-white/10 bg-white/5 placeholder-purple-300/30 focus:border-purple-400 focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-semibold text-purple-100">
                                                    CVV
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="•••"
                                                    className="w-full px-5 py-4 text-white transition-all border-2 rounded-2xl border-white/10 bg-white/5 placeholder-purple-300/30 focus:border-purple-400 focus:outline-none"
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
                                        <label className="block mb-3 font-semibold text-purple-100">
                                            PayPal Email
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="your@email.com"
                                            className="w-full px-5 py-4 text-white transition-all border-2 rounded-2xl border-white/10 bg-white/5 placeholder-purple-300/30 focus:border-purple-400 focus:outline-none"
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
                                className="relative flex items-center justify-center w-full gap-3 py-5 overflow-hidden font-bold text-white transition-all shadow-2xl group rounded-2xl bg-linear-to-r from-purple-500 to-fuchsia-500 shadow-purple-500/40 hover:from-purple-600 hover:to-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <div className="absolute inset-0 w-full h-full transition-transform duration-1000 -translate-x-full bg-linear-to-r from-white/0 via-white/20 to-white/0 group-hover:translate-x-full" />
                                {isProcessing ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{
                                                duration: 1,
                                                repeat: Infinity,
                                                ease: 'linear',
                                            }}
                                        >
                                            <CreditCard className="w-6 h-6" />
                                        </motion.div>
                                        <span>Processing Securely...</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-5 h-5" />
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
                    className="p-10 mt-16 border rounded-3xl border-purple-400/10 bg-white/5 backdrop-blur-lg"
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
                        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-2xl border-purple-500/20 bg-purple-500/10">
                            <h3 className="mb-2 text-xl font-bold text-white">
                                Need Custom Help?
                            </h3>
                            <p className="mb-6 text-sm text-purple-200/60">
                                Our support team is available 24/7 for any
                                billing inquiries.
                            </p>
                            <a
                                href="mailto:phinjugushdev@gmail.com"
                                className="px-6 py-3 font-bold text-purple-900 transition-colors bg-white rounded-xl hover:bg-purple-100"
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
