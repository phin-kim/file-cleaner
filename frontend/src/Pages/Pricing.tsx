import React, { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import {
    FaWandMagicSparkles,
    FaBroom,
    FaFilePdf,
    FaCheck,
} from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../Store/TransactionStore';
//import { useAuthStore } from '../Store/authStore';

const Pricing: React.FC = () => {
    const navigate = useNavigate();
    const selectedTier = useTransactions((s) => s.tier);
    const selectedPeriod = useTransactions((s) => s.selectedPeriod);
    const setSelectedPeriod = useTransactions((s) => s.setSelectedPeriod);
    const setAmount = useTransactions((s) => s.setAmount);
    const setTier = useTransactions((s) => s.setTier);

    const [isQuarterly, setIsQuarterly] = useState(false);

    const tiers = [
        {
            id: 'tier-1',
            name: 'Basic Cleanup',
            monthlyPrice: 1,
            quarterlyPrice: 550,
            description: 'Perfect for individuals needing quick organization.',
            features: [
                'Organized files into their respective folders',
                'Better distinction of your folder contents',
                'Increased number of uploads',
            ],
            highlight: false,
            icon: <FaBroom />,
        },
        {
            id: 'tier-2',
            name: 'Question Master',
            monthlyPrice: 270,
            quarterlyPrice: 750,
            description: 'Ideal for educators and content creators.',
            features: [
                'Merge multiple questions into one PDF',
                'Professional PDF formatting',
                'Remove duplicate questions for easier study',
                'Get detailed breakdown on the source of the questions',
            ],
            highlight: true,
            icon: <FaFilePdf />,
        },
        {
            id: 'tier-3',
            name: 'Tidy Up Pro',
            monthlyPrice: 500,
            quarterlyPrice: 1400,
            description: 'The complete utility suite for power users.',
            features: [
                'Merge questions into one PDF',
                'Clean multiple duplicate folders',
                'Priority AI processing',
                'Increased file upload limit',
                'Advanced cleanup strategies',
                'Detailed breakdown of your folder composition',
            ],
            highlight: false,
            icon: <FaWandMagicSparkles />,
        },
    ];

    const handleChangePeriod = () => {
        const newIsQuarterly = !isQuarterly;
        setIsQuarterly(newIsQuarterly);
        if (newIsQuarterly) {
            setSelectedPeriod('3 months');
        } else {
            setSelectedPeriod('monthly');
        }
    };

    const handleTier = (tierId: string) => {
        const selected = tiers.find((t) => t.id === tierId);
        if (selected) {
            setTier(selected as any);
            if (isQuarterly) {
                setSelectedPeriod('3 months');
                setAmount(selected.quarterlyPrice ?? 0);
            } else {
                setSelectedPeriod('monthly');
                setAmount(selected.monthlyPrice ?? 0);
            }
            navigate('/pricing/billing');
        }
    };

    useEffect(() => {
        if (selectedTier) {
            if (selectedPeriod === 'monthly') {
                setAmount(selectedTier.monthlyPrice ?? 0);
            } else {
                setAmount(selectedTier.quarterlyPrice ?? 0);
            }
        }
    }, [selectedPeriod, selectedTier, setAmount]);

    return (
        <div className="relative mx-auto overflow-hidden bg-linear-to-br from-purple-600 to-violet-800 px-4 py-12 sm:px-6 lg:px-8">
            {/* Decorative background elements */}

            <div className="mb-16 text-center">
                <h2 className="text-base font-semibold tracking-wide text-purple-400 uppercase">
                    Pricing
                </h2>
                <p className="mt-2 text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
                    Choose Your Plan
                </p>
                <p className="mx-auto mt-5 max-w-xl text-xl text-purple-200/60">
                    Unlock the full potential of Tidy Up with our flexible
                    pricing tiers.
                </p>
                <div className="mt-10 flex items-center justify-center gap-4">
                    <span
                        className={`text-sm font-medium ${!isQuarterly ? 'text-white' : 'text-purple-200/40'}`}
                    >
                        Monthly
                    </span>
                    <button
                        onClick={handleChangePeriod}
                        className="relative h-7 w-14 rounded-full bg-white/10 p-1 transition-colors hover:bg-white/20"
                    >
                        <motion.div
                            animate={{ x: isQuarterly ? 28 : 0 }}
                            className="h-5 w-5 rounded-full bg-purple-500 shadow-lg"
                        />
                    </button>
                    <span
                        className={`text-sm font-medium ${isQuarterly ? 'text-white' : 'text-purple-200/40'}`}
                    >
                        3 Months{' '}
                        <span className="ml-1 text-xs font-bold text-emerald-400">
                            Save ~10%
                        </span>
                    </span>
                </div>
                <p className="mt-4 text-sm font-medium text-purple-400/80">
                    <i className="fa-solid fa-shield-check mr-2"></i>
                    Cancel anytime. No hidden fees.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {tiers.map((tier, idx) => (
                    <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`relative flex flex-col rounded-3xl border ${
                            tier.highlight
                                ? 'z-10 scale-105 border-purple-200 bg-white shadow-2xl'
                                : 'border-white/10 bg-white/5 backdrop-blur-sm transition-colors hover:bg-white/10'
                        } p-8`}
                    >
                        <div className="flex-1">
                            <div
                                className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
                                    tier.highlight
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/10 text-purple-300'
                                }`}
                            >
                                {tier.icon}
                            </div>
                            <h3
                                className={`text-2xl font-bold ${tier.highlight ? 'text-slate-900' : 'text-white'}`}
                            >
                                {tier.name}
                            </h3>
                            <p
                                className={`mt-4 text-sm ${tier.highlight ? 'text-slate-500' : 'text-purple-200/60'}`}
                            >
                                {tier.description}
                            </p>
                            <div className="mt-8">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={
                                            isQuarterly
                                                ? 'quarterly'
                                                : 'monthly'
                                        }
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex items-baseline"
                                    >
                                        <span
                                            className={`text-4xl font-extrabold tracking-tight ${tier.highlight ? 'text-slate-900' : 'text-white'}`}
                                        >
                                            {isQuarterly
                                                ? tier.quarterlyPrice
                                                : tier.monthlyPrice}
                                            sh
                                        </span>
                                        <span
                                            className={`ml-1 text-base font-medium ${tier.highlight ? 'text-slate-500' : 'text-purple-200/40'}`}
                                        >
                                            /
                                            {isQuarterly ? '3 months' : 'month'}
                                        </span>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            <ul className="mt-8 space-y-4">
                                {tier.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex items-start"
                                    >
                                        <div className="shrink-0">
                                            <FaCheck
                                                className={`fa-solid fa-check text-sm ${tier.highlight ? 'text-purple-600' : 'text-purple-400'}`}
                                            />
                                        </div>
                                        <p
                                            className={`ml-3 text-sm font-medium ${tier.highlight ? 'text-slate-600' : 'text-purple-100/80'}`}
                                        >
                                            {feature}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={() => handleTier(tier.id)}
                            className={`mt-10 block w-full rounded-2xl px-6 py-4 text-center text-sm font-bold transition-all ${
                                tier.highlight
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-700'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                        >
                            <span>Get started</span>
                        </button>
                    </motion.div>
                ))}
            </div>

            <div className="mt-16 text-center">
                <p className="text-sm text-purple-200/40">
                    All prices are in Kenyan Shillings (sh){' '}
                </p>
                <p className="text-purple-400 hover:underline">
                    Contact us at{' '}
                    <span className="text-sm font-bold text-purple-100 italic">
                        phinjugushdev@gmail.com
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Pricing;
