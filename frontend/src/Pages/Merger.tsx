import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import useCleaner from '../hooks/useCleaner';
import {
    Upload,
    FolderOpen,
    FileText,
    Download,
    Loader2,
    CheckCircle2,
    MousePointerClick,
    AlertCircle,
    Coins,
} from 'lucide-react';
import { SubscriptionExpiredModal, UpgradeModal } from '../components/Popup';
import { useTransactions } from '../Store/TransactionStore';
import { useWalletStore } from '../Store/walletStore';
import {
    CLEANER_COST_PER_FILE_KES,
    cleanerChargeAmountKes,
} from '../constants/cleanerPricing';
const FolderQuestionAnalyzer = () => {
    const {
        handleDrop,
        isDragging,
        progress,
        status,
        downloadURL,
        fileInputRef,
        setUpgradeModal,
        upgradeModal,
        isExpired,
        setIsExpired,
        isWorkSheet,
        setIsWorkSheet,
        handleFolderInputChange,
        handleFolderSelectClick,
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDownload,
        handleReset,
        confirmPayAndProcessFolder,
    } = useCleaner();

    const path = 'merge-files';
    const fileCount = useTransactions((state) => state.fileCount);
    const totalCost = cleanerChargeAmountKes(fileCount);
    const walletBalance = useWalletStore((s) => s.balance);
    const walletCoversJob =
        fileCount > 0 &&
        Math.round(walletBalance * 100) >= Math.round(totalCost * 100);
    const needsMpesaTopUp =
        status === 'awaiting_payment' && fileCount > 0 && !walletCoversJob;
    const [mpesaPhone, setMpesaPhone] = useState('');
    const mpesaDigitsOk = mpesaPhone.replace(/\D/g, '').length >= 9;
    return (
        <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-purple-800 to-indigo-900 p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 w-full max-w-3xl"
            >
                <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-lg">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, rotate: 360 }}
                            transition={{
                                type: 'spring',
                                stiffness: 200,
                                damping: 15,
                            }}
                            className="mb-4 inline-block rounded-2xl bg-purple-500/20 p-4"
                        >
                            <FolderOpen className="h-12 w-12 text-purple-200" />
                        </motion.div>
                        <div className="flex flex-row items-center justify-center gap-4">
                            <h1 className="mb-2 text-4xl font-bold text-white">
                                Tidy Up Analyzer
                            </h1>
                        </div>

                        <p className="text-purple-200">
                            Upload a folder to extract and merge questions
                        </p>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleFolderInputChange(e, path)}
                        webkitdirectory="true"
                        directory=""
                        className="hidden"
                        multiple
                        style={{ display: 'none' }}
                    />
                    <div className="mb-6 flex items-center rounded-md bg-blue-50 p-3">
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={isWorkSheet}
                                onChange={() => setIsWorkSheet(!isWorkSheet)}
                            />
                            <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:outline-none after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                        </label>
                        <span className="ml-3 text-sm font-medium text-gray-700">
                            Generate as **Worksheet** (Adds space for answers)
                        </span>
                    </div>
                    {/* Drop Area */}
                    <AnimatePresence mode="wait">
                        {(status === 'idle' ||
                            status === 'awaiting_payment') && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <motion.div
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDragOver={handleDragOver}
                                    onDrop={(event) => handleDrop(event, path)}
                                    className={`rounded-2xl border-2 border-dashed p-16 text-center transition-all duration-300 ${
                                        isDragging
                                            ? 'scale-105 border-purple-400 bg-purple-500/20'
                                            : 'border-purple-300/50 hover:border-purple-300 hover:bg-white/5'
                                    }`}
                                >
                                    <motion.div
                                        animate={{
                                            y: isDragging ? -10 : 0,
                                            scale: isDragging ? 1.1 : 1,
                                        }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 300,
                                            damping: 20,
                                        }}
                                    >
                                        <Upload
                                            className={`mx-auto mb-6 h-20 w-20 transition-colors duration-300 ${
                                                isDragging
                                                    ? 'text-purple-200'
                                                    : 'text-purple-300'
                                            }`}
                                        />
                                    </motion.div>

                                    <p className="mb-3 text-2xl font-semibold text-white">
                                        {isDragging
                                            ? 'Drop your folder here'
                                            : 'Drag & Drop Folder Here'}
                                    </p>
                                    <p className="mb-3 text-sm text-purple-200">
                                        {status === 'awaiting_payment'
                                            ? 'Folder staged. Review payment section below, then tap Pay & Process.'
                                            : `KES ${CLEANER_COST_PER_FILE_KES.toFixed(2)} per file (rounded to 2 decimals).`}
                                    </p>
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-slate-700"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="bg-slate-800/60 px-2 text-slate-400">
                                                OR
                                            </span>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleFolderSelectClick}
                                        className="group mb-6 inline-flex items-center gap-3 rounded-xl bg-purple-500/20 px-6 py-3 text-purple-300 transition-all hover:bg-purple-500/30 hover:text-purple-200"
                                    >
                                        <MousePointerClick className="h-5 w-5 transition-transform group-hover:rotate-12" />
                                        <span className="font-medium">
                                            Click to select a folder
                                        </span>
                                    </motion.button>
                                    <p className="text-purple-200">
                                        All files in the folder will be
                                        automatically analyzed
                                    </p>
                                </motion.div>
                            </motion.div>
                        )}

                        {(status === 'uploading' ||
                            status === 'processing') && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="py-12 text-center"
                            >
                                <Loader2 className="mx-auto mb-6 h-16 w-16 animate-spin text-purple-300" />
                                <h3 className="mb-2 text-2xl font-semibold text-white">
                                    {status === 'uploading'
                                        ? 'Uploading files...'
                                        : 'Parsing, merging and generating PDF...'}
                                </h3>
                                <p className="mb-6 text-purple-200">
                                    {status === 'uploading'
                                        ? 'Sending files securely to the server'
                                        : 'Detecting questions, normalizing format, then building the final PDF'}
                                </p>

                                <div className="mx-auto max-w-md">
                                    <div className="h-3 overflow-hidden rounded-full bg-purple-900/50">
                                        <motion.div
                                            animate={{
                                                width: `${status === 'uploading' ? progress : 96}%`,
                                            }}
                                            transition={{
                                                duration: 0.35,
                                                ease: 'easeOut',
                                            }}
                                            className="h-full rounded-full bg-linear-to-r from-purple-400 to-indigo-400"
                                        />
                                    </div>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mt-2 text-purple-200"
                                    >
                                        {status === 'uploading'
                                            ? `${progress}% uploaded`
                                            : 'Almost done... finalizing output'}
                                    </motion.p>
                                </div>
                            </motion.div>
                        )}

                        {status === 'complete' && downloadURL && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                            >
                                <div className="mb-8 text-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 200,
                                            delay: 0.1,
                                        }}
                                    >
                                        <CheckCircle2 className="mx-auto mb-4 h-20 w-20 text-green-400" />
                                    </motion.div>
                                    <motion.h3
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="mb-2 text-3xl font-semibold text-white"
                                    >
                                        Merging Complete!
                                    </motion.h3>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="mb-6 rounded-2xl border border-purple-400/30 bg-linear-to-r from-purple-500/30 to-indigo-500/30 p-8"
                                >
                                    <div className="mb-6 flex items-center justify-center gap-4">
                                        <div className="rounded-xl bg-white/10 p-3">
                                            <FileText className="h-8 w-8 text-purple-200" />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="text-lg font-semibold text-white">
                                                PDF Report Ready
                                            </h4>
                                            <p className="text-sm text-purple-200">
                                                Your merged questions have been
                                                generated
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleDownload}
                                            className="flex w-full items-center justify-center gap-3 rounded-xl bg-linear-to-r from-purple-500 to-indigo-500 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-purple-600 hover:to-indigo-600"
                                        >
                                            <Download className="h-6 w-6" />
                                            Download PDF Report
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleReset}
                                            className="rounded-xl bg-white/10 px-6 py-4 font-semibold text-white transition-colors hover:bg-white/20"
                                        >
                                            Merge Another
                                        </motion.button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {status === 'awaiting_payment' && fileCount > 0 && (
                        <div className="mt-8 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm">
                                <span className="font-semibold text-slate-600">
                                    Wallet balance
                                </span>
                                <span className="font-black text-slate-900">
                                    KES {walletBalance.toFixed(2)}
                                </span>
                            </div>

                            {walletCoversJob ? (
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-900 shadow-sm">
                                    Your wallet covers this job (
                                    {totalCost.toFixed(2)}). Tap{' '}
                                    <strong>Pay &amp; Process</strong> to deduct
                                    from your wallet — no M-Pesa step.
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                                    <label
                                        htmlFor="merger-mpesa-phone"
                                        className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase"
                                    >
                                        M-Pesa phone (top-up)
                                    </label>
                                    <input
                                        id="merger-mpesa-phone"
                                        type="tel"
                                        inputMode="tel"
                                        autoComplete="tel"
                                        placeholder="07XX XXX XXX or 254…"
                                        value={mpesaPhone}
                                        onChange={(e) =>
                                            setMpesaPhone(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                                    />
                                    <p className="mt-2 text-xs text-slate-500">
                                        You need KES{' '}
                                        {Math.max(
                                            0,
                                            totalCost - walletBalance
                                        ).toFixed(2)}{' '}
                                        more than your wallet. We will send an
                                        STK push —{' '}
                                        <strong>
                                            enter your M-Pesa PIN on your phone
                                        </strong>{' '}
                                        when prompted (never on this site).
                                        After it clears, we deduct from your
                                        wallet and start merging.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-10 flex flex-col justify-between gap-6 border-t border-slate-100 pt-8 sm:flex-row sm:items-center">
                        <div className="flex items-baseline gap-2">
                            <span className="mb-1 block text-[10px] font-bold tracking-widest text-slate-300 uppercase">
                                Total Cost:
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-white">
                                    KES {totalCost.toFixed(2)}
                                </span>
                                {fileCount > 0 && (
                                    <span className="text-xs font-medium whitespace-nowrap text-slate-300">
                                        ({fileCount} ×{' '}
                                        {CLEANER_COST_PER_FILE_KES.toFixed(2)},
                                        rounded)
                                    </span>
                                )}
                            </div>
                        </div>

                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={
                                status !== 'awaiting_payment' ||
                                fileCount === 0 ||
                                (needsMpesaTopUp && !mpesaDigitsOk)
                            }
                            onClick={() =>
                                void confirmPayAndProcessFolder(mpesaPhone)
                            }
                            className="group relative flex min-w-50 items-center justify-center gap-3 rounded-2xl bg-slate-900 px-8 py-4 font-bold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-600/50 disabled:text-slate-300"
                            title={
                                walletCoversJob
                                    ? 'Pay from your wallet balance'
                                    : 'Top up via M-Pesa STK if needed, then pay from wallet and merge'
                            }
                        >
                            {status === 'uploading' ||
                            status === 'processing' ? (
                                <>
                                    <Loader2
                                        className="animate-spin text-purple-300"
                                        size={18}
                                    />
                                    <span>Processing…</span>
                                </>
                            ) : (
                                <>
                                    <Coins
                                        size={18}
                                        className="text-purple-400"
                                    />
                                    <span>Pay &amp; Process</span>
                                </>
                            )}
                        </motion.button>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 text-center"
                    >
                        <div className="flex items-center justify-center gap-2 text-sm text-purple-200/80">
                            <AlertCircle className="h-4 w-4" />
                            <span>
                                Wallet charges are tracked; failed processing is
                                auto-refunded and logged as refund history.
                            </span>
                        </div>
                    </motion.div>
                </div>
                {upgradeModal && (
                    <UpgradeModal onClose={() => setUpgradeModal(false)} />
                )}
                {isExpired && (
                    <SubscriptionExpiredModal
                        key={'subscription-expired-modal'}
                        isExpired={isExpired}
                        onClose={() => setIsExpired(false)}
                    />
                )}
                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 text-center text-sm text-purple-200/60"
                >
                    Upload folders containing documents, PDFs, or text files for
                    analysis
                </motion.p>
            </motion.div>
        </div>
    );
};

export default FolderQuestionAnalyzer;
