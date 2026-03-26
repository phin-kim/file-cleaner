import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLayerGroup, FaBroom, FaFilePdf } from 'react-icons/fa6';
import FolderQuestionAnalyzer from './Merger';
import FolderCleanerUI from './Cleaner';
const AllTools: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'cleanup' | 'merge'>('cleanup');
    return (
        <div className="min-h-screen bg-linear-to-br from-purple-900 via-purple-800 to-indigo-900 p-8 text-slate-100">
            <div className="mx-auto mt-20 max-w-4xl space-y-8">
                <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-indigo-600 p-3">
                            <FaLayerGroup size={24} />
                        </div>
                        <h1 className="text-3xl font-bold">
                            All-in-One Dashboard
                        </h1>
                    </div>
                </div>
                {/* Toggle Switch */}
                <div className="flex rounded-2xl border border-white/5 bg-slate-900 p-1">
                    <button
                        onClick={() => setActiveTab('cleanup')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all duration-300 ${
                            activeTab === 'cleanup'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <FaBroom size={16} />
                        <span className="text-sm font-medium">Cleanup</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('merge')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all duration-300 ${
                            activeTab === 'merge'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <FaFilePdf size={16} />
                        <span className="text-sm font-medium">Merge</span>
                    </button>
                </div>
                <div className="relative min-h-125 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {activeTab === 'cleanup' ? (
                            <motion.div
                                key="cleanup"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="rounded-3xl border border-white/5 bg-slate-900/40 p-6"
                            >
                                <FolderCleanerUI />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="merge"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="rounded-3xl border border-white/5 bg-slate-900/40 p-6"
                            >
                                <FolderQuestionAnalyzer />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AllTools;
