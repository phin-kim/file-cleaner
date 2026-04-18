import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Files,
    Trash2,
    FolderTree,
    GraduationCap,
    Copy,
    FileCheck,
    Plus,
    Sparkles,
    ArrowRight,
} from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    const year = new Date().getFullYear();
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-32">
                <div className="relative z-10 container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="mb-6 inline-block rounded-full bg-purple-100 px-4 py-1.5 text-xs font-bold tracking-widest text-purple-600 uppercase">
                            AI-Powered Organization
                        </span>
                        <h1 className="mb-8 text-6xl font-black tracking-tighter text-slate-900 md:text-8xl">
                            Tidy Up Your <br />
                            <span className="text-purple-600">
                                Digital Life.
                            </span>
                        </h1>
                        <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-slate-600">
                            The ultimate workspace utility for students and
                            professionals. Organize files, remove duplicates,
                            and master your documents with precision.
                        </p>
                        <div className="flex flex-col justify-center gap-4 sm:flex-row">
                            <button
                                onClick={() => navigate('/auth')}
                                className="rounded-3xl bg-purple-600 px-10 py-5 font-bold text-white shadow-xl shadow-purple-500/20 transition-all hover:scale-105 hover:bg-purple-700"
                            >
                                Join Now Free
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Floating elements for visual interest */}
                <div className="absolute top-20 left-10 h-32 w-32 animate-pulse rounded-full bg-purple-200 opacity-30 blur-3xl" />
                <div className="absolute right-10 bottom-20 h-64 w-64 rounded-full bg-purple-300 opacity-20 blur-[100px]" />
            </section>

            {/* Features Grid */}
            <section className="bg-white py-24">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
                        {/* Feature 1: File Organization */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] border border-purple-100 bg-purple-50 text-purple-600 shadow-sm">
                                <FolderTree size={32} />
                            </div>
                            <div>
                                <h2 className="mb-4 text-4xl font-black tracking-tight text-slate-900">
                                    Smart Folder Cleanup
                                </h2>
                                <p className="text-lg leading-relaxed text-slate-600">
                                    Stop the chaos. Tidy Up analyzes your
                                    directories to find and eliminate hidden
                                    duplicates, instantly reclaim your storage
                                    space.
                                </p>
                            </div>
                            <ul className="space-y-4">
                                {[
                                    {
                                        icon: Trash2,
                                        text: 'Instant Duplicate Removal',
                                        color: 'text-red-500',
                                    },
                                    {
                                        icon: Files,
                                        text: 'Auto-sort into logical subfolders',
                                        color: 'text-blue-500',
                                    },
                                    {
                                        icon: FolderTree,
                                        text: 'Reclaim wasted storage space',
                                        color: 'text-green-500',
                                    },
                                ].map((item, i) => (
                                    <li
                                        key={i}
                                        className="group flex items-center gap-4 rounded-2xl border border-transparent bg-slate-50 p-4 transition-all hover:border-slate-100 hover:bg-white hover:shadow-md"
                                    >
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white ${item.color} border border-slate-100 shadow-sm`}
                                        >
                                            <item.icon size={20} />
                                        </div>
                                        <span className="font-bold text-slate-700">
                                            {item.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative rounded-[3rem] bg-slate-100 p-8"
                        >
                            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl">
                                <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-4">
                                    <span className="text-sm font-black tracking-widest text-slate-400 uppercase">
                                        Automation Preview
                                    </span>
                                    <div className="flex gap-2">
                                        <div className="h-3 w-3 rounded-full bg-red-400" />
                                        <div className="h-3 w-3 rounded-full bg-yellow-400" />
                                        <div className="h-3 w-3 rounded-full bg-green-400" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 rounded-2xl bg-blue-50 p-4 text-blue-600">
                                        <FileCheck size={20} />
                                        <span className="font-bold">
                                            Documents Folder Created
                                        </span>
                                        <span className="ml-auto text-xs font-black uppercase opacity-60">
                                            PDF, DOCX
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 rounded-2xl bg-purple-50 p-4 text-purple-600">
                                        <Sparkles size={20} />
                                        <span className="font-bold">
                                            Pictures Folder Created
                                        </span>
                                        <span className="ml-auto text-xs font-black uppercase opacity-60">
                                            PNG, JPG
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 rounded-2xl bg-red-50 p-4 text-red-600 opacity-50">
                                        <Trash2 size={20} />
                                        <span className="strike font-bold italic">
                                            34 Duplicate Files Removed
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Feature 2: Student PDF Merger */}
            <section className="relative overflow-hidden bg-slate-900 py-24 text-white">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="rounded-[3rem] border border-white/10 bg-white/10 p-10 backdrop-blur-md">
                                <div className="flex flex-col gap-6">
                                    {[2023, 2024, 2025].map((year) => (
                                        <div
                                            key={year}
                                            className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4"
                                        >
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 font-black">
                                                {year}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold">
                                                    Exam_Questions_{year}.pdf
                                                </p>
                                                <p className="mt-1 text-xs tracking-widest text-slate-400 uppercase">
                                                    Found 40 Questions
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-center py-4">
                                        <Plus
                                            className="animate-bounce text-purple-400"
                                            size={32}
                                        />
                                    </div>
                                    <div className="flex items-center gap-5 rounded-2xl bg-purple-600 p-6 shadow-2xl shadow-purple-500/40">
                                        <FileCheck size={32} />
                                        <div>
                                            <p className="text-xl font-black">
                                                Perfect_Study_Bank.pdf
                                            </p>
                                            <p className="mt-1 text-xs tracking-widest text-purple-100 uppercase">
                                                Unique Questions Only •
                                                Deduplicated
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] border border-white/10 bg-white/10 text-purple-400 shadow-sm">
                                <GraduationCap size={32} />
                            </div>
                            <div>
                                <h2 className="mb-4 text-4xl font-black tracking-tight">
                                    The Student Master Bank
                                </h2>
                                <p className="text-lg leading-relaxed text-slate-400">
                                    Stop wasting time on repetitive questions.
                                    Our proprietary engine identifies similar
                                    questions across multiple years and merges
                                    them into a single, high-signal study PDF.
                                </p>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600/20 text-purple-400">
                                        <FileCheck size={16} />
                                    </div>
                                    <div>
                                        <h4 className="mb-1 leading-none font-bold text-white">
                                            Smart Question Deduplication
                                        </h4>
                                        <p className="text-sm text-slate-500">
                                            Duplicate questions across years are
                                            merged into one entry with all
                                            relevant metadata.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600/20 text-purple-400">
                                        <Copy size={16} />
                                    </div>
                                    <div>
                                        <h4 className="mb-1 leading-none font-bold text-white">
                                            Multi-Year Consolidation
                                        </h4>
                                        <p className="text-sm text-slate-500">
                                            Merge past papers from 2020 to 2025
                                            into a single organized study
                                            companion.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/auth')}
                                className="inline-flex items-center gap-3 rounded-2xl bg-purple-600 px-8 py-4 font-bold text-white transition-all hover:gap-5 hover:bg-purple-700"
                            >
                                Join Study Program <ArrowRight size={20} />
                            </button>
                        </motion.div>
                    </div>
                </div>

                {/* Decorative background shape */}
                <div className="absolute top-1/2 left-1/2 -z-10 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/10 blur-[200px]" />
            </section>

            {/* Final CTA */}
            <section className="bg-slate-50 py-32">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="mb-8 text-5xl font-black tracking-tight text-slate-900">
                        Ready to Tidy Up?
                    </h2>
                    <p className="mx-auto mb-12 max-w-xl text-slate-500">
                        Join thousands of students and developers who use Tidy
                        Up to master their filesystem.
                    </p>
                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                        <button
                            onClick={() => navigate('/auth')}
                            className="rounded-[2rem] bg-slate-900 px-12 py-5 font-black text-white transition-all hover:bg-slate-800 active:scale-95"
                        >
                            Create Account
                        </button>
                    </div>
                </div>
            </section>

            <footer className="border-t border-slate-200 bg-white py-12">
                <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-6 md:flex-row">
                    <div className="flex items-center gap-1.5 opacity-50 grayscale">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                            <span className="font-black">T</span>
                        </div>
                        <span className="leading-none font-black tracking-tight text-slate-900">
                            idy Up
                        </span>
                    </div>
                    <p className="text-sm font-medium text-slate-400">
                        &copy; {year} Tidy Up. Built for precision.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
