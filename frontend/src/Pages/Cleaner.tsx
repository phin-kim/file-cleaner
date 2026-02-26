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
    MousePointerClick,
} from 'lucide-react';
import useCleaner from '../hooks/useCleaner';
import SuccessPopup from '../components/Popup';
export default function FolderCleanerUI() {
    const {
        isDragging,
        uploadedFolder,
        status,
        cleaningStats,
        openPopup,
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
    } = useCleaner();
    const handleClose = () => {
        setOpenPopUp(false);
    };
    const path = 'processFolder';
    return (
        <div className="flex items-center justify-center min-h-screen p-6 bg-linear-to-br from-purple-600 to-violet-800">
            <div className="w-full max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 text-center"
                >
                    <h1 className="mb-2 text-4xl font-bold text-slate-100">
                        Tidy Up
                    </h1>
                    <p className="text-slate-400">
                        Remove duplicate files instantly
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
                <AnimatePresence mode="wait">
                    {status === 'idle' && (
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
                                    <FolderOpen className="w-20 h-20 mx-auto mb-6 text-slate-400" />
                                </motion.div>

                                <h3 className="mb-2 text-2xl font-semibold text-slate-100">
                                    {isDragging
                                        ? 'Drop your folder here'
                                        : 'Drag & Drop A Folder'}
                                </h3>
                                <p className="mb-6 text-slate-400">
                                    We'll clean it up and remove all duplicate
                                    files
                                </p>
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-400"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-slate-500 text-slate-200">
                                            OR
                                        </span>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleFolderSelectClick}
                                    className="inline-flex items-center gap-3 px-6 py-3 mb-6 text-purple-300 transition-all bg-purple-600 group rounded-xl hover:bg-purple-500 hover:text-purple-100"
                                >
                                    <MousePointerClick className="w-5 h-5 transition-transform group-hover:rotate-15" />
                                    <span className="font-medium">
                                        Click to select a folder
                                    </span>
                                </motion.button>
                                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                                    <Upload className="w-4 h-4" />
                                    <span>Supported: Any folder structure</span>
                                </div>
                            </div>

                            {isDragging && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 pointer-events-none bg-slate-700/30 backdrop-blur-sm"
                                />
                            )}
                        </motion.div>
                    )}

                    {(status === 'uploading' || status === 'processing') && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="p-12 border rounded-2xl border-purple-300/20 bg-white/5 backdrop-blur-lg"
                        >
                            <div className="text-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                    className="inline-block mb-6"
                                >
                                    <Loader2 className="w-16 h-16 text-purple-400" />
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
                                        <Trash2 className="w-4 h-4" />
                                        <span>Removing duplicate files...</span>
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
                            className="overflow-hidden border rounded-2xl border-purple-300/20 bg-white/5 backdrop-blur-lg"
                        >
                            <div className="p-6 border-b border-green-400/20 bg-linear-to-r from-green-500/20 to-emerald-500/20">
                                <div className="flex items-center gap-3">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                            type: 'spring',
                                            delay: 0.2,
                                        }}
                                    >
                                        <CheckCircle className="w-8 h-8 text-green-400" />
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
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="p-4 border rounded-lg border-purple-300/10 bg-white/5"
                                    >
                                        <p className="mb-1 text-base font-medium text-purple-500">
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
                                        className="p-4 border rounded-lg border-purple-300/10 bg-white/5"
                                    >
                                        <p className="mb-1 text-base font-medium text-purple-500">
                                            Duplicates Removed
                                        </p>
                                        <p className="text-3xl font-bold text-red-400">
                                            {cleaningStats.duplicatesRemoved}
                                        </p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="p-4 border rounded-lg border-purple-300/10 bg-white/5"
                                    >
                                        <p className="mb-1 text-base font-medium text-purple-500">
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
                                        className="p-4 border rounded-lg border-purple-300/10 bg-white/5"
                                    >
                                        <p className="mb-1 text-base font-medium text-purple-500">
                                            Space Saved
                                        </p>
                                        <p className="text-3xl font-bold text-blue-400">
                                            {cleaningStats.spaceSaved}
                                        </p>
                                    </motion.div>
                                </div>

                                <div className="flex gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleDownload}
                                        className="flex items-center justify-center flex-1 gap-2 px-6 py-4 font-semibold text-white transition-shadow rounded-xl bg-linear-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/50"
                                    >
                                        <Download className="w-12 h-12 sm:h-5 sm:w-5" />
                                        Download Cleaned Folder
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleReset}
                                        className="px-6 py-4 font-semibold text-white transition-colors rounded-xl bg-white/10 hover:bg-white/20"
                                    >
                                        Clean Another
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {status === 'complete' && cleaningStats && openPopup && (
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
                                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: 50 }}
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
                                        className="absolute p-2 text-blue-300 transition-colors rounded-full top-4 right-4 hover:bg-white/10 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
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

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 text-center"
                >
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-200">
                        <AlertCircle className="w-4 h-4" />
                        <span>
                            Your files are processed securely and never stored
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
