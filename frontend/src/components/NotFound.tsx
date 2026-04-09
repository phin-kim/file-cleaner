import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';
import { X } from 'lucide-react';

const NotFound = ({ onClose }: { onClose: () => void }) => {
    const navigate = useNavigate();
    const handleCloseButton = () => {
        onClose();
    };
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
            <button
                onClick={handleCloseButton}
                className="absolute top-4 right-4 rounded-full p-2 transition-colors hover:bg-gray-100/20"
            >
                <X className="h-8 w-8 text-gray-200" />
            </button>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md space-y-8 text-center"
            >
                <div className="relative">
                    <motion.div
                        animate={{
                            rotate: [0, -10, 10, -10, 10, 0],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: 'reverse',
                        }}
                        className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 text-red-500"
                    >
                        <FaExclamationTriangle size={48} />
                    </motion.div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-white">
                        Page Not Found
                    </h2>
                    <p className="text-slate-400">
                        Oops! The page you're looking for seems to have tidied
                        itself away. It might have been moved or deleted.
                    </p>
                </div>

                <div className="pt-8">
                    <h1 className="text-9xl font-black text-slate-800 select-none">
                        404
                    </h1>
                </div>

                <div className="pt-12">
                    <p className="text-xs tracking-widest text-slate-600 uppercase">
                        Error Code: TIDY_404_NOT_FOUND
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFound;
