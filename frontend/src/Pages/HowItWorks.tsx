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
        <div className="min-h-screen bg-[#0A0A0A] px-6 py-20 text-white font-sans">
            <div className="mx-auto max-w-4xl space-y-24">
                
                {/* Header */}
                <header className="space-y-6 text-center">
                    <h1 className="text-4xl font-black md:text-5xl tracking-tight">How it works</h1>
                    <p className="mx-auto max-w-2xl text-sm text-slate-400 md:text-base leading-relaxed">
                        Clear steps from upload to final download. No surprises, no hidden fees.
                    </p>
                </header>

                {/* Timeline / Steps */}
                <section className="relative mx-auto max-w-3xl">
                    {/* Connecting Line */}
                    <div className="absolute left-[39px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-purple-500/50 via-purple-500/20 to-transparent hidden sm:block"></div>

                    <div className="space-y-12">
                        {steps.map((step, index) => (
                            <div key={step.title} className="relative flex flex-col sm:flex-row gap-8 items-start group">
                                {/* Step Number & Icon */}
                                <div className="flex items-center gap-6 sm:w-auto z-10">
                                    <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#121212] text-purple-400 shadow-xl transition-transform group-hover:scale-105 group-hover:border-purple-500/30">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Step {index + 1}</span>
                                        <step.icon size={24} />
                                    </div>
                                </div>
                                
                                {/* Step Content */}
                                <div className="flex-1 rounded-2xl border border-white/5 bg-[#121212] p-8 hover:bg-[#151515] transition-colors mt-2 sm:mt-0">
                                    <h2 className="text-xl font-bold text-slate-200">{step.title}</h2>
                                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                                        {step.detail}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Final CTA */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/40 to-slate-900 p-10 text-center border border-purple-500/20">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent opacity-50"></div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black tracking-tight text-white">Ready to try it?</h3>
                        <p className="mx-auto mt-4 max-w-md text-sm text-purple-200/70 leading-relaxed">
                            Start with free starter credits and see the magic happen.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                to="/auth"
                                className="rounded-full bg-white px-8 py-3.5 text-sm font-bold text-slate-900 transition-transform hover:scale-105"
                            >
                                Get started free
                            </Link>
                            <Link
                                to="/"
                                className="rounded-full border border-white/20 bg-black/20 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                            >
                                Back to home
                            </Link>
                        </div>
                    </div>
                </section>
                
                <footer className="pt-12 pb-8 border-t border-white/5 text-center text-xs text-slate-600">
                    <p>&copy; {new Date().getFullYear()} Tidy Up. Built for precision.</p>
                </footer>
            </div>
        </div>
    );
}
