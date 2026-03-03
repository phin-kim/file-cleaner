import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import useSuccessStore from '../Store/SuccessStore';
import { CheckCircle2 } from 'lucide-react';
const SuccessToast = () => {
    const success = useSuccessStore((state) => state.success);
    const clearSuccess = useSuccessStore((state) => state.clearSuccess);
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => clearSuccess(), 4000);
            return () => clearTimeout(timer);
        }
    }, [success, clearSuccess]);
    if (!success) return null;
    return (
        <>
            <AnimatePresence>
                {success && (
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
                        // Offset from top to avoid overlapping with ErrorToast if both are present
                        // Or we could use a container, but for now let's use a different top position
                        className="fixed top-6 right-6 z-9999 flex max-w-md min-w-75 items-center gap-3 rounded-2xl border border-emerald-500/50 bg-emerald-500/50 px-6 py-4 text-white shadow-[0_8px_32px_rgba(16,185,129,0.3)] backdrop-blur-xl"
                    >
                        <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-emerald-500/40">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold tracking-wider uppercase opacity-70">
                                Success
                            </p>
                            <p className="text-base font-medium">{success}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
export default SuccessToast;
