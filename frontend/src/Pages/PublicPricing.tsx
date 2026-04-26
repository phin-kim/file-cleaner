import { Link } from 'react-router-dom';
import { MERGER_COST_PER_PAGE_KES } from '../constants/mergerPricing';
import { CLEANER_COST_PER_FILE_KES } from '../constants/cleanerPricing';
import { Wallet, FileText, Eye, Gift, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function PublicPricing() {
    const [units, setUnits] = useState(20);
    const [docType, setDocType] = useState<'cleaner' | 'merger'>('cleaner');

    const rate =
        docType === 'cleaner'
            ? CLEANER_COST_PER_FILE_KES
            : MERGER_COST_PER_PAGE_KES;
    const chargeableAmount = units * rate;
    const walletBalance = 60; // Mock balance
    const afterDeduction = walletBalance - chargeableAmount;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-purple-500/30">
            {/* Top Navigation */}
            <nav className="relative z-20 container mx-auto flex items-center justify-between px-6 py-6">
                <Link
                    to="/"
                    className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900"
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-md shadow-purple-500/20">
                        T
                    </div>
                    Tidy Up
                </Link>
                <div className="hidden items-center gap-8 text-sm font-bold text-slate-600 md:flex">
                    <Link
                        to="/"
                        className="transition-colors hover:text-purple-600"
                    >
                        Home
                    </Link>
                    <Link
                        to="/how-it-works"
                        className="transition-colors hover:text-purple-600"
                    >
                        How it works
                    </Link>
                    <Link
                        to="/pricing"
                        className="text-purple-600 transition-colors"
                    >
                        Pricing
                    </Link>
                </div>
                <div className="flex items-center gap-4 text-sm font-bold">
                    <Link
                        to="/auth"
                        className="text-slate-600 transition-colors hover:text-purple-600"
                    >
                        Sign in
                    </Link>
                    <Link
                        to="/auth"
                        className="rounded-full bg-purple-600 px-5 py-2.5 text-white shadow-md shadow-purple-500/20 transition-colors hover:bg-purple-700"
                    >
                        Get started
                    </Link>
                </div>
            </nav>

            <div className="mx-auto max-w-5xl space-y-24 px-6 py-20">
                {/* Header */}
                <header className="space-y-6 text-center">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                        Simple, transparent pricing
                    </h1>
                    <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
                        No monthly plans - just your wallet, clear per-file
                        pricing, and a confirm step that matches what you will
                        see in the app.
                    </p>
                </header>

                {/* At a glance section */}
                <section className="space-y-10">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-slate-900">
                            At a glance
                        </h2>
                        <p className="mt-2 text-xs tracking-widest text-slate-500 uppercase">
                            The core ideas - in short form.
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:bg-slate-50">
                            <div className="mb-4 inline-flex rounded-xl bg-purple-100 p-3 text-purple-600">
                                <Wallet size={20} />
                            </div>
                            <h3 className="mb-2 text-sm font-bold text-slate-900">
                                Wallet, not plans
                            </h3>
                            <p className="text-xs leading-relaxed text-slate-600">
                                Top up in KES when you need to. We deduct per
                                job, so you are never locked into a
                                subscription.
                            </p>
                        </article>
                        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:bg-slate-50">
                            <div className="mb-4 inline-flex rounded-xl bg-purple-100 p-3 text-purple-600">
                                <FileText size={20} />
                            </div>
                            <h3 className="mb-2 text-sm font-bold text-slate-900">
                                Per file or per page
                            </h3>
                            <p className="text-xs leading-relaxed text-slate-600">
                                Folder Cleaner is billed by file. File Merger is
                                billed by page. The unit always matches the file
                                you upload.
                            </p>
                        </article>
                        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:bg-slate-50">
                            <div className="mb-4 inline-flex rounded-xl bg-purple-100 p-3 text-purple-600">
                                <Eye size={20} />
                            </div>
                            <h3 className="mb-2 text-sm font-bold text-slate-900">
                                See the charge first
                            </h3>
                            <p className="text-xs leading-relaxed text-slate-600">
                                Before processing, a confirmation step shows
                                unit count, rate, and total so you can proceed
                                on purpose.
                            </p>
                        </article>
                        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:bg-slate-50">
                            <div className="mb-4 inline-flex rounded-xl bg-purple-100 p-3 text-purple-600">
                                <Gift size={20} />
                            </div>
                            <h3 className="mb-2 text-sm font-bold text-slate-900">
                                Free starter credit
                            </h3>
                            <p className="text-xs leading-relaxed text-slate-600">
                                New accounts get about 50 units of processing to
                                try a real file at the current per-unit rate.
                            </p>
                        </article>
                    </div>
                </section>

                {/* Interactive Preview */}
                <section className="space-y-10">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 inline-flex rounded-full bg-purple-100 p-2 text-purple-600">
                            <Sparkles size={16} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Try the interactive preview
                        </h2>
                        <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-500">
                            Adjust units and see the same line items as in the
                            confirm summary step.
                        </p>
                    </div>

                    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
                        {/* Interactive Controls */}
                        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <h3 className="mb-1 text-sm font-bold text-slate-900">
                                    Billing preview
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Illustrative only - assuming{' '}
                                    <span className="font-bold text-purple-600">
                                        {rate} KES
                                    </span>{' '}
                                    per unit.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                    Number of units
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={units}
                                    onChange={(e) =>
                                        setUnits(Number(e.target.value) || 0)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 transition-colors focus:border-purple-500 focus:bg-white focus:outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                    Document Type
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setDocType('cleaner')}
                                        className={`rounded-xl border p-3 text-xs font-bold transition-all ${docType === 'cleaner' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        Folder Cleaner (files)
                                    </button>
                                    <button
                                        onClick={() => setDocType('merger')}
                                        className={`rounded-xl border p-3 text-xs font-bold transition-all ${docType === 'merger' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        File Merger (pages)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Summary Card */}
                        {/* Summary Card */}
                        <div className="flex flex-col rounded-3xl border border-purple-500/30 bg-[#7133DA] p-6 shadow-xl">
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-white">
                                    Billing preview: {units}{' '}
                                    {docType === 'cleaner' ? 'files' : 'pages'}{' '}
                                    × KES {rate.toFixed(2)} = KES{' '}
                                    {chargeableAmount.toFixed(2)} (rounded).
                                </div>

                                <div className="flex items-center justify-between rounded-2xl bg-white p-4 text-sm shadow-sm">
                                    <span className="font-medium text-slate-600">
                                        Wallet balance
                                    </span>
                                    <span className="font-black text-slate-900">
                                        KES {walletBalance.toFixed(2)}
                                    </span>
                                </div>

                                <div className="rounded-2xl bg-[#E5F2F0] p-4 text-sm text-[#006054] shadow-sm">
                                    {chargeableAmount <= walletBalance ? (
                                        <>
                                            Your wallet covers this job (
                                            {chargeableAmount.toFixed(2)}). Tap{' '}
                                            <span className="font-bold">
                                                Pay &amp; Process
                                            </span>{' '}
                                            to deduct from your wallet — no
                                            M-Pesa step.
                                        </>
                                    ) : (
                                        <>
                                            Your wallet balance is insufficient.
                                            You need KES{' '}
                                            {(
                                                chargeableAmount - walletBalance
                                            ).toFixed(2)}{' '}
                                            more to process this file.
                                        </>
                                    )}
                                </div>
                            </div>

                            <hr className="my-8 border-white/20" />

                            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                <div className="flex items-center gap-2">
                                    <span className="mt-1 text-[10px] font-bold tracking-widest text-white/50 uppercase">
                                        TOTAL COST:
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-white">
                                            KES {chargeableAmount.toFixed(2)}
                                        </span>
                                        <span className="ml-1 text-xs text-white/50">
                                            ({units} × {rate.toFixed(2)})
                                        </span>
                                    </div>
                                </div>

                                <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0F172A] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 sm:w-auto">
                                    <div className="rounded-full bg-white/10 p-1">
                                        <Wallet size={14} />
                                    </div>{' '}
                                    Pay & Process
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="relative overflow-hidden rounded-3xl bg-purple-600 p-10 text-center text-white shadow-2xl shadow-purple-600/20">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.2)_0%,_transparent_70%)]"></div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black tracking-tight">
                            See real rates in the app
                        </h3>
                        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-purple-100">
                            Sign up for starter credit, run a file in the tools,
                            and get live per-unit totals in the same confirm
                            step you previewed above.
                        </p>
                        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                            <Link
                                to="/auth"
                                className="rounded-full bg-white px-8 py-3.5 text-sm font-bold text-purple-600 shadow-md transition-transform hover:scale-105"
                            >
                                Get started free
                            </Link>
                            <Link
                                to="/auth"
                                className="rounded-full border border-purple-300 bg-purple-500/20 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-purple-500/40"
                            >
                                Sign in
                            </Link>
                        </div>
                        <div className="mt-6">
                            <Link
                                to="/"
                                className="text-xs font-bold text-purple-200 underline decoration-purple-300/30 underline-offset-4 transition-all hover:text-white hover:decoration-white/50"
                            >
                                Back to home
                            </Link>
                        </div>
                    </div>
                </section>

                <footer className="border-t border-slate-200 pt-12 pb-8 text-center text-xs text-slate-500">
                    <p>
                        &copy; {new Date().getFullYear()} Tidy Up. Built for
                        precision.
                    </p>
                </footer>
            </div>
        </div>
    );
}
