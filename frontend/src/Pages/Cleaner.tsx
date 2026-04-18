import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    FolderOpen,
    Trash2,
    Download,
    AlertCircle,
    CheckCircle,
    Loader2,
    X,
    Coins,
    MousePointerClick,
} from 'lucide-react';
import useCleaner from '../hooks/useCleaner';
import { UpgradeModal, SuccessPopup } from '../components/Popup';
import BreakdownPie from '../components/FilePie';
import { useGeneralStore } from '../Store/generalStore';
//import { TIER_CONFIG } from '../library/tier';
import { useTierStore } from '../Store/tierStore';
import { CLEANER_COST_PER_FILE_KES } from '../constants/cleanerPricing';
import { cleanerChargeAmountKes } from '../constants/cleanerPricing';
import { SubscriptionExpiredModal } from '../components/Popup';
import { useTransactions } from '../Store/TransactionStore';
import { useWalletStore } from '../Store/walletStore';
import { useState } from 'react';
export default function FolderCleanerUI() {
    const {
        isDragging,
        uploadedFolder,
        status,
        isExpired,
        setIsExpired,
        openPopup,
        upgradeModal,
        setUpgradeModal,
        setOpenPopUp,
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDrop,
        handleDownload,
        handleFolderInputChange,
        handleFolderSelectClick,
        fileInputRef,
        handleReset,
        confirmPayAndProcessFolder,
    } = useCleaner();
    const handleClose = () => {
        setOpenPopUp(false);
    };
    const cleaningStats = useGeneralStore((state) => state.cleaningStats);
    const path = 'processFolder';
    const tierId = useTierStore((state) => state.tierId);
    /*const CAN_ORGANIZE =
        TIER_CONFIG[tierId as keyof typeof TIER_CONFIG].canOrganize;*/
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
        <div>
            <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-600 to-violet-800 p-6">
                <div className="w-full max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-12 mb-8 text-start"
                    >
                        <h1 className="mb-2 text-4xl font-bold text-slate-100">
                            Tidy Up
                        </h1>
                        <p className="font-bold text-slate-200">
                            Remove duplicate files instantly. KES{' '}
                            {CLEANER_COST_PER_FILE_KES.toFixed(2)} per file
                            (rounded to 2 decimals) — select a folder, review
                            the total, then Pay & Process.
                        </p>
                    </motion.div>
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

                    <AnimatePresence mode="sync">
                        {(status === 'idle' ||
                            status === 'awaiting_payment') && (
                            <motion.div
                                key="dropzone"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onDragEnter={handleDragEnter}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={(event) => handleDrop(event, path)}
                                className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
                                    isDragging
                                        ? 'border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/30'
                                        : 'border-slate-700 bg-slate-800/60'
                                }`}
                            >
                                <div className="p-16 text-center">
                                    <motion.div
                                        animate={{
                                            y: isDragging ? -10 : 0,
                                            scale: isDragging ? 1.1 : 1,
                                        }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 300,
                                        }}
                                    >
                                        <FolderOpen className="mx-auto mb-6 h-20 w-20 text-slate-400" />
                                    </motion.div>

                                    <h3 className="mb-2 text-2xl font-semibold text-slate-100">
                                        {isDragging
                                            ? 'Drop your folder here'
                                            : 'Drag & Drop A Folder'}
                                    </h3>
                                    <p className="mb-6 text-slate-400">
                                        {status === 'awaiting_payment'
                                            ? `"${uploadedFolder?.name ?? 'Folder'}" is ready — review the total below, then tap Pay & Process. You can also drop another folder to replace it.`
                                            : "We'll clean it up and remove all duplicate files"}
                                    </p>
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-slate-400"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="bg-slate-500 px-2 text-slate-200">
                                                OR
                                            </span>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleFolderSelectClick}
                                        className="group mb-6 inline-flex items-center gap-3 rounded-xl bg-purple-600 px-6 py-3 text-purple-300 transition-all hover:bg-purple-500 hover:text-purple-100"
                                    >
                                        <MousePointerClick className="h-5 w-5 transition-transform group-hover:rotate-15" />
                                        <span className="font-medium">
                                            Click to select a folder
                                        </span>
                                    </motion.button>
                                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                                        <Upload className="h-4 w-4" />
                                        <span>
                                            Supported: Any folder structure
                                        </span>
                                    </div>
                                </div>

                                {isDragging && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="pointer-events-none absolute inset-0 bg-slate-700/30 backdrop-blur-sm"
                                    />
                                )}
                            </motion.div>
                        )}

                        {(status === 'uploading' ||
                            status === 'processing') && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="rounded-2xl border border-purple-300/20 bg-white/5 p-12 backdrop-blur-lg"
                            >
                                <div className="text-center">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: 'linear',
                                        }}
                                        className="mb-6 inline-block"
                                    >
                                        <Loader2 className="h-16 w-16 text-purple-400" />
                                    </motion.div>

                                    <h3 className="mb-2 text-2xl font-semibold text-white">
                                        {status === 'uploading'
                                            ? 'Uploading folder...'
                                            : 'Analyzing files...'}
                                    </h3>
                                    <p className="mb-6 text-purple-200">
                                        {uploadedFolder?.name}
                                    </p>

                                    {status === 'processing' && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center justify-center gap-2 text-sm text-purple-300"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span>
                                                Removing duplicate files. This
                                                may take a while...
                                            </span>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {status === 'complete' && cleaningStats && (
                            <motion.div
                                key="complete"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="overflow-hidden rounded-2xl border border-purple-300/20 bg-white/5 backdrop-blur-lg"
                            >
                                <div className="border-b border-green-400/20 bg-linear-to-r from-green-500/20 to-emerald-500/20 p-6">
                                    <div className="flex items-center gap-3">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{
                                                type: 'spring',
                                                delay: 0.2,
                                            }}
                                        >
                                            <CheckCircle className="h-8 w-8 text-green-400" />
                                        </motion.div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-white">
                                                Cleaning Complete!
                                            </h3>
                                            <p className="text-base font-semibold text-green-200">
                                                {uploadedFolder?.name}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8">
                                    <div className="mb-8 grid grid-cols-2 gap-4">
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="rounded-lg border border-purple-300/10 bg-white/5 p-4"
                                        >
                                            <p className="mb-1 text-base font-medium text-purple-100">
                                                Original Files
                                            </p>
                                            <p className="text-3xl font-bold text-white">
                                                {cleaningStats.originalFiles}
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 }}
                                            className="rounded-lg border border-purple-300/10 bg-white/5 p-4"
                                        >
                                            <p className="mb-1 text-base font-medium text-purple-100">
                                                Duplicates Removed
                                            </p>
                                            <p className="text-3xl font-bold text-red-400">
                                                {
                                                    cleaningStats.duplicatesRemoved
                                                }
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 }}
                                            className="rounded-lg border border-purple-300/10 bg-white/5 p-4"
                                        >
                                            <p className="mb-1 text-base font-medium text-purple-100">
                                                Final Files
                                            </p>
                                            <p className="text-3xl font-bold text-green-400">
                                                {cleaningStats.finalFiles}
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.6 }}
                                            className="rounded-lg border border-purple-300/10 bg-white/5 p-4"
                                        >
                                            <p className="mb-1 text-base font-medium text-purple-100">
                                                Space Saved
                                            </p>
                                            <p className="text-3xl font-bold text-blue-400">
                                                {cleaningStats.spaceSaved}
                                            </p>
                                        </motion.div>
                                    </div>
                                    <div>
                                        <BreakdownPie />
                                    </div>

                                    <div className="flex gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleDownload}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 px-6 py-4 font-semibold text-white transition-shadow hover:shadow-lg hover:shadow-purple-500/50"
                                        >
                                            <Download className="h-12 w-12 sm:h-5 sm:w-5" />
                                            Download Cleaned Folder
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleReset}
                                            className="rounded-xl bg-white/10 px-6 py-4 font-semibold text-white transition-colors hover:bg-white/20"
                                        >
                                            Clean Another
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {status === 'complete' &&
                            cleaningStats &&
                            openPopup && (
                                <AnimatePresence>
                                    <>
                                        {/* Backdrop */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={handleClose}
                                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                                        />

                                        {/* Popup */}
                                        <motion.div
                                            initial={{
                                                opacity: 0,
                                                scale: 0.8,
                                                y: 50,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                                y: 0,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                scale: 0.8,
                                                y: 50,
                                            }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 25,
                                            }}
                                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                                        >
                                            {/* Close Button */}
                                            <button
                                                onClick={handleClose}
                                                className="absolute top-4 right-4 rounded-full p-2 text-blue-300 transition-colors hover:bg-white/10 hover:text-white"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                            <SuccessPopup
                                                onDownload={handleDownload}
                                                onClose={handleClose}
                                            />
                                        </motion.div>
                                    </>
                                </AnimatePresence>
                            )}
                    </AnimatePresence>
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
                                        htmlFor="cleaner-mpesa-phone"
                                        className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase"
                                    >
                                        M-Pesa phone (top-up)
                                    </label>
                                    <input
                                        id="cleaner-mpesa-phone"
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
                                        wallet and start cleaning.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-10 flex flex-col justify-between gap-6 border-t border-slate-100 pt-8 sm:flex-row sm:items-center">
                        <div className="flex items-baseline gap-2">
                            <span className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                Total Cost:
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-slate-900">
                                    KES {totalCost.toFixed(2)}
                                </span>
                                {fileCount > 0 && (
                                    <span className="text-xs font-medium whitespace-nowrap text-slate-400">
                                        ({fileCount} ×{' '}
                                        {CLEANER_COST_PER_FILE_KES.toFixed(2)})
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
                            className="group relative flex min-w-[200px] items-center justify-center gap-3 rounded-2xl bg-slate-900 px-8 py-4 font-bold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-600/50 disabled:text-slate-300"
                            title={
                                walletCoversJob
                                    ? 'Pay from your wallet balance'
                                    : 'Top up via M-Pesa STK if needed, then pay from wallet and clean'
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
                                    <span>Pay & Process</span>
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
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-200">
                            <AlertCircle className="h-4 w-4" />
                            <span>
                                Your files are processed securely and never
                                stored
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
