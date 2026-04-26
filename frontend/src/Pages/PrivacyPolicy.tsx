import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
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
                    <Link to="/how-it-works" className="hover:text-purple-600 transition-colors">How it works</Link>
                    <Link to="/pricing" className="hover:text-purple-600 transition-colors">Pricing</Link>
                </div>
                <div className="flex items-center gap-4 text-sm font-bold">
                    <Link to="/auth" className="text-slate-600 hover:text-purple-600 transition-colors">Sign in</Link>
                    <Link to="/auth" className="rounded-full bg-purple-600 px-5 py-2.5 text-white hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/20">Get started</Link>
                </div>
            </nav>

            <div className="mx-auto max-w-4xl px-6 py-20 space-y-12">
                <header className="space-y-3">
                    <h1 className="text-4xl font-black text-slate-900">Privacy Policy</h1>
                    <p className="text-sm font-medium text-slate-500">
                        Last updated: 26 April 2026
                    </p>
                </header>
                <section className="space-y-4 text-slate-700 leading-relaxed">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Who we are
                    </h2>
                    <p>
                        Tidy Up helps you clean folders and merge PDF question
                        files. We process your uploads only to deliver your
                        selected service.
                    </p>
                </section>
                <section className="space-y-4 text-slate-700 leading-relaxed">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Information we process
                    </h2>
                    <ul className="list-disc space-y-2 pl-6">
                        <li>Account details used to authenticate your access.</li>
                        <li>Files uploaded for folder cleaning or file merger.</li>
                        <li>Payment references and wallet transaction logs.</li>
                    </ul>
                </section>
                <section className="space-y-4 text-slate-700 leading-relaxed">
                    <h2 className="text-2xl font-bold text-slate-900">
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
                <section className="space-y-4 text-slate-700 leading-relaxed">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Retention and deletion
                    </h2>
                    <p>
                        Temporary uploads are cleaned after processing. You can
                        contact us to request account-related data review.
                    </p>
                </section>
                <section className="space-y-2 text-slate-700 leading-relaxed">
                    <h2 className="text-2xl font-bold text-slate-900">Contact</h2>
                    <p>
                        Questions about privacy:{' '}
                        <a
                            href="mailto:support@tidyup.com"
                            className="text-purple-600 font-bold hover:underline"
                        >
                            support@tidyup.com
                        </a>
                    </p>
                    <p>
                        Read our <Link to="/terms" className="text-purple-600 font-bold hover:underline">Terms of use</Link>.
                    </p>
                </section>
            </div>
            
            <footer className="pt-12 pb-8 border-t border-slate-200 text-center text-xs text-slate-500">
                <p>&copy; {new Date().getFullYear()} Tidy Up. Built for precision.</p>
            </footer>
        </div>
    );
}
