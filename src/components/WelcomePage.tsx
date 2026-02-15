import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaMagic } from 'react-icons/fa';
import { FaBroom, FaFilePdf } from 'react-icons/fa6';
const WelcomeModal: React.FC = () => {
    const navigate = useNavigate();
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    //onClick={onClose}
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-linear-to-br from-purple-600 to-violet-800 shadow-2xl"
                >
                    <div className="p-8 text-center sm:p-12">
                        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-purple-500 to-blue-600 text-3xl text-white shadow-xl shadow-black/30">
                            <FaMagic />
                        </div>
                        <h2 className="mb-2 text-3xl font-extrabold text-slate-100">
                            Welcome to Tidy Up
                        </h2>
                        <p className="mb-10 text-lg text-slate-200">
                            What would you like to do today?
                        </p>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <button
                                onClick={() => navigate('/folder-cleanup')}
                                className="group relative flex flex-col items-center rounded-3xl bg-[#3939391a] p-8 backdrop-blur-3xl transition-all duration-300 hover:border-indigo-200 hover:bg-[#17171770] hover:shadow-xl hover:shadow-indigo-500/10"
                            >
                                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl text-indigo-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white">
                                    <FaBroom />
                                </div>
                                <h3 className="mb-1 font-bold text-slate-100">
                                    Clean up files
                                </h3>
                                <p className="text-center text-xs text-slate-100">
                                    AI-powered folder organization and renaming
                                    strategies.
                                </p>
                            </button>

                            <button
                                onClick={() => navigate('/file-merge')}
                                className="group relative flex flex-col items-center rounded-3xl bg-[#3939391a] p-8 backdrop-blur-3xl transition-all duration-300 hover:border-purple-200 hover:bg-[#17171770] hover:shadow-xl hover:shadow-purple-500/10"
                            >
                                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-2xl text-purple-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white">
                                    <FaFilePdf />
                                </div>
                                <h3 className="mb-1 font-bold text-slate-100">
                                    Merge Questions
                                </h3>
                                <p className="text-center text-xs text-slate-100">
                                    Compile multiple text questions into a
                                    single clean PDF.
                                </p>
                            </button>
                        </div>
                    </div>

                    <div className="bg-linear-tobr border-t border-slate-100 from-purple-300 to-violet-500 p-4 text-center">
                        <p className="text-xs text-white italic">
                            Efficiency meets simplicity.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default WelcomeModal;
