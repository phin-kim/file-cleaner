import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ResetSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || 'your email';

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 pt-16">
            <div className="mb-8 text-center">
                <span className="mb-4 block text-[10px] font-bold tracking-[0.2em] text-purple-600 uppercase">
                    Account Recovery
                </span>
                <h1 className="mb-4 text-4xl font-bold text-slate-900">
                    Reset your password
                </h1>
                <p className="mx-auto max-w-sm text-sm text-slate-600">
                    We have emailed you a secure link to input a new password
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xl"
            >
                <p className="mb-8 text-base leading-relaxed text-slate-600">
                    If{' '}
                    <span className="font-medium text-slate-900">{email}</span>{' '}
                    is registered, you'll receive a reset link shortly. Check
                    spam folders too.
                </p>

                <button
                    onClick={() => navigate('/auth')}
                    className="border-b border-purple-500/20 pb-1 text-sm font-bold text-purple-600 transition-colors hover:text-purple-400"
                >
                    Back to sign in
                </button>
            </motion.div>
        </div>
    );
};

export default ResetSuccess;
