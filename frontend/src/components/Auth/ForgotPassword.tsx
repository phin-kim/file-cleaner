import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    forgotPasswordSchema,
    type ForgotPasswordInput,
} from '../../library/validatorSchema';
import { useAuthStore } from '../../Store/authStore';
import useErrorStore from '../../Store/ErrorStore';
import handleApiError from '../../utils/apiError';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { requestPasswordReset } = useAuthStore();
    const { setError } = useErrorStore();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordInput) => {
        try {
            await requestPasswordReset(data.email);
            navigate('/auth/reset-success', { state: { email: data.email } });
        } catch (error) {
            handleApiError(error, setError);
        }
    };

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
                    We'll email you a secure link to input a new password
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="space-y-3">
                        <label className="ml-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            Email
                        </label>
                        <input
                            {...register('email')}
                            placeholder="name@example.com"
                            className="w-full border-b border-slate-200 bg-transparent px-1 py-3 text-lg text-slate-900 transition-colors outline-none placeholder:text-slate-200 focus:border-purple-600"
                        />
                        {errors.email && (
                            <p className="mt-1 ml-1 text-xs text-red-500">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-full bg-purple-600 py-4 text-lg font-bold text-white shadow-[0_0_20px_rgba(147,51,234,0.2)] transition-all hover:bg-purple-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Sending...' : 'Send reset link'}
                    </button>
                </form>
            </motion.div>

            <button
                onClick={() => navigate('/auth')}
                className="mt-8 text-sm font-medium text-slate-500 transition-colors hover:text-purple-600"
            >
                Return to sign in
            </button>
        </div>
    );
};

export default ForgotPassword;
