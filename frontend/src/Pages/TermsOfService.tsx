import { Link } from 'react-router-dom';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
            <div className="mx-auto max-w-4xl space-y-8">
                <header className="space-y-3">
                    <h1 className="text-4xl font-black">Terms of use</h1>
                    <p className="text-sm text-slate-400">
                        Last updated: 26 April 2026
                    </p>
                </header>
                <section className="space-y-4 text-slate-300">
                    <h2 className="text-2xl font-bold text-white">
                        The service
                    </h2>
                    <p>
                        Tidy Up provides folder cleaning and file merger tools.
                        We may improve or modify features over time.
                    </p>
                </section>
                <section className="space-y-4 text-slate-300">
                    <h2 className="text-2xl font-bold text-white">Billing</h2>
                    <ul className="list-disc space-y-2 pl-6">
                        <li>Folder cleaner is charged at 1.5 KES per file.</li>
                        <li>File merger is charged at 2.5 KES per page.</li>
                        <li>
                            Prices are shown before payment in the app flow.
                        </li>
                    </ul>
                </section>
                <section className="space-y-4 text-slate-300">
                    <h2 className="text-2xl font-bold text-white">
                        Acceptable use
                    </h2>
                    <p>
                        You must not use the service to violate law, infringe
                        rights, or abuse platform resources.
                    </p>
                </section>
                <section className="space-y-4 text-slate-300">
                    <h2 className="text-2xl font-bold text-white">
                        Limitation of liability
                    </h2>
                    <p>
                        The service is provided as-is to the extent permitted by
                        law. Your consumer rights remain unaffected.
                    </p>
                </section>
                <section className="space-y-2 text-slate-300">
                    <h2 className="text-2xl font-bold text-white">Contact</h2>
                    <p>
                        Legal questions:{' '}
                        <a
                            href="mailto:phinjugushdev@gmail.com"
                            className="text-cyan-300 underline"
                        >
                            phinjugushdev@gmail.com
                        </a>
                    </p>
                    <p>
                        Read our{' '}
                        <Link to="/privacy" className="underline">
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </section>
            </div>
        </div>
    );
}
