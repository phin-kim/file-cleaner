import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
//import { type LoginInput, loginSchema } from '../library/validatorSchema';

import {
    type RegisterInput,
    registerSchema,
} from '../../library/validatorSchema';
import { useAuthStore } from '../../Store/authStore';
import useErrorStore from '../../Store/ErrorStore';
import handleApiError from '../../utils/apiError';
import createClientLogger from '../../utils/clientLogger';
import { useNavigate } from 'react-router-dom';

const log = createClientLogger('LoginForm');

interface LoginFormProps {
    onToggle: () => void;
}

const LoginForm = ({ onToggle }: LoginFormProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const { setError } = useErrorStore();
    const navigate = useNavigate();
    const loginUser = useAuthStore((state) => state.login);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterInput) => {
        try {
            const res = await loginUser(data.email, data.password);
            log.info('Login successful', { data: res });
            navigate('/home');
        } catch (error) {
            log.error('Login error', { data: { error } });

            //handleApiError(error, setError);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="mb-10 flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                    Welcome Back
                </h2>
                <button
                    onClick={onToggle}
                    className="text-sm font-semibold text-purple-600 transition-colors hover:text-purple-700"
                >
                    Create account
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="relative">
                    <label className="mb-1 ml-1 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                        Email Address
                    </label>
                    <input
                        type="email"
                        {...register('email')}
                        className="w-full border-b-2 border-purple-200 bg-transparent px-1 py-3 text-lg text-purple-900 transition-all outline-none placeholder:text-purple-200 focus:border-purple-600"
                        placeholder="name@example.com"
                    />
                    {errors.email && (
                        <p className="mt-1 text-sm font-bold text-red-600">
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
                            type={showPassword ? 'text' : 'password'}
                            {...register('password')}
                            className="w-full border-b-2 border-purple-200 bg-transparent px-1 py-3 text-lg text-purple-900 transition-all outline-none placeholder:text-purple-200 focus:border-purple-600"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute top-1/2 right-2 -translate-y-1/2 text-purple-300 hover:text-purple-500"
                        >
                            {showPassword ? (
                                <EyeOff size={20} />
                            ) : (
                                <Eye size={20} />
                            )}
                        </button>
                    </div>
                    <div className="mt-2 flex justify-end">
                        <button
                            type="button"
                            onClick={() => navigate('/auth/forgot-password')}
                            className="text-xs font-semibold text-purple-400 transition-colors hover:text-purple-600"
                        >
                            Forgot password?
                        </button>
                    </div>
                    {errors.password && (
                        <p className="mt-1 text-sm font-bold text-red-600">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-purple-600 px-6 py-5 text-lg font-bold text-white shadow-xl shadow-purple-500/30 transition-all hover:scale-[1.01] hover:bg-purple-700 active:scale-[0.99] disabled:opacity-70"
                >
                    <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
                </button>
            </form>

            <div className="mt-12 rounded-3xl border border-purple-100 bg-white/60 p-6 shadow-sm">
                <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md">
                        <ShieldCheck size={20} />
                    </div>
                    <div className="text-xs leading-relaxed font-medium text-purple-900">
                        <span className="mb-1 block font-bold tracking-wider text-purple-600 uppercase">
                            Secure Access
                        </span>
                        Your credentials are encrypted and never shared. We
                        prioritize your account security.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
