import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import useSuccessStore from '../Store/SuccessStore';
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
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        transition={{
                            duration: 8.8,
                            ease: 'easeInOut',
                            type: 'spring',
                            stiffness: 150,
                            damping: 10,
                        }}
                        className="border-neon h4 fixed top-20 right-2 z-9999 rounded-2xl border-2 bg-green-600/70 p-4 font-bold text-white"
                    >
                        {success}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
export default SuccessToast;
