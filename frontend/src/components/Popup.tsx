import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X } from 'lucide-react';
import { CheckCircle, Sparkles, Download, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { subscriptionApi } from '../library/client';
import createClientLogger from '../utils/clientLogger';
const log = createClientLogger('Popup component');
type SuccessPopupProps = {
    onDownload: () => void;
    onClose: () => void;
};

const SuccessPopup = ({ onDownload, onClose }: SuccessPopupProps) => {
    const USER_ID = 'demo-free';
    const navigate = useNavigate();
    console.log('Checking subscription status for user:', USER_ID);
    const handleContinue = async () => {
        try {
            const res = await subscriptionApi.get('/subscription-status', {
                headers: {
                    'x-user-id': USER_ID,
                },
            });
            log.info('Subscription status response', res.data);
            if (res.data.plan === 'pro' || res.data.plan === 'admin') {
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
        <div className="w-full max-w-md overflow-hidden border-2 shadow-2xl rounded-3xl border-blue-400/30 bg-linear-to-br from-blue-900 via-blue-800 to-cyan-900">
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
                    <div className="absolute inset-0 rounded-full opacity-50 bg-linear-to-r from-blue-500 to-cyan-500 blur-xl" />
                    <div className="relative p-4 rounded-full bg-linear-to-br from-blue-500 to-cyan-500">
                        <CheckCircle className="w-16 h-16 text-white" />
                    </div>
                </motion.div>
            </div>

            {/* Content */}
            <div className="px-8 py-6 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center gap-2 mb-3 text-3xl font-bold text-white"
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
                    className="p-4 mt-6 mb-8 border rounded-xl border-blue-400/20 bg-white/10 backdrop-blur-sm"
                >
                    <div className="flex items-start gap-3">
                        <Sparkles className="w-6 h-6 mt-1 shrink-0 text-cyan-400" />
                        <p className="leading-relaxed text-left text-white">
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
                        className="flex items-center justify-center w-full gap-2 px-6 py-4 font-bold text-white transition-all shadow-lg rounded-xl bg-linear-to-r from-blue-500 to-cyan-500 shadow-blue-500/50 hover:from-blue-600 hover:to-cyan-600"
                    >
                        <span>Yes, Continue</span>
                        <ArrowRight className="w-5 h-5" />
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handlepdfDownload}
                        className="flex items-center justify-center w-full gap-2 px-6 py-4 font-semibold text-white transition-all border rounded-xl border-blue-400/30 bg-white/10 hover:border-blue-400/50 hover:bg-white/20"
                    >
                        <Download className="w-5 h-5" />
                        <span>No, Download Cleaned Folder</span>
                    </motion.button>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-cyan-500 to-blue-500" />
        </div>
    );
};
export default SuccessPopup;

export const UpgradeModal = ({ onClose }: { onClose: () => void }) => {
    const navigate = useNavigate();
    const handleUpgrade = () => {
        navigate('/pricing');
    };

    const handleDecline = () => {
        onClose();
    };

    const handleCloseButton = () => {
        onClose();
    };

    return (
        <AnimatePresence>
            <>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleCloseButton}
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
                    <div className="relative w-full max-w-md p-8 border shadow-2xl rounded-2xl border-purple-400/30 bg-linear-to-br from-purple-900 via-blue-900 to-purple-900">
                        {/* Close Button */}
                        <button
                            onClick={handleCloseButton}
                            className="absolute text-purple-300 transition-colors top-4 right-4 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="p-4 rounded-full bg-linear-to-br from-purple-500 to-blue-500">
                                <Crown className="w-12 h-12 text-white" />
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
                                className="w-full py-4 font-bold text-white transition-all shadow-lg rounded-xl bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                            >
                                Yes, Upgrade Now
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleDecline}
                                className="w-full py-4 font-semibold text-white transition-all border rounded-xl border-purple-400/30 bg-white/10 hover:bg-white/20"
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
