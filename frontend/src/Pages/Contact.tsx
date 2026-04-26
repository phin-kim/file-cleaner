import { Link } from 'react-router-dom';

export default function Contact() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-purple-500/30">
            {/* Top Navigation */}
            <nav className="container mx-auto px-6 py-6 flex items-center justify-between relative z-20">
                <Link to="/" className="flex items-center gap-2 font-black text-xl tracking-tight text-slate-900">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                        T
                    </div>
                    Tidy Up
                </Link>
                <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
                    <Link to="/" className="hover:text-purple-600 transition-colors">Home</Link>
                    <Link to="/how-it-works" className="hover:text-purple-600 transition-colors">How it works</Link>
                    <Link to="/pricing" className="hover:text-purple-600 transition-colors">Pricing</Link>
                </div>
                <div className="flex items-center gap-4 text-sm font-bold">
                    <Link to="/auth" className="text-slate-600 hover:text-purple-600 transition-colors">Sign in</Link>
                    <Link to="/auth" className="rounded-full bg-purple-600 px-5 py-2.5 text-white hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/20">Get started</Link>
                </div>
            </nav>

            <div className="mx-auto max-w-3xl px-6 py-20 space-y-16">
                <header className="space-y-4">
                    <h1 className="text-4xl font-black md:text-5xl tracking-tight text-slate-900">Contact us</h1>
                    <p className="text-slate-600 leading-relaxed max-w-2xl">
                        We read every message. For the fastest help, check the topics below, then write to us with your account email if the issue is account-specific.
                    </p>
                </header>

                <section className="rounded-2xl border border-purple-200 bg-purple-50 p-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-2">SUPPORT EMAIL</p>
                    <a href="mailto:support@tidyup.com" className="text-xl font-black text-purple-700 hover:underline">
                        support@tidyup.com
                    </a>
                    <p className="mt-4 text-sm text-purple-800/70">
                        We aim to respond within a few business days. Include what you were doing in the app if something broke.
                    </p>
                </section>

                <div className="space-y-12">
                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-900">Billing & wallet</h2>
                        
                        <div className="space-y-4">
                            <details className="group rounded-2xl border border-slate-200 bg-white p-6 [&_summary::-webkit-details-marker]:hidden">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-slate-900">
                                    What if my summary fails after I was charged?
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                                    If a run ends in a <strong>failed</strong> state, the system returns the charge to your wallet as a <strong>refund on that job</strong> so you are not out of pocket for a summary that did not complete. You can confirm movements under Wallet.
                                </p>
                            </details>

                            <details className="group rounded-2xl border border-slate-200 bg-white p-6 [&_summary::-webkit-details-marker]:hidden">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-slate-900">
                                    How do top-ups work? Are they instant?
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                                    You add KES to your in-app wallet using <strong>M-Pesa</strong> (STK push to the number you enter). When the payment is confirmed, your balance updates.
                                </p>
                            </details>

                            <details className="group rounded-2xl border border-slate-200 bg-white p-6 [&_summary::-webkit-details-marker]:hidden">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-slate-900">
                                    Where do I see rates and the charge before I go ahead?
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                                    On the upload flow, a <strong>confirm summary</strong> step shows the file, page or file count, the per-unit rate, the total, and your wallet balance before anything runs.
                                </p>
                            </details>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-900">Summaries & history</h2>
                        
                        <div className="space-y-4">
                            <details className="group rounded-2xl border border-slate-200 bg-white p-6 [&_summary::-webkit-details-marker]:hidden">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-slate-900">
                                    How do I start a new task?
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                                    After you sign in, open the relevant tool from the dashboard, choose a file, and complete the confirm step. You can then follow progress and open the result when the job finishes.
                                </p>
                            </details>

                            <details className="group rounded-2xl border border-slate-200 bg-white p-6 [&_summary::-webkit-details-marker]:hidden">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-slate-900">
                                    Where are my past tasks?
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                                    <strong>History</strong> lists your jobs with status, time, and actions such as open or download when the run completed.
                                </p>
                            </details>
                        </div>
                    </section>
                </div>
            </div>
            
            <footer className="pt-12 pb-8 border-t border-slate-200 text-center text-xs text-slate-500">
                <p>&copy; {new Date().getFullYear()} Tidy Up. Built for precision.</p>
            </footer>
        </div>
    );
}
