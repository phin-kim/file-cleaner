import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
            <div className="mx-auto max-w-4xl space-y-8">
                <header className="space-y-3">
                    <h1 className="text-4xl font-black">Privacy Policy</h1>
                    <p className="text-sm text-slate-400">
                        Last updated: 26 April 2026
                    </p>
                </header>
                <section className="space-y-4 text-slate-300">
                    <h2 className="text-2xl font-bold text-white">
                        Who we are
                    </h2>
                    <p>
                        Tidy Up helps you clean folders and merge PDF question
                        files. We process your uploads only to deliver your
                        selected service.
                    </p>
                </section>
                <section className="space-y-4 text-slate-300">
                    <h2 className="text-2xl font-bold text-white">
                        Information we process
                    </h2>
                    <ul className="list-disc space-y-2 pl-6">
                        <li>Account details used to authenticate your access.</li>
                        <li>Files uploaded for folder cleaning or file merger.</li>
                        <li>Payment references and wallet transaction logs.</li>
                    </ul>
                </section>
                <section className="space-y-4 text-slate-300">
                    <h2 className="text-2xl font-bold text-white">
                        How we use information
                    </h2>
                    <ul className="list-disc space-y-2 pl-6">
                        <li>Provide the requested service and download output.</li>
                        <li>Show billing line items before payment.</li>
                        <li>
                            Keep wallet and payment records, including refunds
                            where applicable.
                        </li>
                    </ul>
                </section>
                <section className="space-y-4 text-slate-300">
                    <h2 className="text-2xl font-bold text-white">
                        Retention and deletion
                    </h2>
                    <p>
                        Temporary uploads are cleaned after processing. You can
                        contact us to request account-related data review.
                    </p>
                </section>
                <section className="space-y-2 text-slate-300">
                    <h2 className="text-2xl font-bold text-white">Contact</h2>
                    <p>
                        Questions about privacy:{' '}
                        <a
                            href="mailto:phinjugushdev@gmail.com"
                            className="text-cyan-300 underline"
                        >
                            phinjugushdev@gmail.com
                        </a>
                    </p>
                    <p>
                        Read our <Link to="/terms" className="underline">Terms of use</Link>.
                    </p>
                </section>
            </div>
        </div>
    );
}
