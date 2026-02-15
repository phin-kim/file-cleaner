import { motion, AnimatePresence } from 'framer-motion';
import useCleaner from '../hooks/useCleaner';
import {
    Upload,
    FolderOpen,
    FileText,
    Download,
    Loader2,
    CheckCircle2,
} from 'lucide-react';

const FolderQuestionAnalyzer = () => {
    const {
        handleDrop,
        isDragging,
        progress,
        result,
        status,
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDownload,
        resetMergerUpload,
    } = useCleaner();

    const path = 'merge-files';

    return (
        <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-purple-800 to-indigo-900 p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl"
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
                        <h1 className="mb-2 text-4xl font-bold text-white">
                            Question Analyzer
                        </h1>
                        <p className="text-purple-200">
                            Upload a folder to extract and analyze questions
                        </p>
                    </div>

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
                                        : 'Generating PDF report...'}
                                </h3>
                                <p className="mb-6 text-purple-200">
                                    This may take a few moments
                                </p>

                                {status === 'uploading' && (
                                    <div className="mx-auto max-w-md">
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

                        {status === 'complete' && result && (
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
                                        Analysis Complete!
                                    </motion.h3>
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-lg text-purple-200"
                                    >
                                        Processed {result.filesProcessed} files
                                        successfully
                                    </motion.p>
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
                                                Your analysis report has been
                                                generated
                                            </p>
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleDownload}
                                        className="flex w-full items-center justify-center gap-3 rounded-xl bg-linear-to-r from-purple-500 to-indigo-500 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-purple-600 hover:to-indigo-600"
                                    >
                                        <Download className="h-6 w-6" />
                                        Download PDF Report
                                    </motion.button>
                                </motion.div>

                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={resetMergerUpload}
                                    className="w-full rounded-xl bg-white/10 py-3 font-semibold text-white transition-all hover:bg-white/20"
                                >
                                    Analyze Another Folder
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

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
