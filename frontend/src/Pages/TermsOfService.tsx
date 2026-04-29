import { Link } from 'react-router-dom';

export default function TermsOfService() {
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
                        Terms of use
                    </h1>
                    <p className="text-sm font-medium text-slate-500">
                        Last updated: 26 April 2026.By using Tidy Up you agree
                        to the following terms
                    </p>
                </header>
                <section className="space-y-4 leading-relaxed text-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900">
                        The service
                    </h2>
                    <p>
                        Tidy Up provides folder cleaning and exam merging tools.
                        We may improve or modify features over time.{' '}
                        <b>Kindly note</b> that we may issue prior notice
                        regarding any features that we update or remove but its
                        not a guarantee
                    </p>
                </section>
                <section className="space-y-4 leading-relaxed text-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Acconts
                    </h2>
                    <p>
                        You must provide accurate information whe you register
                        and keep your login credentials confidential.You are
                        responsible for all activity in your account.Notify us
                        at{' '}
                        <b className="text-purple-600 underline">
                            phinjugushdev@gmail.com
                        </b>{' '}
                        if you believe that someone is using you credentials
                        without permission
                    </p>
                </section>
                <section className="space-y-4 leading-relaxed text-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Billing
                    </h2>
                    <ul className="list-disc space-y-2 pl-6">
                        <li>
                            Folder cleaner is charged at 1.5 KES per file. The
                            charges are file and is shown before you proceed to
                            pay.
                        </li>
                        <li>
                            File merger is charged at 2.5 KES per page. The
                            charges are file and is shown before you proceed to
                            pay.
                        </li>
                        <li>
                            If a folder cleaning or an exam merging fails after
                            a successful charge, our systems automatically
                            refund your wallet so that you don;t pay for a
                            service you didn't receive.Edge cases and disputes
                            that cannot be handled automatically are reviewed
                            whe you contact support with you appropriate email
                            address and the job details.
                        </li>
                        <li>
                            M-Pesa top-ups are started from the in-app flow;
                            completion depends on the mobile money network.
                            Failed or cancelled payments will not add balance
                            until they succeed in our records.
                        </li>
                    </ul>
                </section>
                <section className="space-y-4 leading-relaxed text-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Acceptable use
                    </h2>
                    <p>
                        You must not use the service to violate law, infringe
                        rights, or abuse platform resources.
                    </p>
                    <p>Violations include:</p>
                    <ul className="list-disc space-y-2 pl-6">
                        <li>
                            Uploading malware with the intent of breaking the
                            system, attempting to access unauthorized sections
                        </li>
                        <li>
                            Attempt to sell the service in a way that misleads
                            other users or overloads the platform without
                            permission
                        </li>
                    </ul>
                </section>
                <section className="space-y-4 leading-relaxed text-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900">
                        AI and accuracy
                    </h2>
                    <p>
                        The merging is automatically generated and may contain
                        gaps, or inaccuracies. Tidy Up{' '}
                        <b>
                            {' '}
                            is a study aid, not a substitute for your own
                            reading, instructor guidance, or professional advice
                        </b>
                        . You are solely responsible for how you apply this
                        content to your exams . This service is provided "
                        <b>as is</b>," subject to the maximum limits of the law.
                    </p>
                </section>
                <section className="space-y-4 leading-relaxed text-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Limitation of liability
                    </h2>
                    <p>
                        To the maximum extent of the law, Tidy Up's total
                        liability for any claim—including lost data or academic
                        performance—is limited to the fees paid for the relevant
                        service within the previous twelve months. We are not
                        liable for indirect or consequential damages. Where
                        certain jurisdictions prohibit these limitations, our
                        liability shall be limited to the fullest extent legally
                        possible.
                    </p>
                </section>
                <section className="space-y-2 leading-relaxed text-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Termination
                    </h2>
                    <p>
                        We reserve the right to suspend or terminate your
                        account for security concerns or if you violate these
                        terms. You are free to stop using Vazeup at any time.
                        Even after your account is closed, certain sections—such
                        as liability limits and legal protections—will stay in
                        effect.
                    </p>
                </section>
                <section className="space-y-2 leading-relaxed text-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Contact
                    </h2>
                    <p>
                        Legal questions:{' '}
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
                            to="/privacy"
                            className="font-bold text-purple-600 hover:underline"
                        >
                            Privacy Policy
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
