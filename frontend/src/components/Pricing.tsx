import React from 'react';
import { motion } from 'framer-motion';
import {
    FaWandMagicSparkles,
    FaBroom,
    FaFilePdf,
    FaCheck,
} from 'react-icons/fa6';
const Pricing: React.FC = () => {
    const tiers = [
        {
            id: 'tier-1',
            name: 'Basic Cleanup',
            price: 'sh 500 ',
            description: 'Perfect for individuals needing quick organization.',
            features: [
                'Clean multiple duplicate folders',

                'Increased number of uploads',
            ],
            highlight: false,
            icon: <FaBroom />,
        },
        {
            id: 'tier-2',
            name: 'Question Master',
            price: 'sh 600 ',
            description: 'Ideal for educators and content creators.',
            features: [
                'Merge multiple questions into PDF',
                'Professional PDF formatting',

                'Unlimited question entries',
            ],
            highlight: true,
            icon: <FaFilePdf />,
        },
        {
            id: 'tier-3',
            name: 'Tidy Up Pro',
            price: 'sh 1200 ',
            description: 'The complete utility suite for power users.',
            features: [
                'Merge questions into PDF',
                'Clean multiple duplicate folders',
                'Priority AI processing',
                'Advanced cleanup strategies',
                '24/7 Support',
            ],
            highlight: false,
            icon: <FaWandMagicSparkles />,
        },
    ];

    return (
        <div className="relative px-4 py-12 mx-auto overflow-hidden bg-linear-to-br from-purple-600 to-violet-800 sm:px-6 lg:px-8">
            {/* Decorative background elements */}

            <div className="mb-16 text-center">
                <h2 className="text-base font-semibold tracking-wide text-purple-400 uppercase">
                    Pricing
                </h2>
                <p className="mt-2 text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
                    Choose Your Plan
                </p>
                <p className="max-w-xl mx-auto mt-5 text-xl text-purple-200/60">
                    Unlock the full potential of Tidy Up with our flexible
                    pricing tiers.
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
                            <p className="mt-8">
                                <span
                                    className={`text-4xl font-extrabold tracking-tight ${tier.highlight ? 'text-slate-900' : 'text-white'}`}
                                >
                                    {tier.price}
                                </span>
                                <span
                                    className={`text-base font-medium ${tier.highlight ? 'text-slate-500' : 'text-purple-200/40'}`}
                                >
                                    /one-time
                                </span>
                            </p>

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
                            className={`mt-10 block w-full rounded-2xl px-6 py-4 text-center text-sm font-bold transition-all ${
                                tier.highlight
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-700'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                        >
                            Get Started
                        </button>
                    </motion.div>
                ))}
            </div>

            <div className="mt-16 text-center">
                <p className="text-sm text-purple-200/40">
                    All prices are in Kenyan Shillings (sh){' '}
                    <p className="text-purple-400 hover:underline">
                        Contact us at{' '}
                        <span className="text-sm italic font-bold text-purple-100">
                            phinjugushdev@gmail.com
                        </span>
                    </p>
                    .
                </p>
            </div>
        </div>
    );
};

export default Pricing;
