import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Rocket, ArrowLeft } from 'lucide-react';
import LoginForm from '../components/Login';
import RegisterForm from '../components/Register';
import { useAuthStore } from '../Store/authStore';
import NotFound from '../components/NotFound';

const AuthForm = () => {
    const [isLogin, setIsLogin] = useState(false);
    const navigate = useNavigate();
    const notFound = useAuthStore((state) => state.notFound);
    const setNotFound = useAuthStore((state) => state.setNotFound);
    if (notFound) {
        return <NotFound onClose={() => setNotFound(false)} />;
    }
    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex min-h-150 flex-col overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/20 shadow-[0_32px_64px_rgba(0,0,0,0.2)] backdrop-blur-3xl md:flex-row"
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
                            {isLogin
                                ? 'Welcome Back to Your Workspace.'
                                : 'Master Your Tasks With AI-Powered Utilities.'}
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
                                <Rocket className="h-32 w-32 text-white drop-shadow-2xl" />
                            </motion.div>
                            <div className="absolute top-0 right-0 h-12 w-12 animate-pulse rounded-full bg-yellow-300 opacity-30 blur-xl" />
                            <div className="absolute bottom-10 left-0 h-16 w-16 animate-pulse rounded-full bg-purple-300 opacity-30 blur-xl" />
                        </div>
                    </div>

                    {/* Background shapes */}
                    <div className="absolute top-[-10%] right-[-10%] h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute bottom-[-20%] left-[-20%] h-96 w-96 rounded-full bg-purple-900/40 blur-3xl" />
                </div>

                {/* Right Side - Form Container */}
                <div className="flex flex-col justify-center bg-purple-50/50 p-10 backdrop-blur-sm md:w-7/12 md:p-16">
                    <div className="mx-auto w-full max-w-md">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLogin ? 'login' : 'register'}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {isLogin ? (
                                    <LoginForm
                                        onToggle={() => setIsLogin(false)}
                                    />
                                ) : (
                                    <RegisterForm
                                        onToggle={() => setIsLogin(true)}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthForm;
