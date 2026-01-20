import React, { useState } from 'react';
import axios from 'axios';
import type { CleaningStats, UploadedFolder, Status } from '../library/types';
import traverseDirectory from '../utils/traverser';
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

    const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        console.log('[FRONTEND] drop event triggered');
        setStatus('uploading');
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
                'http://localhost:5000/api/processFolder',
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );
            console.log(
                `[FRONTEND] backend responded in ${Date.now() - start}ms`
            );
            setCleaningStats(response.data.stats);
            setDownloadURL(response.data.downloadURL);
            setStatus('complete');
            setOpenPopUp(true);
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
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
    return {
        isDragging,
        uploadedFolder,
        status,
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
    };
}
