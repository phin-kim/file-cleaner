import { Link } from 'react-router-dom';

export default function About() {
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

            <div className="mx-auto max-w-4xl px-6 py-20 space-y-12">
                <header>
                    <h1 className="text-4xl font-black md:text-5xl tracking-tight text-slate-900 mb-6">About Tidy Up</h1>
                    <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
                        Built for people who need to get through a lot of material and still be able to check what the tool produced.
                    </p>
                </header>

                <section className="space-y-6 text-slate-700 leading-relaxed">
                    <p>
                        Tidy Up takes dense lecture and course material (including PDF, Word, and PowerPoint) and turns it into structured summaries you can read, download, and cross-check. The app is designed around a clear flow: <strong>upload, confirm the charge from your wallet, follow progress, then open or download your result</strong>. You are never surprised by a subscription; usage is pay-as-you-go in Kenyan Shillings.
                    </p>
                    <p>
                        We focus on <strong>revision you can trust</strong>: headers, lists, and styling you can adjust in settings so the output matches how you like to study. Your account links to a wallet you top up (including via M-Pesa in the app), a history of summary jobs, and a transaction log so you can see charges, top-ups, and refunds when a job does not complete.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">What we are not</h2>
                    <p className="text-slate-700 leading-relaxed">
                        Tidy Up is a study assistant, not a source of exam answers on its own. We encourage you to verify important facts against your materials and your course requirements.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Get in touch</h2>
                    <p className="text-slate-700 leading-relaxed">
                        Questions or feedback? See <Link to="/contact" className="text-purple-600 font-bold hover:underline">Contact</Link> for our support address and help topics.
                    </p>
                </section>
            </div>
            
            <footer className="pt-12 pb-8 border-t border-slate-200 text-center text-xs text-slate-500">
                <p>&copy; {new Date().getFullYear()} Tidy Up. Built for precision.</p>
            </footer>
        </div>
    );
}
