import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X } from 'lucide-react';
import { CheckCircle, Sparkles, Download, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type SuccessPopupProps = {
    onDownload: () => void;
    onClose: () => void;
};

const SuccessPopup = ({ onDownload, onClose }: SuccessPopupProps) => {
    const USER_ID = 'demo-pro';
    const navigate = useNavigate();
    const handleContinue = async () => {
        try {
            const res = await axios.get(
                'http://localhost:5000/api/subscription-status',
                {
                    headers: {
                        'x-user-id': USER_ID,
                    },
                }
            );
            if (res.data.subscribed) {
                navigate('/file-merge');
            } else {
                navigate('/upgrade-modal');
            }
        } catch (error) {
            console.log('Subscription check error', error);
        }
    };
    const handlepdfDownload = () => {
        onDownload();
        onClose();
        console.log('Closing up');
    };
    return (
        <div className="w-full max-w-md overflow-hidden rounded-3xl border-2 border-blue-400/30 bg-linear-to-br from-blue-900 via-blue-800 to-cyan-900 shadow-2xl">
            {/* Success Icon */}
            <div className="flex justify-center pt-8 pb-4">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        type: 'spring',
                        stiffness: 200,
                        delay: 0.2,
                    }}
                    className="relative"
                >
                    <div className="absolute inset-0 rounded-full bg-linear-to-r from-blue-500 to-cyan-500 opacity-50 blur-xl" />
                    <div className="relative rounded-full bg-linear-to-br from-blue-500 to-cyan-500 p-4">
                        <CheckCircle className="h-16 w-16 text-white" />
                    </div>
                </motion.div>
            </div>

            {/* Content */}
            <div className="px-8 py-6 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-3 flex items-center justify-center gap-2 text-3xl font-bold text-white"
                >
                    Success!
                    <span className="text-2xl">🎉</span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-2 text-lg text-blue-100"
                >
                    Your folder has been cleaned successfully
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 mb-8 rounded-xl border border-blue-400/20 bg-white/10 p-4 backdrop-blur-sm"
                >
                    <div className="flex items-start gap-3">
                        <Sparkles className="mt-1 h-6 w-6 shrink-0 text-cyan-400" />
                        <p className="text-left leading-relaxed text-white">
                            Would you like to{' '}
                            <span className="font-semibold text-cyan-300">
                                sanitize & combine
                            </span>{' '}
                            all files into one master document?
                        </p>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleContinue}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-500 to-cyan-500 px-6 py-4 font-bold text-white shadow-lg shadow-blue-500/50 transition-all hover:from-blue-600 hover:to-cyan-600"
                    >
                        <span>Yes, Continue</span>
                        <ArrowRight className="h-5 w-5" />
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handlepdfDownload}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400/30 bg-white/10 px-6 py-4 font-semibold text-white transition-all hover:border-blue-400/50 hover:bg-white/20"
                    >
                        <Download className="h-5 w-5" />
                        <span>No, Download Cleaned Folder</span>
                    </motion.button>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-blue-500 via-cyan-500 to-blue-500" />
        </div>
    );
};
export default SuccessPopup;

export const UpgradeModal = () => {
    const navigate = useNavigate();
    const handleUpgrade = () => {
        console.log('User wants to upgrade');
        navigate('/billing');
    };

    const handleDecline = () => {
        console.log('User declined upgrade');
        navigate('/');
    };

    const handleClose = () => {
        navigate('/');
    };

    return (
        <AnimatePresence>
            <>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    <div className="relative w-full max-w-md rounded-2xl border border-purple-400/30 bg-linear-to-br from-purple-900 via-blue-900 to-purple-900 p-8 shadow-2xl">
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-purple-300 transition-colors hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Icon */}
                        <div className="mb-6 flex justify-center">
                            <div className="rounded-full bg-linear-to-br from-purple-500 to-blue-500 p-4">
                                <Crown className="h-12 w-12 text-white" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="mb-8 text-center">
                            <h2 className="mb-3 text-3xl font-bold text-white">
                                Upgrade to Pro?
                            </h2>
                            <p className="text-lg text-purple-200">
                                Would you like to upgrade and get more features?
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="space-y-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleUpgrade}
                                className="w-full rounded-xl bg-linear-to-r from-purple-500 to-blue-500 py-4 font-bold text-white shadow-lg transition-all hover:from-purple-600 hover:to-blue-600"
                            >
                                Yes, Upgrade Now
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleDecline}
                                className="w-full rounded-xl border border-purple-400/30 bg-white/10 py-4 font-semibold text-white transition-all hover:bg-white/20"
                            >
                                No, Thanks
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </>
        </AnimatePresence>
    );
};

// Demo Component

// Demo Component

// Demo Component to show the popup in action
