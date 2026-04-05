import { motion } from 'framer-motion';
import useErrorStore from '../Store/ErrorStore';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../Store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type RegisterInput, registerSchema } from '../library/validatorSchema';
import handleApiError from '../utils/apiError';
import createClientLogger from '../utils/clientLogger';
import { FaShieldHalved } from 'react-icons/fa6';

const log = createClientLogger('AuthForm');
const AuthForm = () => {
    const { setError } = useErrorStore();
    log.debug(` what environment are we in ${import.meta.env}`);
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
            const res = await registerUser(data.email, data.password);
            log.info('User details sent to backend from the form', {
                data: data,
            });
            log.info(
                'Response from the register user function in the authstore',
                { data: res }
            );
            navigate('/');
        } catch (error) {
            log.error('Error sending the client info', { data: { error } });
            handleApiError(error, setError);
        }
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex min-h-150 flex-col overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/20 shadow-[0_32px_64px_rgba(0,0,0,0.2)] backdrop-blur-3xl md:flex-row"
                //className="flex min-h-150 flex-col overflow-hidden rounded-[2.5rem] border border-purple-100 bg-white shadow-2xl md:flex-row"
            >
                {/* Left Side - Brand & Illustration */}
                <div className="relative flex flex-col overflow-hidden bg-linear-to-br from-purple-600 to-violet-700 p-10 md:w-5/12">
                    <div className="z-10">
                        <div className="mb-12 flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl font-bold text-purple-600 shadow-lg">
                                T
                            </div>
                            <div className="text-white">
                                <p className="text-lg leading-none font-bold">
                                    Tidy Up
                                </p>
                                <p className="text-[10px] opacity-80">
                                    Intelligent Utilities
                                </p>
                            </div>
                        </div>

                        <h1 className="mb-6 text-4xl leading-tight font-bold tracking-tight text-white md:text-5xl">
                            Master Your Tasks With AI-Powered Utilities.
                        </h1>
                    </div>

                    {/* Abstract Illustration Placeholder */}
                    <div className="relative z-10 mt-auto flex justify-center">
                        <div className="relative h-64 w-64">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <div className="h-48 w-48 rounded-full bg-white/20 blur-3xl" />
                                <i className="fa-solid fa-rocket text-8xl text-white drop-shadow-2xl"></i>
                            </motion.div>
                            <div className="absolute top-0 right-0 h-12 w-12 animate-pulse rounded-full bg-yellow-300 opacity-30 blur-xl" />
                            <div className="absolute bottom-10 left-0 h-16 w-16 animate-pulse rounded-full bg-purple-300 opacity-30 blur-xl" />
                        </div>
                    </div>

                    {/* Background shapes */}
                    <div className="absolute top-[-10%] right-[-10%] h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute bottom-[-20%] left-[-20%] h-96 w-96 rounded-full bg-purple-900/40 blur-3xl" />
                </div>

                {/* Right Side - Form */}
                <div className="flex flex-col justify-center bg-purple-50/50 p-10 backdrop-blur-sm md:w-7/12 md:p-16">
                    <div className="mx-auto w-full max-w-md">
                        <div className="mb-10 flex items-center justify-between">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                                Get Started
                            </h2>
                        </div>

                        <form
                            onSubmit={handleSubmit(handleRegister)}
                            className="space-y-8"
                        >
                            <div className="relative">
                                <label className="mb-1 ml-1 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    {...register('email')}
                                    className="w-full border-b-2 border-purple-200 bg-transparent px-1 py-3 text-lg text-purple-900 transition-all outline-none placeholder:text-purple-200 focus:border-purple-600"
                                    placeholder="name@example.com"
                                />
                                {errors.email && (
                                    <p className="font-blod text-red-600">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            <div className="relative">
                                <label className="mb-1 ml-1 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        {...register('password')}
                                        className="w-full border-b-2 border-purple-200 bg-transparent px-1 py-3 text-lg text-purple-900 transition-all outline-none placeholder:text-purple-200 focus:border-purple-600"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        className="absolute top-1/2 right-2 -translate-y-1/2 text-purple-300 hover:text-purple-500"
                                    >
                                        <i className="fa-solid fa-eye-slash"></i>
                                    </button>
                                    {errors.password && (
                                        <p className="font-blod text-red-600">
                                            {errors.password.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-2xl bg-purple-600 px-6 py-5 text-lg font-bold text-white shadow-xl shadow-purple-500/30 transition-all hover:scale-[1.01] hover:bg-purple-700 active:scale-[0.99]"
                            >
                                {' '}
                                <span>
                                    {isSubmitting
                                        ? 'Registering ...'
                                        : 'Continue '}
                                </span>
                            </button>
                        </form>

                        <div className="mt-12 rounded-3xl border border-purple-100 bg-white/60 p-6 shadow-sm">
                            <div className="flex gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md">
                                    <FaShieldHalved />
                                </div>
                                <p className="text-xs leading-relaxed font-medium text-purple-900">
                                    <span className="mb-1 block font-bold tracking-wider text-purple-600 uppercase">
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
