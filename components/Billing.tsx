import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles,
    CheckCircle,
    Lock,
    CreditCard,
    Shield,
    Zap,
    FileCheck,
    FolderSync,
    Brain,
    Star,
} from 'lucide-react';
import { FaPaypal, FaCreditCard } from 'react-icons/fa6';
import { MdPhoneAndroid } from 'react-icons/md';
import type { PaymentMethod } from '../library/types';
export default function BillingPage() {
    const [selectedPayment, setSelectedPayment] = useState<string>('mpesa');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const paymentMethods: PaymentMethod[] = [
        {
            id: 'mpesa',
            name: 'M-Pesa',
            icon: <MdPhoneAndroid className="text-blue-600" />,
        },
        {
            id: 'card',
            name: 'Credit/Debit Card',
            icon: <FaCreditCard className="text-blue-600" />,
        },
        {
            id: 'paypal',
            name: 'PayPal',
            icon: <FaPaypal className="text-blue-600" />,
        },
    ];

    const features = [
        {
            icon: FileCheck,
            title: 'Advanced File Sanitization',
            description:
                'Automatically clean and organize messy file names and formats',
        },
        {
            icon: Brain,
            title: 'AI-Powered Analysis',
            description:
                'Smart detection of duplicate and similar content across all files',
        },
        {
            icon: FolderSync,
            title: 'Intelligent Merging',
            description:
                'Combine unique files seamlessly while preserving important data',
        },
        {
            icon: Zap,
            title: 'Batch Processing',
            description:
                'Process unlimited files at once with lightning-fast speed',
        },
        {
            icon: Shield,
            title: 'Priority Support',
            description: 'Get dedicated assistance whenever you need help',
        },
        {
            icon: Star,
            title: 'Lifetime Access',
            description:
                'One-time payment, no subscriptions, unlimited usage forever',
        },
    ];

    const handlePayment = () => {
        setIsProcessing(true);
        // Backend payment processing will be implemented here
        setTimeout(() => {
            setIsProcessing(false);
            alert('Payment processing will be implemented in the backend!');
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-950 via-blue-900 to-cyan-900 p-6">
            <div className="mx-auto max-w-6xl">
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
                        <div className="rounded-2xl bg-linear-to-r from-blue-500 to-cyan-500 p-4">
                            <Sparkles className="h-12 w-12 text-white" />
                        </div>
                    </motion.div>
                    <h1 className="mb-3 text-5xl font-bold text-white">
                        Upgrade to{' '}
                        <span className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            Tidy Up Pro
                        </span>
                    </h1>
                    <p className="text-lg text-blue-200">
                        Unlock the full power of automated file management
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Features Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-6 lg:col-span-2"
                    >
                        {/* What's Included Banner */}
                        <div className="rounded-2xl border border-blue-400/30 bg-linear-to-r from-blue-500/20 to-cyan-500/20 p-6 backdrop-blur-lg">
                            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
                                <CheckCircle className="h-6 w-6 text-cyan-400" />
                                What's Included in Pro
                            </h2>
                            <p className="leading-relaxed text-blue-100">
                                <span className="font-semibold text-cyan-300">
                                    File sanitization
                                </span>{' '}
                                is just the beginning. Tidy Up Pro unlocks the
                                ability to{' '}
                                <span className="font-semibold text-cyan-300">
                                    combine, analyze, and organize
                                </span>{' '}
                                all your files automatically using advanced AI
                                technology. Say goodbye to manual file
                                management forever.
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    whileHover={{ scale: 1.03, y: -5 }}
                                    className="cursor-pointer rounded-xl border border-blue-400/20 bg-white/10 p-5 backdrop-blur-lg transition-all hover:border-cyan-400/50"
                                >
                                    <feature.icon className="mb-3 h-8 w-8 text-cyan-400" />
                                    <h3 className="mb-2 font-semibold text-white">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-blue-200">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Trust Badges */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="flex items-center justify-center gap-6 py-4"
                        >
                            <div className="flex items-center gap-2 text-blue-300">
                                <Lock className="h-5 w-5" />
                                <span className="text-sm font-medium">
                                    Secure Payment
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-blue-300">
                                <Shield className="h-5 w-5" />
                                <span className="text-sm font-medium">
                                    Money-Back Guarantee
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Payment Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-1"
                    >
                        <div className="sticky top-6 rounded-2xl border border-blue-400/30 bg-white/10 p-6 backdrop-blur-lg">
                            {/* Price Display */}
                            <div className="mb-6 rounded-xl bg-linear-to-br from-blue-600 to-cyan-600 p-6 text-center">
                                <p className="mb-2 text-sm tracking-wide text-blue-100 uppercase">
                                    One-Time Payment
                                </p>
                                <div className="flex items-baseline justify-center gap-2">
                                    <span className="text-5xl font-bold text-white">
                                        KSh 500
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-blue-100">
                                    Lifetime access • No subscriptions
                                </p>
                                <div className="mt-4 inline-block rounded-lg bg-white/20 px-4 py-2">
                                    <p className="text-xs font-semibold text-white">
                                        🎉 Launch Offer - Limited Time
                                    </p>
                                </div>
                            </div>

                            {/* Payment Method Selection */}
                            <div className="mb-6">
                                <label className="mb-3 block font-semibold text-white">
                                    Payment Method
                                </label>
                                <div className="space-y-3">
                                    {paymentMethods.map((method) => (
                                        <motion.button
                                            key={method.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() =>
                                                setSelectedPayment(method.id)
                                            }
                                            className={`flex w-full items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                                                selectedPayment === method.id
                                                    ? 'border-cyan-400 bg-cyan-500/20'
                                                    : 'border-blue-400/30 bg-white/5 hover:border-blue-400/50'
                                            }`}
                                        >
                                            <span className="text-2xl">
                                                {method.icon}
                                            </span>
                                            <span className="font-medium text-white">
                                                {method.name}
                                            </span>
                                            {selectedPayment === method.id && (
                                                <CheckCircle className="ml-auto h-5 w-5 text-cyan-400" />
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Details Form */}
                            {selectedPayment === 'mpesa' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mb-6"
                                >
                                    <label className="mb-2 block font-semibold text-white">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) =>
                                            setPhoneNumber(e.target.value)
                                        }
                                        placeholder="0712345678"
                                        className="w-full rounded-lg border border-blue-400/30 bg-white/10 px-4 py-3 text-white placeholder-blue-300/50 transition-colors focus:border-cyan-400 focus:outline-none"
                                    />
                                </motion.div>
                            )}

                            {selectedPayment === 'card' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mb-6 space-y-3"
                                >
                                    <div>
                                        <label className="mb-2 block font-semibold text-white">
                                            Card Number
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="1234 5678 9012 3456"
                                            className="w-full rounded-lg border border-blue-400/30 bg-white/10 px-4 py-3 text-white placeholder-blue-300/50 transition-colors focus:border-cyan-400 focus:outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-white">
                                                Expiry
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="MM/YY"
                                                className="w-full rounded-lg border border-blue-400/30 bg-white/10 px-4 py-3 text-white placeholder-blue-300/50 transition-colors focus:border-cyan-400 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-white">
                                                CVV
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="123"
                                                className="w-full rounded-lg border border-blue-400/30 bg-white/10 px-4 py-3 text-white placeholder-blue-300/50 transition-colors focus:border-cyan-400 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {selectedPayment === 'paypal' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mb-6"
                                >
                                    <label className="mb-2 block font-semibold text-white">
                                        PayPal Email
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        className="w-full rounded-lg border border-blue-400/30 bg-white/10 px-4 py-3 text-white placeholder-blue-300/50 transition-colors focus:border-cyan-400 focus:outline-none"
                                    />
                                </motion.div>
                            )}

                            {/* Payment Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-500 to-cyan-500 py-4 font-bold text-white shadow-lg shadow-blue-500/50 transition-all hover:from-blue-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
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
                                            <CreditCard className="h-5 w-5" />
                                        </motion.div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-5 w-5" />
                                        Complete Payment - KSh 500
                                    </>
                                )}
                            </motion.button>

                            <p className="mt-4 text-center text-xs text-blue-300">
                                By completing this purchase, you agree to our
                                terms and conditions
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* FAQ or Additional Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12 rounded-2xl border border-blue-400/20 bg-white/5 p-8 text-center backdrop-blur-lg"
                >
                    <h3 className="mb-4 text-2xl font-bold text-white">
                        Questions?
                    </h3>
                    <p className="mb-6 text-blue-200">
                        Our support team is here to help! Contact us anytime at{' '}
                        <a
                            href="mailto:phinehasnjuguna1@gmail.com"
                            className="text-cyan-400 hover:underline"
                        >
                            phinehasnjuguna1@gmail.com
                        </a>
                    </p>
                    <div className="flex items-center justify-center gap-8 text-sm text-blue-300">
                        <span>✓ Instant activation</span>
                        <span>✓ 30-day money-back guarantee</span>
                        <span>✓ Secure checkout</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
