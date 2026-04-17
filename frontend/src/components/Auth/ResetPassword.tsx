import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    resetPasswordSchema,
    type ResetPasswordInput,
} from '../../library/validatorSchema';
import { useAuthStore } from '../../Store/authStore';
import useErrorStore from '../../Store/ErrorStore';
import handleApiError from '../../utils/apiError';
import { Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { setError } = useErrorStore();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const resetPassword = useAuthStore((state) => state.resetPassword);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async (data: ResetPasswordInput) => {
        if (!token) {
            setError(
                'Invalid or missing reset token. Please request a new link.'
            );
            return;
        }
        try {
            await resetPassword(token, data.password);
            // After successful reset, maybe redirect to login with a success message
            navigate('/auth', {
                state: {
                    message: 'Password updated successfully. Please sign in.',
                },
            });
        } catch (error) {
            handleApiError(error, setError);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 pt-16">
            <div className="mb-8 text-center">
                <span className="mb-4 block text-[10px] font-bold tracking-[0.2em] text-purple-600 uppercase">
                    Password Reset
                </span>
                <h1 className="mb-4 text-4xl font-bold text-slate-900">
                    Input a new password
                </h1>
                <p className="mx-auto max-w-sm text-sm text-slate-600">
                    Signed in for this step only. You will sign in again with
                    your new password.
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
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                {...register('password')}
                                className="w-full border-b border-slate-200 bg-transparent px-1 py-3 text-lg text-slate-900 transition-colors outline-none focus:border-purple-600"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 transition-colors hover:text-purple-600"
                            >
                                {showPassword ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 ml-1 text-xs text-red-500">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="ml-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            {...register('confirmPassword')}
                            className="w-full border-b border-slate-200 bg-transparent px-1 py-3 text-lg text-slate-900 transition-colors outline-none focus:border-purple-600"
                        />
                        {errors.confirmPassword && (
                            <p className="mt-1 ml-1 text-xs text-red-500">
                                {errors.confirmPassword.message}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-full bg-purple-600 py-4 text-lg font-bold text-white shadow-[0_0_20px_rgba(147,51,234,0.2)] transition-all hover:bg-purple-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Updating...' : 'Update password'}
                    </button>
                </form>
            </motion.div>

            <button
                onClick={() => navigate('/auth')}
                className="mt-8 text-sm font-medium text-slate-500 transition-colors hover:text-purple-600"
            >
                Back to sign in
            </button>
        </div>
    );
};

export default ResetPassword;
