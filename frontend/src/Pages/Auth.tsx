import { useState } from 'react';
import { motion } from 'framer-motion';
import useErrorStore from '../Store/ErrorStore';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../Store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type RegisterInput, registerSchema } from '../library/validatorSchema';
import handleApiError from '../utils/apiError';

const AuthForm = () => {
    const { setError } = useErrorStore();
    const navigate = useNavigate();
    const registerUser = useAuthStore((state) => state.register);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
    });
    const handleRegister = async (data: RegisterInput) => {
        try {
            await registerUser(data.email, data.password);
            navigate('/');
        } catch (error) {
            handleApiError(error, setError);
        }
    };

    return (
        <div className="max-w-5xl px-4 py-8 mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex min-h-150 flex-col overflow-hidden rounded-[2.5rem] border border-purple-100 bg-white shadow-2xl md:flex-row"
            >
                {/* Left Side - Brand & Illustration */}
                <div className="relative flex flex-col p-10 overflow-hidden bg-linear-to-br from-purple-600 to-violet-700 md:w-5/12">
                    <div className="z-10">
                        <div className="flex items-center gap-2 mb-12">
                            <div className="flex items-center justify-center w-10 h-10 text-xl font-bold text-purple-600 bg-white shadow-lg rounded-xl">
                                T
                            </div>
                            <div className="text-white">
                                <p className="text-lg font-bold leading-none">
                                    TaskStream
                                </p>
                                <p className="text-[10px] opacity-80">
                                    Intelligent Utilities
                                </p>
                            </div>
                        </div>

                        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
                            Master Your Tasks With AI-Powered Utilities.
                        </h1>
                    </div>

                    {/* Abstract Illustration Placeholder */}
                    <div className="relative z-10 flex justify-center mt-auto">
                        <div className="relative w-64 h-64">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <div className="w-48 h-48 rounded-full bg-white/20 blur-3xl" />
                                <i className="text-white fa-solid fa-rocket text-8xl drop-shadow-2xl"></i>
                            </motion.div>
                            <div className="absolute top-0 right-0 w-12 h-12 bg-yellow-300 rounded-full animate-pulse opacity-30 blur-xl" />
                            <div className="absolute left-0 w-16 h-16 bg-purple-300 rounded-full bottom-10 animate-pulse opacity-30 blur-xl" />
                        </div>
                    </div>

                    {/* Background shapes */}
                    <div className="absolute top-[-10%] right-[-10%] h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute bottom-[-20%] left-[-20%] h-96 w-96 rounded-full bg-purple-900/40 blur-3xl" />
                </div>

                {/* Right Side - Form */}
                <div className="flex flex-col justify-center p-10 bg-purple-50/50 backdrop-blur-sm md:w-7/12 md:p-16">
                    <div className="w-full max-w-md mx-auto">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-3xl font-bold tracking-tight text-purple-950">
                                Get Started
                            </h2>
                            <span className="text-xs font-medium text-purple-400">
                                English(USA){' '}
                                <i className="fa-solid fa-chevron-down ml-1 text-[10px]"></i>
                            </span>
                        </div>

                        <form
                            onSubmit={handleSubmit(handleRegister)}
                            className="space-y-8"
                        >
                            <div className="relative">
                                <label className="block mb-1 ml-1 text-xs font-bold tracking-wider text-purple-400 uppercase">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    {...register('email')}
                                    className="w-full px-1 py-3 text-lg text-purple-900 transition-all bg-transparent border-b-2 border-purple-200 outline-none placeholder:text-purple-200 focus:border-purple-600"
                                    placeholder="name@example.com"
                                />
                                {errors.email && (
                                    <p className="text-red-600 font-blod">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            <div className="relative">
                                <label className="block mb-1 ml-1 text-xs font-bold tracking-wider text-purple-400 uppercase">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        {...register('password')}
                                        className="w-full px-1 py-3 text-lg text-purple-900 transition-all bg-transparent border-b-2 border-purple-200 outline-none placeholder:text-purple-200 focus:border-purple-600"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        className="absolute text-purple-300 -translate-y-1/2 top-1/2 right-2 hover:text-purple-500"
                                    >
                                        <i className="fa-solid fa-eye-slash"></i>
                                    </button>
                                    {errors.password && (
                                        <p className="text-red-600 font-blod">
                                            {errors.password.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3 py-2">
                                <div className="mt-1">
                                    <input
                                        type="checkbox"
                                        required
                                        className="w-4 h-4 text-purple-600 bg-white border-purple-300 rounded focus:ring-purple-500"
                                    />
                                </div>
                                <p className="text-xs leading-relaxed text-purple-900/60">
                                    I agree to the{' '}
                                    <span className="font-semibold text-purple-600 cursor-pointer hover:underline">
                                        terms of service
                                    </span>{' '}
                                    and{' '}
                                    <span className="font-semibold text-purple-600 cursor-pointer hover:underline">
                                        privacy policy
                                    </span>
                                    .
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-2xl bg-purple-600 px-6 py-5 text-lg font-bold text-white shadow-xl shadow-purple-500/30 transition-all hover:scale-[1.01] hover:bg-purple-700 active:scale-[0.99]"
                            >
                                {' '}
                                <span>
                                    {isSubmitting
                                        ? 'Continue ...'
                                        : 'Registering...'}
                                </span>
                            </button>
                        </form>

                        <div className="p-6 mt-12 border border-purple-100 shadow-sm rounded-3xl bg-white/60">
                            <div className="flex gap-4">
                                <div className="flex items-center justify-center w-10 h-10 text-white bg-purple-600 shadow-md shrink-0 rounded-xl">
                                    <i className="fa-solid fa-shield-halved"></i>
                                </div>
                                <p className="text-xs font-medium leading-relaxed text-purple-900">
                                    <span className="block mb-1 font-bold tracking-wider text-purple-600 uppercase">
                                        Privacy First
                                    </span>
                                    We only use your email to identify who is
                                    subscribed and who is not. Your data remains
                                    private and secure.
                                </p>
                            </div>
                        </div>

                        {/*<div className="mt-10 text-center">
                            <button
                                onClick={onBack}
                                className="flex items-center justify-center gap-2 mx-auto text-sm font-bold text-purple-400 transition-colors hover:text-purple-600"
                            >
                                <i className="text-xs fa-solid fa-arrow-left"></i>
                                Back to Dashboard
                            </button>
                        </div>*/}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthForm;
