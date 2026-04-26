import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
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
    Play
} from 'lucide-react';
import { useAuthStore } from '../Store/authStore';

const AuthenticatedHome = () => {
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
                        
                        {/* Action buttons for logged in user */}
                        <div className="flex flex-col justify-center gap-4 sm:flex-row">
                            <button
                                onClick={() => navigate('/folder-cleaner')}
                                className="rounded-3xl bg-purple-600 px-10 py-5 font-bold text-white shadow-xl shadow-purple-500/20 transition-all hover:scale-105 hover:bg-purple-700"
                            >
                                Open Folder Cleaner
                            </button>
                            <button
                                onClick={() => navigate('/file-merger')}
                                className="rounded-3xl bg-white border border-slate-200 px-10 py-5 font-bold text-slate-700 shadow-sm transition-all hover:scale-105 hover:bg-slate-50"
                            >
                                Open File Merger
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
                            <div className="flex h-16 w-16 items-center justify-center rounded-4xl border border-purple-100 bg-purple-50 text-purple-600 shadow-sm">
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
                            <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-2xl">
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
                                            Folder Cleaner Preview
                                        </span>
                                        <span className="ml-auto text-xs font-black uppercase opacity-60">
                                            1.5 KES / file
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 rounded-2xl bg-purple-50 p-4 text-purple-600">
                                        <Sparkles size={20} />
                                        <span className="font-bold">
                                            File Merger Preview
                                        </span>
                                        <span className="ml-auto text-xs font-black uppercase opacity-60">
                                            2.5 KES / page
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
                            <div className="rounded-[3rem] border border-white/10 bg-white/10 p-6 backdrop-blur-md">
                                <div className="flex flex-col gap-6">
                                    {[2023, 2024, 2025].map((year) => (
                                        <div
                                            key={year}
                                            className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4"
                                        >
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 px-1 font-black">
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
                            <div className="flex h-16 w-16 items-center justify-center rounded-4xl border border-white/10 bg-white/10 text-purple-400 shadow-sm">
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
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const UnauthenticatedHome = () => {
    const navigate = useNavigate();
    const year = new Date().getFullYear();

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-purple-500/30">
            {/* Nav simulation for unauthenticated users, if you don't have a global nav */}
            <nav className="container mx-auto px-6 py-6 flex items-center justify-between relative z-20">
                <div className="flex items-center gap-2 font-black text-xl tracking-tight">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]">
                        T
                    </div>
                    Tidy Up
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-400">
                    <Link to="/how-it-works" className="hover:text-white transition-colors">How it works</Link>
                    <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                </div>
                <div className="flex items-center gap-4 text-sm font-bold">
                    <Link to="/auth" className="text-slate-300 hover:text-white transition-colors">Sign in</Link>
                    <Link to="/auth" className="rounded-full bg-purple-600 px-5 py-2.5 text-white hover:bg-purple-500 transition-colors shadow-[0_0_20px_rgba(147,51,234,0.3)]">Get started</Link>
                </div>
            </nav>

            {/* Premium Dark Hero Section */}
            <section className="relative pt-24 pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-[#0A0A0A] to-[#0A0A0A]"></div>
                
                <div className="container mx-auto px-6 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-4xl mx-auto space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-bold text-purple-300">
                            <Sparkles size={14} />
                            <span>Precision workspace tools</span>
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-tight">
                            Organize your chaotic files.<br className="hidden md:block"/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                                Merge your study materials.
                            </span>
                        </h1>
                        
                        <p className="mx-auto max-w-2xl text-lg text-slate-400 leading-relaxed">
                            Turn dense, chaotic folders into perfectly organized structures. Merge multiple PDFs into single, deduplicated master files. Pay only for what you process.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <button
                                onClick={() => navigate('/auth')}
                                className="w-full sm:w-auto rounded-full bg-white px-8 py-4 text-sm font-black text-black transition-transform hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
                            >
                                <Play size={16} className="fill-black" />
                                Start organizing now
                            </button>
                            <button
                                onClick={() => navigate('/how-it-works')}
                                className="w-full sm:w-auto rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-white/10"
                            >
                                See how it works
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Value Props */}
            <section className="py-24 border-t border-white/5 relative bg-[#0C0C0C]">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        
                        {/* Tool 1 */}
                        <div className="rounded-3xl border border-white/10 bg-[#121212] p-8 lg:p-10 hover:border-purple-500/30 transition-colors group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <FolderTree size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="mb-6 inline-flex rounded-2xl bg-purple-500/20 p-4 text-purple-400">
                                    <FolderTree size={24} />
                                </div>
                                <h3 className="text-2xl font-black mb-4">Folder Cleaner</h3>
                                <p className="text-slate-400 leading-relaxed mb-8">
                                    Stop hoarding duplicates. Upload a chaotic folder, and we'll analyze, deduplicate, and organize your files into logical subfolders automatically.
                                </p>
                                <ul className="space-y-3">
                                    {['Identifies identical files', 'Sorts by file type', 'Calculates exact cost upfront'].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                                            <div className="rounded-full bg-purple-500/20 p-1 text-purple-400">
                                                <FileCheck size={12} />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Tool 2 */}
                        <div className="rounded-3xl border border-white/10 bg-[#121212] p-8 lg:p-10 hover:border-indigo-500/30 transition-colors group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Copy size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="mb-6 inline-flex rounded-2xl bg-indigo-500/20 p-4 text-indigo-400">
                                    <Copy size={24} />
                                </div>
                                <h3 className="text-2xl font-black mb-4">File Merger</h3>
                                <p className="text-slate-400 leading-relaxed mb-8">
                                    Built for students. Merge past papers and notes into a single master PDF. We identify duplicate questions across years to save you study time.
                                </p>
                                <ul className="space-y-3">
                                    {['Merges multiple PDFs', 'Deduplicates questions', 'Billed transparently per page'].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                                            <div className="rounded-full bg-indigo-500/20 p-1 text-indigo-400">
                                                <FileCheck size={12} />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-32 relative">
                <div className="container mx-auto px-6">
                    <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#1A1025] to-[#0A0A0A] border border-purple-500/20 p-12 md:p-20 text-center">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent"></div>
                        
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-black mb-6">Experience the magic firsthand.</h2>
                            <p className="max-w-xl mx-auto text-purple-200/60 mb-10">
                                Join today and get starter credits. Run a folder or merge PDFs and see exactly how Tidy Up works before paying a dime.
                            </p>
                            <button
                                onClick={() => navigate('/auth')}
                                className="rounded-full bg-purple-600 px-10 py-4 font-bold text-white shadow-[0_0_30px_rgba(147,51,234,0.4)] transition-transform hover:scale-105"
                            >
                                Get started for free
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/5 py-12">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 font-black text-xl tracking-tight text-white/50">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/50">
                            T
                        </div>
                        Tidy Up
                    </div>
                    <div className="flex gap-6 text-sm font-bold text-slate-500">
                        <Link to="/privacy" className="hover:text-slate-300">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-slate-300">Terms of Service</Link>
                    </div>
                    <p className="text-sm font-bold text-slate-600">
                        &copy; {year} Tidy Up.
                    </p>
                </div>
            </footer>
        </div>
    );
};

const LandingPage = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    
    if (isAuthenticated) {
        return <AuthenticatedHome />;
    }
    
    return <UnauthenticatedHome />;
};

export default LandingPage;
