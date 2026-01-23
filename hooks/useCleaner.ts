import React, { useState } from 'react';
import axios from 'axios';
import type { CleaningStats, UploadedFolder, Status } from '../library/types';
import traverseDirectory from '../utils/traverser';
import type { AnalysisResult } from '../library/types';
export default function useCleaner() {
    /* ---------- State ---------- */
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [uploadedFolder, setUploadedFolder] = useState<UploadedFolder | null>(
        null
    );
    const [status, setStatus] = useState<Status>('idle'); // idle, uploading, processing, complete, error
    const [cleaningStats, setCleaningStats] = useState<CleaningStats | null>(
        null
    );
    const [downloadURL, setDownloadURL] = useState<string | null>(null);
    const [openPopup, setOpenPopUp] = useState(false);
    // MERGER.TSX
    //const [status, setStatus] = useState<ProcessingStatus>('idle');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [progress, setProgress] = useState(0);
    /* ---------- Handlers ---------- */
    const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const currentTarget = event.currentTarget;
        const relatedTarget = event.relatedTarget as Node | null;
        if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleDrop = async (
        event: React.DragEvent<HTMLDivElement>,
        path: string
    ) => {
        event.preventDefault();

        setIsDragging(false);
        console.log('[FRONTEND] drop event triggered');
        setStatus('uploading');
        setProgress(0);
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return prev;
                return prev + 3;
            });
        }, 100);
        try {
            const files: File[] = [];
            let folderName = 'folder';
            const items = event.dataTransfer.items;
            console.log(`[FRONTEND] ${items.length} items in drop`);
            if (items && items.length > 0) {
                for (const item of items) {
                    if (item.kind === 'file') {
                        const entry = item.webkitGetAsEntry();
                        if (entry && entry.isDirectory) {
                            const dirEntry = entry as FileSystemDirectoryEntry;
                            // capture the folder name locally so we can reliably send it
                            folderName = dirEntry.name;
                            setUploadedFolder({
                                name: dirEntry.name,
                                files: [],
                            });
                            console.log(
                                `[FRONTEND] processing folder ${dirEntry.name}`
                            );
                            const dirFiles = await traverseDirectory(dirEntry);
                            console.log(
                                `[FRONTEND] ${dirFiles.length} found in folder`
                            );
                            files.push(...dirFiles);
                        }
                    }
                }
            }

            const formData = new FormData();
            formData.append(
                'folderName',
                folderName || uploadedFolder?.name || 'folder'
            );
            files.forEach((file) => formData.append('files', file, file.name));
            setStatus('processing');
            const start = Date.now();
            console.log(`[FRONTEND] sending files to backend`);
            const response = await axios.post(
                `http://localhost:5000/api/${path}`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );
            console.log(
                `[FRONTEND] backend responded in ${Date.now() - start}ms`
            );
            clearInterval(progressInterval);
            setProgress(100);

            setCleaningStats(response.data.stats);
            setDownloadURL(response.data.downloadURL);
            setStatus('complete');
            setOpenPopUp(true);
        } catch (error) {
            clearInterval(progressInterval);
            console.error(error);
            setStatus('error');
        }
    };
    const processFiles = async (files: File[]) => {
        setStatus('uploading');
        setProgress(0);

        // Smooth upload progress animation
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + 5;
            });
        }, 100);

        await new Promise((resolve) => setTimeout(resolve, 2000));
        clearInterval(progressInterval);
        setProgress(100);

        setStatus('processing');

        // Simulate backend processing
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // TODO: Replace with actual backend response
        // const data = await response.json();
        // setResult(data);

        // Mock result
        const mockResult: AnalysisResult = {
            filesProcessed: files.length,
            pdfUrl: 'https://example.com/report.pdf', // Replace with actual PDF URL from backend
        };

        setResult(mockResult);
        setStatus('complete');
    };
    console.log(`[FRONTEND] download url ${downloadURL}`);

    const handleDownload = () => {
        if (!downloadURL) return;
        const link = document.createElement('a');
        link.href = downloadURL;
        link.download = downloadURL.split('/').pop() || 'cleaned.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setUploadedFolder(null);
        setStatus('idle');
        setCleaningStats(null);
    };
    const resetMergerUpload = () => {
        setStatus('idle');
        setResult(null);
        setProgress(0);
    };
    return {
        isDragging,
        uploadedFolder,
        status,
        progress,
        result,
        cleaningStats,
        downloadURL,
        openPopup,
        setOpenPopUp,
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDrop,
        handleDownload,
        handleReset,
        resetMergerUpload,
        processFiles,
    };
}
