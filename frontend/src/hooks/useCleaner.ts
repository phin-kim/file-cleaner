import React, { useRef, useState } from 'react';
import { fileCleanerApi, subscriptionApi } from '../library/client';
import type { CleaningStats, UploadedFolder, Status } from '../types/types';
import traverseDirectory from '../utils/traverser';
import type { AnalysisResult } from '../types/types';
import useErrorStore from '../Store/ErrorStore';
import createClientLogger from '../utils/clientLogger';
import handleApiError from '../utils/apiError';
import { useTierStore } from '../Store/tierStore';
import { TIER_CONFIG } from '../../../shared/tiers';
const log = createClientLogger('UseCleaner.tsx');
export default function useCleaner() {
    const { setError } = useErrorStore();
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
    const [upgradeModal, setUpgradeModal] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const tierId = useTierStore.getState().tierId;
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
    // handle click on folder select button
    const handleFolderSelectClick = () => {
        //trigger the file input click
        fileInputRef.current?.click();
    };
    // handle folder selection via file input
    const handleFolderInputChange = async (
        event: React.ChangeEvent<HTMLInputElement>,
        path: string
    ) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
            setError('No folder input');
            return;
        }
        log.info(`Folder selected via input`);
        setStatus('uploading');
        setProgress(0);
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return prev;
                return prev + 3;
            });
        }, 100);
        // get the max uploads for the user and use that as a gate

        const MAX_UPLOADS =
            TIER_CONFIG[tierId as keyof typeof TIER_CONFIG].maxUploads;
        log.info(`Confirming the max uploads based on the tier ${MAX_UPLOADS}`);

        try {
            //get folder name from the first file path
            const firstFile = files[0];
            log.highlight('First file', { data: firstFile });
            //webkit relative path includes the folder name: "folderName/filename.ext"
            const folderName = firstFile.webkitRelativePath.split('/')[0];
            log.highlight('Folder name', { data: folderName });
            const fileArray = Array.from(files);

            // Check file limit before uploading
            /*if (fileArray.length > MAX_UPLOADS) {
                setError(
                    `${fileArray.length} files. Kindly upgrade to premium`
                );
                setUpgradeModal(true);
                setStatus('idle');
                return;
            }*/

            setUploadedFolder({
                name: folderName,
                files: fileArray,
            });
            //convert file list to array for form data
            const formData = new FormData();
            formData.append('folderName', folderName);

            fileArray.forEach((file) =>
                formData.append('files', file, file.name)
            );
            setStatus('processing');
            const start = Date.now();
            log.info('Sending files to backend');
            log.debug(`form data ${formData}`);
            log.warn(`file count${fileArray.length}`);
            const response = await fileCleanerApi.post(
                `/${path}?tierId=${tierId}`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );
            if (response.data.subscription) {
                log.info(
                    `Checking if the subscription is there ${response.data.subscription ? 'yes' : 'no'}`
                );
                setUpgradeModal(true);
                setStatus('idle');
                return;
            }
            log.highlight(
                `[FRONTEND] backend responded in ${Date.now() - start}ms`
            );
            log.highlight(
                `[LINK] download link from the backend ${response.data.downloadURL}`
            );

            clearInterval(progressInterval);
            setProgress(100);

            setCleaningStats(response.data.stats);
            setDownloadURL(response.data.downloadURL);
            setStatus('complete');

            /*if (path === 'processFolder') {
                setOpenPopUp(true);
            }*/

            // Reset file input so same folder can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            clearInterval(progressInterval);
            log.error('Error in processing files', { data: { error } });
            handleApiError(error, setError);
            setStatus('error');
            setTimeout(() => {
                setStatus('idle');
            }, 1500);
        }
    };
    const handleDrop = async (
        event: React.DragEvent<HTMLDivElement>,
        path: string
    ) => {
        event.preventDefault();

        setIsDragging(false);
        log.highlight('[FRONTEND] drop event triggered');
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
            log.info(`[FRONTEND] ${items.length} items in drop`);
            if (items.length > 1) {
                setError(
                    `${items.length} folders detected. Kindly upload one at a time`
                );
                setTimeout(() => {
                    setStatus('idle');
                    setIsDragging(false);
                }, 2000);

                return;
            }
            if (items && items.length > 0) {
                for (const item of items) {
                    if (item.kind === 'file') {
                        const entry = item.webkitGetAsEntry();
                        if (entry?.isFile) {
                            setError('Kindly drop a folder');
                            setTimeout(() => {
                                setIsDragging(false);
                                return;
                            }, 2000);
                        }
                        if (entry && entry.isDirectory) {
                            const dirEntry = entry as FileSystemDirectoryEntry;
                            // capture the folder name locally so we can reliably send it
                            folderName = dirEntry.name;
                            setUploadedFolder({
                                name: dirEntry.name,
                                files: [],
                            });
                            log.info(
                                `[FRONTEND] processing folder ${dirEntry.name}`
                            );
                            const dirFiles = await traverseDirectory(dirEntry);
                            /*if (dirFiles.length > 150) {
                                setError(
                                    `${dirFiles.length} files. Kindly upgrade to premium`
                                );
                                setUpgradeModal(true);
                                setStatus('idle');
                                setIsDragging(false);
                                return;
                            }*/

                            log.info(
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
            const response = await fileCleanerApi.post(
                `/${path}?tierId=${tierId}`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );
            if (response.data.subscription) {
                log.info(
                    `Checking if the subscription is there ${response.data.subscription ? 'yes' : 'no'}`
                );
                setUpgradeModal(true);
                setStatus('idle');
                return;
            }

            log.highlight(
                `[FRONTEND] backend responded in ${Date.now() - start}ms`
            );
            log.highlight(
                `[LINK] download link from the backend ${response.data.downloadURL}`
            );
            clearInterval(progressInterval);
            setProgress(100);

            setCleaningStats(response.data.stats);
            setDownloadURL(response.data.downloadURL);

            console.log(`[FRONTEND] download url ${downloadURL}`);

            setStatus('complete');
            /*if (path === 'processFolder') {
                setOpenPopUp(true);
            }*/
        } catch (error) {
            clearInterval(progressInterval);
            log.error('Error in processing files', { data: { error } });
            handleApiError(error, setError);
            setStatus('error');
            setStatus('processing');
            setTimeout(() => {
                setStatus('idle');
            }, 1500);
        }
    };

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
        fileInputRef,
        upgradeModal,
        setUpgradeModal,
        handleFolderInputChange,
        handleFolderSelectClick,
        setOpenPopUp,
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDrop,
        handleDownload,
        handleReset,
        resetMergerUpload,
    };
}
