import { Link } from 'react-router-dom';
import { Upload, Calculator, CreditCard, Download } from 'lucide-react';

const steps = [
    {
        title: 'Add your files',
        detail: 'Upload a chaotic folder for the Cleaner, or multiple PDFs for the Merger. We handle the heavy lifting of parsing and counting.',
        icon: Upload,
    },
    {
        title: 'Review counts',
        detail: 'We calculate exact file or page totals before doing any work. You will see the exact payable amount upfront.',
        icon: Calculator,
    },
    {
        title: 'Pay & process',
        detail: 'We deduct from your wallet balance. If you need more credit, an STK push top-up is instantly available.',
        icon: CreditCard,
    },
    {
        title: 'Download output',
        detail: 'Instantly download your cleanly organized folder structure or your perfectly merged PDF document.',
        icon: Download,
    },
];

export default function HowItWorks() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-purple-500/30">
            {/* Top Navigation */}
            <nav className="container mx-auto px-6 py-6 flex items-center justify-between relative z-20">
                <Link to="/" className="flex items-center gap-2 font-black text-xl tracking-tight text-slate-900">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-md shadow-purple-500/20">
                        T
                    </div>
                    Tidy Up
                </Link>
                <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
                    <Link to="/" className="hover:text-purple-600 transition-colors">Home</Link>
                    <Link to="/how-it-works" className="text-purple-600 transition-colors">How it works</Link>
                    <Link to="/pricing" className="hover:text-purple-600 transition-colors">Pricing</Link>
                </div>
                <div className="flex items-center gap-4 text-sm font-bold">
                    <Link to="/auth" className="text-slate-600 hover:text-purple-600 transition-colors">Sign in</Link>
                    <Link to="/auth" className="rounded-full bg-purple-600 px-5 py-2.5 text-white hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/20">Get started</Link>
                </div>
            </nav>

            <div className="mx-auto max-w-4xl px-6 py-20 space-y-24">
                
                {/* Header */}
                <header className="space-y-6 text-center">
                    <h1 className="text-4xl font-black md:text-5xl tracking-tight text-slate-900">How it works</h1>
                    <p className="mx-auto max-w-2xl text-sm text-slate-600 md:text-base leading-relaxed">
                        Clear steps from upload to final download. No surprises, no hidden fees.
                    </p>
                </header>

                {/* Timeline / Steps */}
                <section className="relative mx-auto max-w-3xl">
                    {/* Connecting Line */}
                    <div className="absolute left-[39px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-purple-200 via-purple-100 to-transparent hidden sm:block"></div>

                    <div className="space-y-12">
                        {steps.map((step, index) => (
                            <div key={step.title} className="relative flex flex-col sm:flex-row gap-8 items-start group">
                                {/* Step Number & Icon */}
                                <div className="flex items-center gap-6 sm:w-auto z-10">
                                    <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-purple-600 shadow-xl transition-transform group-hover:scale-105 group-hover:border-purple-300">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Step {index + 1}</span>
                                        <step.icon size={24} />
                                    </div>
                                </div>
                                
                                {/* Step Content */}
                                <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-8 hover:bg-slate-50 transition-colors mt-2 sm:mt-0 shadow-sm">
                                    <h2 className="text-xl font-bold text-slate-900">{step.title}</h2>
                                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                        {step.detail}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Final CTA */}
                <section className="relative overflow-hidden rounded-3xl bg-purple-600 p-10 text-center shadow-2xl shadow-purple-600/20 text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.2)_0%,_transparent_70%)]"></div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black tracking-tight">Ready to try it?</h3>
                        <p className="mx-auto mt-4 max-w-md text-sm text-purple-100 leading-relaxed">
                            Start with free starter credits and see the magic happen.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                to="/auth"
                                className="rounded-full bg-white px-8 py-3.5 text-sm font-bold text-purple-600 transition-transform hover:scale-105 shadow-md"
                            >
                                Get started free
                            </Link>
                            <Link
                                to="/"
                                className="rounded-full border border-purple-300 bg-purple-500/20 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-purple-500/40"
                            >
                                Back to home
                            </Link>
                        </div>
                    </div>
                </section>
                
                <footer className="pt-12 pb-8 border-t border-slate-200 text-center text-xs text-slate-500">
                    <p>&copy; {new Date().getFullYear()} Tidy Up. Built for precision.</p>
                </footer>
            </div>
        </div>
    );
}
