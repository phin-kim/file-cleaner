import useErrorStore from '../../Store/ErrorStore';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../Store/authStore';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    type RegisterInput,
    registerSchema,
} from '../../library/validatorSchema';
import handleApiError from '../../utils/apiError';
import createClientLogger from '../../utils/clientLogger';
import { FaShieldHalved } from 'react-icons/fa6';
import { Eye, EyeOff } from 'lucide-react';

interface RegisterFormProps {
    onToggle: () => void;
}
const log = createClientLogger('AuthForm');
const RegistrationForm = ({ onToggle }: RegisterFormProps) => {
    const [showPassword, setShowPassword] = useState(false);

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
            const res = await registerUser(data.email, data.password);
            log.info('User details sent to backend from the form', {
                data: data,
            });
            log.info(
                'Response from the register user function in the authstore',
                { data: res }
            );
            navigate('/home');
        } catch (error) {
            log.error('Error sending the client info', { data: { error } });
            handleApiError(error, setError);
        }
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="mb-10 flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                    Get Started
                </h2>
                <button
                    onClick={onToggle}
                    className="text-sm font-semibold text-purple-600 transition-colors hover:text-purple-700"
                >
                    Log in instead
                </button>
            </div>
            <form onSubmit={handleSubmit(handleRegister)} className="space-y-8">
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
                        <p className="font-bold text-red-600">
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
                        {errors.password && (
                            <p className="font-bold text-red-600">
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
                        {isSubmitting ? 'Registering ...' : 'Continue '}
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
                        We only use your email to identify who is subscribed and
                        who is not. Your data remains private and secure.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegistrationForm;
