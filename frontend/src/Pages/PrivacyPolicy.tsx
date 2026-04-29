import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
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
                        className="transition-colors hover:text-purple-600"
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

            <div className="mx-auto max-w-4xl space-y-12 px-6 py-20">
                <header className="space-y-3">
                    <h1 className="text-4xl font-black text-slate-900">
                        Privacy Policy
                    </h1>
                    <p className="text-sm font-medium text-slate-500">
                        Last updated: 26 April 2026.This page describes what
                        data we collect and how we process it.
                    </p>
                </header>
                <section className="space-y-4 leading-relaxed text-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Who we are
                    </h2>
                    <p>
                        Tidy Up helps you clean folders and merge PDF question
                        files. We process your uploads only to deliver your
                        selected service that is merged exam question or an
                        organized folder.
                    </p>
                </section>
                <section className="space-y-4 leading-relaxed text-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Information we process
                    </h2>
                    <ul className="list-disc space-y-2 pl-6">
                        <li>
                            <b>Account details:</b> used to authenticate your
                            access.
                        </li>
                        <li>
                            <b>Files uploaded:</b> for folder cleaning or exam
                            merging.
                        </li>
                        <li>
                            <b>Payment Records</b>
                            amounts in Kenyan Shillings, per-job charges,
                            M-Pesa-related top-up status where our payment flow
                            provides it, and refunds when a summary job fails,
                            as shown in your{' '}
                            <b className="text-purple-500">Wallet</b>{' '}
                            transaction list.
                        </li>
                    </ul>
                </section>
                <section className="space-y-4 leading-relaxed text-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900">
                        How we use information
                    </h2>
                    <ul className="list-disc space-y-2 pl-6">
                        <li>
                            Provide the requested service and download output.
                        </li>
                        <li>Show billing line items before payment.</li>
                        <li>
                            Keep wallet and payment records, including refunds
                            where applicable.
                        </li>
                    </ul>
                    We <b>do not</b> sell your personal information. We{' '}
                    <b>do not </b> use your exam papers to train public
                    machine-learning models for third parties.
                </section>
                <section className="space-y-4 leading-relaxed text-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Retention and deletion
                    </h2>
                    <p>
                        Uploads are cleaned after processing. You can contact us
                        to request account-related data review.
                    </p>
                </section>
                <section className="space-y-4 leading-relaxed text-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Changes to this policy
                    </h2>
                    <p>
                        We may update this page as the app evolves. We will
                        adjust the "Last updated" line above for material
                        changes when we can.
                    </p>
                </section>
                <section className="space-y-2 leading-relaxed text-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Contact
                    </h2>
                    <p>
                        Questions about privacy:{' '}
                        <a
                            href="mailto:support@tidyup.com"
                            className="font-bold text-purple-600 hover:underline"
                        >
                            phinjugushdev@gmail.com
                        </a>
                    </p>
                    <p>
                        Read our{' '}
                        <Link
                            to="/terms"
                            className="font-bold text-purple-600 hover:underline"
                        >
                            Terms of use
                        </Link>
                        .
                    </p>
                </section>
            </div>

            <footer className="border-t border-slate-200 pt-12 pb-8 text-center text-xs text-slate-500">
                <p>
                    &copy; {new Date().getFullYear()} Tidy Up. Built for
                    precision.
                </p>
            </footer>
        </div>
    );
}
