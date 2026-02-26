import { useEffect } from 'react';
import useErrorStore from '../Store/ErrorStore';
import { motion } from 'framer-motion';
const Errortoast = () => {
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
            <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{
                    duration: 1.3,
                    type: 'spring',
                    damping: 15,
                    stiffness: 300,
                }}
                className="font-display backdrop:-blur-md fixed top-6 right-2 z-9998 rounded-2xl border-2 border-red-600 bg-red-600/50 p-2 text-base font-bold text-white shadow-[inset_0_0_24px_rgba(255,0,0,0.6),0_4px_24px_rgba(139,0,0,0.4)]"
            >
                {error}
            </motion.div>
        </>
    );
};
export default Errortoast;
