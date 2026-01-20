import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    FileText,
    Loader2,
    Download,
    X,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';

interface SimilarGroup {
    files: string[];
    reason: string;
}

interface SimilarityResults {
    similarGroups: SimilarGroup[];
    uniqueFiles: string[];
    mergedContent: string;
}

interface FileContent {
    name: string;
    content: string;
}

export default function FileMergerApp() {
    const [files, setFiles] = useState<File[]>([]);
    const [processing, setProcessing] = useState<boolean>(false);
    const [mergedContent, setMergedContent] = useState<string | null>(null);
    const [similarityResults, setSimilarityResults] =
        useState<SimilarityResults | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFiles = Array.from(e.target.files || []);
        setFiles((prev) => [...prev, ...uploadedFiles]);
        setError(null);
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const readFileContent = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles((prev) => [...prev, ...droppedFiles]);
        setError(null);
    };

    const processFiles = async () => {
        if (files.length === 0) {
            setError('Please upload at least one file');
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            const fileContents: FileContent[] = await Promise.all(
                files.map(async (file) => ({
                    name: file.name,
                    content: await readFileContent(file),
                }))
            );

            const response = await fetch(
                'https://api.anthropic.com/v1/messages',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'claude-sonnet-4-20250514',
                        max_tokens: 4000,
                        messages: [
                            {
                                role: 'user',
                                content: `Analyze these ${files.length} files and determine which ones are similar in content. Files with similar content should be grouped together. Files that are NOT similar should be merged into a final document.

Return ONLY a JSON object with this exact structure (no markdown, no preamble):
{
  "similarGroups": [
    {"files": ["file1.txt", "file2.txt"], "reason": "Both contain X content"}
  ],
  "uniqueFiles": ["file3.txt", "file4.txt"],
  "mergedContent": "The merged content of all unique files..."
}

Files to analyze:
${fileContents.map((f, i) => `\n--- FILE ${i + 1}: ${f.name} ---\n${f.content}\n`).join('\n')}`,
                            },
                        ],
                    }),
                }
            );

            const data = await response.json();
            const aiResponse = data.content[0].text as string;

            const cleanResponse = aiResponse.replace(/```json|```/g, '').trim();
            const result: SimilarityResults = JSON.parse(cleanResponse);

            setSimilarityResults(result);
            setMergedContent(result.mergedContent);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError('Error processing files: ' + message);
        } finally {
            setProcessing(false);
        }
    };

    const downloadFile = (format: 'txt' | 'pdf' | 'doc') => {
        if (!mergedContent) return;

        let blob: Blob | undefined;
        let filename: string | undefined;

        if (format === 'txt') {
            blob = new Blob([mergedContent], { type: 'text/plain' });
            filename = 'merged-document.txt';
        } else if (format === 'pdf') {
            const pdfContent = `
        <html>
          <head><style>body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }</style></head>
          <body>${mergedContent.replace(/\n/g, '<br>')}</body>
        </html>
      `;
            blob = new Blob([pdfContent], { type: 'text/html' });
            filename = 'merged-document.html';
        } else if (format === 'doc') {
            const docContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
          <head><meta charset='utf-8'><title>Merged Document</title></head>
          <body>${mergedContent.replace(/\n/g, '<br>')}</body>
        </html>
      `;
            blob = new Blob([docContent], { type: 'application/msword' });
            filename = 'merged-document.doc';
        }

        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'merged-document';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-purple-900 via-purple-800 to-indigo-900 p-6">
            <div className="mx-auto max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 text-center"
                >
                    <h1 className="mb-2 text-5xl font-bold text-white">
                        AI File Merger
                    </h1>
                    <p className="text-purple-200">
                        Upload files, detect similarities, and merge unique
                        content
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Upload Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-2xl border border-purple-300/20 bg-white/10 p-6 backdrop-blur-lg"
                    >
                        <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-white">
                            <Upload className="h-6 w-6" />
                            Upload Files
                        </h2>

                        <label className="block">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                className="hidden"
                                accept=".txt,.doc,.docx"
                            />
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                                    isDragging
                                        ? 'scale-105 border-purple-300 bg-purple-500/20'
                                        : 'border-purple-300/50 bg-purple-500/10 hover:border-purple-300'
                                }`}
                            >
                                <Upload
                                    className={`mx-auto mb-3 h-12 w-12 transition-colors ${
                                        isDragging
                                            ? 'text-purple-200'
                                            : 'text-purple-300'
                                    }`}
                                />
                                <p className="font-medium text-purple-100">
                                    {isDragging
                                        ? 'Drop files here'
                                        : 'Click or drag files to upload'}
                                </p>
                                <p className="mt-1 text-sm text-purple-300">
                                    Support for .txt, .doc files
                                </p>
                            </motion.div>
                        </label>

                        <AnimatePresence>
                            {files.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-4 space-y-2"
                                >
                                    {files.map((file, index) => (
                                        <motion.div
                                            key={`${file.name}-${index}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="group relative overflow-hidden rounded-lg bg-purple-600/30 p-3 transition-transform hover:scale-[1.02]"
                                        >
                                            {/* subtle blurred overlay on hover to match Cleaner UI */}
                                            <div className="pointer-events-none absolute inset-0 bg-white/5 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100" />

                                            <div className="relative flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-purple-300" />
                                                <span className="text-sm text-white">
                                                    {file.name}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() =>
                                                    removeFile(index)
                                                }
                                                className="relative text-purple-300 transition-colors hover:text-white"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/20 p-3"
                            >
                                <AlertCircle className="h-5 w-5 text-red-300" />
                                <p className="text-sm text-red-200">{error}</p>
                            </motion.div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={processFiles}
                            disabled={processing || files.length === 0}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-purple-500 to-indigo-600 py-3 font-semibold text-white transition-all hover:from-purple-600 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-5 w-5" />
                                    Analyze & Merge
                                </>
                            )}
                        </motion.button>
                    </motion.div>

                    {/* Results Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-2xl border border-purple-300/20 bg-white/10 p-6 backdrop-blur-lg"
                    >
                        <h2 className="mb-4 text-2xl font-semibold text-white">
                            Results
                        </h2>

                        {!similarityResults && !processing && (
                            <div className="py-12 text-center">
                                <FileText className="mx-auto mb-3 h-16 w-16 text-purple-300/50" />
                                <p className="text-purple-200">
                                    Upload and process files to see results
                                </p>
                            </div>
                        )}

                        {processing && (
                            <div className="py-12 text-center">
                                <Loader2 className="mx-auto mb-3 h-16 w-16 animate-spin text-purple-300" />
                                <p className="text-purple-200">
                                    AI is analyzing your files...
                                </p>
                            </div>
                        )}

                        <AnimatePresence>
                            {similarityResults && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-4"
                                >
                                    {similarityResults.similarGroups?.length >
                                        0 && (
                                        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/20 p-4">
                                            <h3 className="mb-2 flex items-center gap-2 font-semibold text-yellow-200">
                                                <AlertCircle className="h-5 w-5" />
                                                Similar Files Detected
                                            </h3>
                                            {similarityResults.similarGroups.map(
                                                (group, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="mt-2"
                                                    >
                                                        <p className="text-sm text-yellow-100">
                                                            {group.files.join(
                                                                ', '
                                                            )}
                                                        </p>
                                                        <p className="mt-1 text-xs text-yellow-200/70">
                                                            {group.reason}
                                                        </p>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                    {similarityResults.uniqueFiles?.length >
                                        0 && (
                                        <div className="rounded-lg border border-green-500/50 bg-green-500/20 p-4">
                                            <h3 className="mb-2 flex items-center gap-2 font-semibold text-green-200">
                                                <CheckCircle className="h-5 w-5" />
                                                Unique Files Merged
                                            </h3>
                                            <p className="text-sm text-green-100">
                                                {similarityResults.uniqueFiles.join(
                                                    ', '
                                                )}
                                            </p>
                                        </div>
                                    )}

                                    {mergedContent && (
                                        <div className="max-h-64 overflow-y-auto rounded-lg bg-purple-600/30 p-4">
                                            <h3 className="mb-2 font-semibold text-purple-200">
                                                Merged Content Preview
                                            </h3>
                                            <p className="text-sm whitespace-pre-wrap text-white">
                                                {mergedContent.substring(
                                                    0,
                                                    500
                                                )}
                                                ...
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => downloadFile('txt')}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
                                        >
                                            <Download className="h-4 w-4" />
                                            TXT
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => downloadFile('pdf')}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
                                        >
                                            <Download className="h-4 w-4" />
                                            HTML
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => downloadFile('doc')}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
                                        >
                                            <Download className="h-4 w-4" />
                                            DOC
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
