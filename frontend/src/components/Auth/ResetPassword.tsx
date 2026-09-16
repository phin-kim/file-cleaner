import { useState } from 'react';
import { authClient } from '../../lib/auth-client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
    const navigate = useNavigate();
    const token = new URLSearchParams(window.location.search).get('token');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationError, setValidationError] = useState('');

    const resetMutation = useMutation({
        mutationFn: async () => {
            if (!token) {
                throw new Error('Invalid or missing reset token');
            }

            if (newPassword.length < 8) {
                throw new Error('Password must contain at least 8 characters');
            }

            if (newPassword !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            const response = await authClient.resetPassword({
                newPassword,
                token,
            });

            if (response.error) {
                throw new Error(
                    response.error.message || 'Unable to reset password'
                );
            }

            return response.data;
        },
        onError: (error) => {
            setValidationError(
                error instanceof Error
                    ? error.message
                    : 'Unable to reset password'
            );
        },
        onSuccess: () => {
            setValidationError('');
            navigate('/auth/login', {
                replace: true,
                state: { passwordReset: true },
            });
        },
    });

    const submitReset = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setValidationError('');
        resetMutation.mutate();
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
                <form onSubmit={submitReset} className="space-y-8">
                    <div className="space-y-3">
                        <label className="ml-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                required
                                minLength={8}
                                value={newPassword}
                                onChange={(event) =>
                                    setNewPassword(event.target.value)
                                }
                                placeholder="New password"
                                className="w-full border-b border-slate-200 bg-transparent px-1 py-3 text-lg text-slate-900 transition-colors outline-none focus:border-purple-600"
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowNewPassword((visible) => !visible)
                                }
                                aria-label={
                                    showNewPassword
                                        ? 'Hide new password'
                                        : 'Show new password'
                                }
                                className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 transition-colors hover:text-purple-600"
                            >
                                {showNewPassword ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="ml-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            Confirm Password
                        </label>
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            minLength={8}
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(event.target.value)
                            }
                            placeholder="Confirm new password"
                            className="w-full border-b border-slate-200 bg-transparent px-1 py-3 text-lg text-slate-900 transition-colors outline-none focus:border-purple-600"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowNewPassword((visible) => !visible)
                            }
                            aria-label={
                                showConfirmPassword
                                    ? 'Hide confirmed password'
                                    : 'Show confirmed password'
                            }
                            className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 transition-colors hover:text-purple-600"
                        >
                            {showConfirmPassword ? (
                                <EyeOff size={20} />
                            ) : (
                                <Eye size={20} />
                            )}
                        </button>
                    </div>
                    {validationError && (
                        <p className="text-sm text-rose-600">
                            {validationError}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={resetMutation.isPending}
                        className="w-full rounded-full bg-purple-600 py-4 text-lg font-bold text-white shadow-[0_0_20px_rgba(147,51,234,0.2)] transition-all hover:bg-purple-700 disabled:opacity-50"
                    >
                        {resetMutation.isPending
                            ? 'Updating...'
                            : 'Update password'}
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
