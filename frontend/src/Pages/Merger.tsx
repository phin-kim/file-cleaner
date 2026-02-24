import { motion, AnimatePresence } from 'framer-motion';
import useCleaner from '../hooks/useCleaner';
import {
    Upload,
    FolderOpen,
    FileText,
    Download,
    Loader2,
    CheckCircle2,
    MousePointerClick,
} from 'lucide-react';

const FolderQuestionAnalyzer = () => {
    const {
        handleDrop,
        isDragging,
        progress,
        status,
        downloadURL,
        fileInputRef,

        handleFolderInputChange,
        handleFolderSelectClick,
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDownload,
    } = useCleaner();

    const path = 'merge-files';

    return (
        <div className="flex items-center justify-center min-h-screen p-6 bg-linear-to-br from-purple-900 via-purple-800 to-indigo-900">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl"
            >
                <div className="p-8 border shadow-2xl rounded-3xl border-white/20 bg-white/10 backdrop-blur-lg">
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
                            className="inline-block p-4 mb-4 rounded-2xl bg-purple-500/20"
                        >
                            <FolderOpen className="w-12 h-12 text-purple-200" />
                        </motion.div>
                        <h1 className="mb-2 text-4xl font-bold text-white">
                            Tidy Up Analyzer
                        </h1>
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
                    {/* Drop Area */}
                    <AnimatePresence mode="wait">
                        {status === 'idle' && (
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
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-slate-700"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-slate-800/60 text-slate-400">
                                                OR
                                            </span>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleFolderSelectClick}
                                        className="inline-flex items-center gap-3 px-6 py-3 mb-6 text-purple-300 transition-all group rounded-xl bg-purple-500/20 hover:bg-purple-500/30 hover:text-purple-200"
                                    >
                                        <MousePointerClick className="w-12 h-12 transition-transform group-hover:rotate-12 sm:h-5 sm:w-5" />
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
                                <Loader2 className="w-16 h-16 mx-auto mb-6 text-purple-300 animate-spin" />
                                <h3 className="mb-2 text-2xl font-semibold text-white">
                                    {status === 'uploading'
                                        ? 'Uploading files...'
                                        : 'Generating PDF report...'}
                                </h3>
                                <p className="mb-6 text-purple-200">
                                    This may take a few moments
                                </p>

                                {status === 'uploading' && (
                                    <div className="max-w-md mx-auto">
                                        <div className="h-3 overflow-hidden rounded-full bg-purple-900/50">
                                            <motion.div
                                                animate={{
                                                    width: `${progress}%`,
                                                }}
                                                transition={{
                                                    duration: 0.3,
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
                                            {progress}%
                                        </motion.p>
                                    </div>
                                )}
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
                                        <CheckCircle2 className="w-20 h-20 mx-auto mb-4 text-green-400" />
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
                                    className="p-8 mb-6 border rounded-2xl border-purple-400/30 bg-linear-to-r from-purple-500/30 to-indigo-500/30"
                                >
                                    <div className="flex items-center justify-center gap-4 mb-6">
                                        <div className="p-3 rounded-xl bg-white/10">
                                            <FileText className="w-8 h-8 text-purple-200" />
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

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleDownload}
                                        className="flex items-center justify-center w-full gap-3 py-4 text-lg font-semibold text-white transition-all shadow-lg rounded-xl bg-linear-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                                    >
                                        <Download className="w-6 h-6" />
                                        Download PDF Report
                                    </motion.button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 text-sm text-center text-purple-200/60"
                >
                    Upload folders containing documents, PDFs, or text files for
                    analysis
                </motion.p>
            </motion.div>
        </div>
    );
};

export default FolderQuestionAnalyzer;
