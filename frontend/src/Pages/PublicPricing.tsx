import { Link } from 'react-router-dom';
import { MERGER_COST_PER_PAGE_KES } from '../constants/mergerPricing';
import { CLEANER_COST_PER_FILE_KES } from '../constants/cleanerPricing';
import { Wallet, FileText, Eye, Gift, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function PublicPricing() {
    const [units, setUnits] = useState(20);
    const [docType, setDocType] = useState<'cleaner' | 'merger'>('cleaner');
    
    const rate = docType === 'cleaner' ? CLEANER_COST_PER_FILE_KES : MERGER_COST_PER_PAGE_KES;
    const chargeableAmount = units * rate;
    const walletBalance = 60; // Mock balance
    const afterDeduction = walletBalance - chargeableAmount;

    return (
        <div className="min-h-screen bg-[#0A0A0A] px-6 py-20 text-white font-sans">
            <div className="mx-auto max-w-5xl space-y-24">
                
                {/* Header */}
                <header className="space-y-6 text-center">
                    <h1 className="text-4xl font-black md:text-5xl tracking-tight">Simple, transparent pricing</h1>
                    <p className="mx-auto max-w-2xl text-sm text-slate-400 md:text-base leading-relaxed">
                        No monthly plans - just your wallet, clear per-file pricing, and a confirm step that matches what you will see in the app.
                    </p>
                </header>

                {/* At a glance section */}
                <section className="space-y-10">
                    <div className="text-center">
                        <h2 className="text-xl font-bold">At a glance</h2>
                        <p className="mt-2 text-xs text-slate-500 uppercase tracking-widest">The core ideas - in short form.</p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <article className="rounded-2xl border border-white/5 bg-[#121212] p-6 hover:bg-[#151515] transition-colors">
                            <div className="mb-4 inline-flex rounded-xl bg-purple-500/10 p-3 text-purple-400">
                                <Wallet size={20} />
                            </div>
                            <h3 className="mb-2 text-sm font-bold text-slate-200">Wallet, not plans</h3>
                            <p className="text-xs leading-relaxed text-slate-400">
                                Top up in KES when you need to. We deduct per job, so you are never locked into a subscription.
                            </p>
                        </article>
                        <article className="rounded-2xl border border-white/5 bg-[#121212] p-6 hover:bg-[#151515] transition-colors">
                            <div className="mb-4 inline-flex rounded-xl bg-purple-500/10 p-3 text-purple-400">
                                <FileText size={20} />
                            </div>
                            <h3 className="mb-2 text-sm font-bold text-slate-200">Per file or per page</h3>
                            <p className="text-xs leading-relaxed text-slate-400">
                                Folder Cleaner is billed by file. File Merger is billed by page. The unit always matches the file you upload.
                            </p>
                        </article>
                        <article className="rounded-2xl border border-white/5 bg-[#121212] p-6 hover:bg-[#151515] transition-colors">
                            <div className="mb-4 inline-flex rounded-xl bg-purple-500/10 p-3 text-purple-400">
                                <Eye size={20} />
                            </div>
                            <h3 className="mb-2 text-sm font-bold text-slate-200">See the charge first</h3>
                            <p className="text-xs leading-relaxed text-slate-400">
                                Before processing, a confirmation step shows unit count, rate, and total so you can proceed on purpose.
                            </p>
                        </article>
                        <article className="rounded-2xl border border-white/5 bg-[#121212] p-6 hover:bg-[#151515] transition-colors">
                            <div className="mb-4 inline-flex rounded-xl bg-purple-500/10 p-3 text-purple-400">
                                <Gift size={20} />
                            </div>
                            <h3 className="mb-2 text-sm font-bold text-slate-200">Free starter credit</h3>
                            <p className="text-xs leading-relaxed text-slate-400">
                                New accounts get about 100 units of processing to try a real file at the current per-unit rate.
                            </p>
                        </article>
                    </div>
                </section>

                {/* Interactive Preview */}
                <section className="space-y-10">
                    <div className="text-center flex flex-col items-center">
                        <div className="mb-4 inline-flex rounded-full bg-purple-500/10 p-2 text-purple-400">
                            <Sparkles size={16} />
                        </div>
                        <h2 className="text-xl font-bold">Try the interactive preview</h2>
                        <p className="mt-2 text-xs text-slate-500 max-w-md leading-relaxed">
                            Adjust units and see the same line items as in the confirm summary step.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
                        {/* Interactive Controls */}
                        <div className="rounded-2xl border border-white/10 bg-[#121212] p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-bold mb-1">Billing preview</h3>
                                <p className="text-xs text-slate-500">Illustrative only - assuming <span className="text-purple-400 font-bold">{rate} KES</span> per unit.</p>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Number of units</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={units}
                                    onChange={(e) => setUnits(Number(e.target.value) || 0)}
                                    className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm text-white focus:border-purple-500 focus:outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Document Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setDocType('cleaner')}
                                        className={`rounded-xl border p-3 text-xs font-bold transition-all ${docType === 'cleaner' ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                                    >
                                        Folder Cleaner (files)
                                    </button>
                                    <button 
                                        onClick={() => setDocType('merger')}
                                        className={`rounded-xl border p-3 text-xs font-bold transition-all ${docType === 'merger' ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                                    >
                                        File Merger (pages)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="rounded-2xl border border-white/10 bg-[#121212] p-6 flex flex-col">
                            <div>
                                <h3 className="text-sm font-bold mb-1">Confirm summary</h3>
                                <p className="text-xs text-slate-500">Check length and cost before your file is processed.</p>
                            </div>

                            <div className="mt-8 flex-1 space-y-4 text-sm">
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-400">File</span>
                                    <span className="font-medium text-slate-200">example.{docType === 'cleaner' ? 'zip' : 'pdf'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-400">No. of {docType === 'cleaner' ? 'Files' : 'Pages'}</span>
                                    <span className="font-medium text-slate-200">{units}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-400">Rate / unit</span>
                                    <span className="font-medium text-slate-200">{rate} KES</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-400">Chargeable amount</span>
                                    <span className="font-medium text-white">{chargeableAmount.toFixed(2)} KES</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-400">Wallet Balance</span>
                                    <span className="font-medium text-slate-200">{walletBalance.toFixed(2)} KES</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="font-bold text-slate-300">After deduction</span>
                                    <span className={`font-bold ${afterDeduction < 0 ? 'text-red-400' : 'text-purple-400'}`}>
                                        {afterDeduction.toFixed(2)} KES
                                    </span>
                                </div>
                            </div>

                            <button className="mt-6 w-full rounded-xl bg-purple-500/20 py-3 text-sm font-bold text-purple-400 cursor-default opacity-80 border border-purple-500/30">
                                Proceed
                            </button>
                            <p className="mt-3 text-center text-[10px] text-slate-500 uppercase tracking-widest">Example only, same layout as in the app</p>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/40 to-slate-900 p-10 text-center border border-purple-500/20">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent opacity-50"></div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black tracking-tight text-white">See real rates in the app</h3>
                        <p className="mx-auto mt-4 max-w-md text-sm text-purple-200/70 leading-relaxed">
                            Sign up for starter credit, run a file in the tools, and get live per-unit totals in the same confirm step you previewed above.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                to="/auth"
                                className="rounded-full bg-white px-8 py-3.5 text-sm font-bold text-slate-900 transition-transform hover:scale-105"
                            >
                                Get started free
                            </Link>
                            <Link
                                to="/auth"
                                className="rounded-full border border-white/20 bg-black/20 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                            >
                                Sign in
                            </Link>
                        </div>
                        <div className="mt-6">
                            <Link to="/" className="text-xs font-bold text-purple-400 hover:text-purple-300 underline decoration-purple-400/30 underline-offset-4">
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
