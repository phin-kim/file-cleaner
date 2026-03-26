import { motion } from 'framer-motion';
import { Folder, File, Search, HardDrive } from 'lucide-react';

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50">
            <div className="w-full max-w-md px-6 text-center">
                <div className="relative mb-8 flex justify-center">
                    {/* Background pulse */}
                    <motion.div
                        className="absolute inset-0 rounded-full bg-blue-100 opacity-20 blur-3xl"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.1, 0.3, 0.1],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />

                    {/* Animated Folder Icon */}
                    <motion.div
                        className="relative z-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="relative">
                            <motion.div
                                animate={{
                                    scale: [1, 1.05, 1],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            >
                                <Folder
                                    className="h-16 w-16 fill-blue-50 text-blue-600"
                                    strokeWidth={1.5}
                                />
                            </motion.div>

                            {/* Small floating icons */}
                            <motion.div
                                className="absolute -top-2 -right-2 rounded-lg border border-slate-100 bg-white p-1.5 shadow-md"
                                animate={{
                                    y: [0, -8, 0],
                                    rotate: [0, 10, 0],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                    delay: 0.5,
                                }}
                            >
                                <File className="h-4 w-4 text-slate-400" />
                            </motion.div>

                            <motion.div
                                className="absolute -bottom-1 -left-3 rounded-lg border border-slate-100 bg-white p-1.5 shadow-md"
                                animate={{
                                    y: [0, 5, 0],
                                    x: [0, -3, 0],
                                }}
                                transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                    delay: 1,
                                }}
                            >
                                <Search className="h-4 w-4 text-slate-400" />
                            </motion.div>
                        </div>
                    </motion.div>
                </div>

                {/* Text and Progress */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <h2 className="mb-2 text-xl font-semibold text-slate-900">
                        Organizing your workspace
                    </h2>
                    <p className="mb-6 text-sm text-slate-500">
                        Scanning directories and indexing files...
                    </p>

                    <div className="relative mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <motion.div
                            className="absolute top-0 bottom-0 w-1/3 rounded-full bg-blue-600"
                            animate={{
                                x: ['-100%', '300%'],
                            }}
                            transition={{
                                duration: 1.8,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    </div>

                    <div className="flex items-center justify-center gap-4 text-xs font-medium tracking-widest text-slate-400 uppercase">
                        <div className="flex items-center gap-1.5">
                            <HardDrive className="h-3 w-3" />
                            <span>SSD-01</span>
                        </div>
                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>v2.4.0</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
