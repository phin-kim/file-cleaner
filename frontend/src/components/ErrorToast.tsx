import { useEffect } from 'react';
import useErrorStore from '../Store/ErrorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
const ErrorToast = () => {
    const { error, clearError } = useErrorStore();
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => clearError(), 4000);
            return () => clearTimeout(timer);
        }
    }, [error, clearError]);
    if (!error) return null;
    return (
        <>
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        transition={{
                            duration: 0.5,
                            type: 'spring',
                            damping: 15,
                            stiffness: 300,
                        }}
                        className="fixed top-6 right-6 z-9999 flex max-w-md min-w-75 items-center gap-3 rounded-2xl border border-red-500 bg-red-500/90 px-6 py-4 text-white shadow-[12px_8px_32px_rgba(239,68,68,0.3)] backdrop-blur-xl"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/40">
                            <AlertCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold tracking-wider uppercase opacity-70">
                                Error
                            </p>
                            <p className="text-base font-medium">{error}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
export default ErrorToast;
