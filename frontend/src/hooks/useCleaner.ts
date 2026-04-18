import React, { useRef, useState } from 'react';
import axios from 'axios';
import { fileCleanerApi, welcomePageApi } from '../library/client';
import authApi from '../library/authApi';
import type { UploadedFolder, Status, UploadLimitResult } from '../types/types';
import traverseDirectory from '../utils/traverser';
import type { AnalysisResult } from '../types/types';
import useErrorStore from '../Store/ErrorStore';
import createClientLogger from '../utils/clientLogger';
import handleApiError from '../utils/apiError';
import { useTierStore } from '../Store/tierStore';
//import { TIER_CONFIG } from '../library/tier';
//import { AxiosError } from 'axios';
import { useGeneralStore } from '../Store/generalStore';
import type { BackendError, UnknownApiError } from '../types/types';
import { uploadLimiter } from '../utils/uploadLimiter';
import { useTransactions } from '../Store/TransactionStore';
import { useWalletStore } from '../Store/walletStore';
import { cleanerChargeAmountKes } from '../constants/cleanerPricing';
import { pollFolderCleanPayment } from '../utils/pollPayHeroPayment';

const log = createClientLogger('UseCleaner.tsx');

/** Routes that require Pay & Process (wallet-first with STK fallback). */
const FOLDER_CLEANER_PATH = 'processFolder';
const QUESTION_MERGER_PATH = 'merge-files';
const PAID_UPLOAD_PATHS = new Set([FOLDER_CLEANER_PATH, QUESTION_MERGER_PATH]);

/** Returns charge payload or null if blocked (error already set). */
async function chargeWalletForCleanerUpload(
    fileCount: number
): Promise<{ amount: number; chargeReference: string } | null> {
    const amount = cleanerChargeAmountKes(fileCount);
    const { hasSufficientFunds, balance, setBalanceFromServer } =
        useWalletStore.getState();
    const { setError } = useErrorStore.getState();
    if (!hasSufficientFunds(amount)) {
        setError(
            `Insufficient balance. This process costs KES ${amount.toFixed(2)}, but you only have KES ${balance.toFixed(2)}.`
        );
        return null;
    }
    try {
        const { data } = await authApi.post<{
            status: string;
            amount: number;
            chargeReference: string;
            walletBalance: number;
        }>('/payment/wallet/charge-folder-clean', { fileCount });
        setBalanceFromServer(Number(data.walletBalance ?? 0));
        if (!data.chargeReference) {
            setError('Could not confirm wallet charge reference.');
            return null;
        }
        return {
            amount: Number(data.amount ?? amount),
            chargeReference: data.chargeReference,
        };
    } catch (error) {
        let msg = 'Could not charge wallet for this service.';
        if (axios.isAxiosError(error)) {
            const d = error.response?.data as
                | { message?: string; error?: { message?: string } }
                | undefined;
            msg =
                d?.error?.message ||
                (typeof d?.message === 'string' ? d.message : null) ||
                error.message ||
                msg;
        } else if (error instanceof Error) {
            msg = error.message;
        }
        setError(msg);
        return null;
    }
}

export default function useCleaner() {
    const { setError } = useErrorStore();
    /* ---------- State ---------- */
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [uploadedFolder, setUploadedFolder] = useState<UploadedFolder | null>(
        null
    );
    const [status, setStatus] = useState<Status>('idle'); // idle, uploading, processing, complete, error
    const [isWorkSheet, setIsWorkSheet] = useState(false);
    const [downloadURL, setDownloadURL] = useState<string | null>(null);
    const [openPopup, setOpenPopUp] = useState(false);
    const [upgradeModal, setUpgradeModal] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [progress, setProgress] = useState(0);
    const [isExpired, setIsExpired] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    /** Staged folder cleaner job: pay + upload runs only after "Pay & Process". */
    const pendingCleanRef = useRef<{
        files: File[];
        folderName: string;
        path: string;
        uploadLimit: UploadLimitResult;
    } | null>(null);
    const payProcessInFlight = useRef(false);
    const tierId = useTierStore((state) => state.tierId);
    const fileNoCheck = useTransactions((state) => state.fileNoCheck);
    /*const CURRENT_LIMIT =
        TIER_CONFIG[tierId as keyof typeof TIER_CONFIG]?.maxUploads;*/

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

    const stopProgressInterval = (
        progressInterval: ReturnType<typeof setInterval>
    ) => {
        clearInterval(progressInterval);
        setProgress(0);
    };

    const applyUploadApiError = (
        error: unknown,
        resumeAwaitingPayment = false
    ) => {
        const goIdleOrAwaiting = () =>
            setStatus(resumeAwaitingPayment ? 'awaiting_payment' : 'idle');

        let serverStatus: number | undefined;
        let serverData: BackendError | undefined;

        const potentialError = error as UnknownApiError;

        if (potentialError?.response) {
            serverStatus = potentialError.response.status;
            const rawData = potentialError.response?.data;
            serverData =
                typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        } else if (potentialError?.status) {
            serverStatus = potentialError.status;
            const rawData = potentialError?.data;
            serverData =
                typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        }

        log.debug('Manually extracted shape:', {
            data: { serverStatus, serverData },
        });
        log.error('Error in processing files', {
            data: { serverStatus, serverData },
        });
        log.debug(`What is the server status code: ${serverStatus}`);
        log.debug(`Does it contain an expired flag: ${potentialError.type}`);

        if (serverStatus === 503) {
            goIdleOrAwaiting();
            setProgress(0);
            setUpgradeModal(true);
            handleApiError(error, setError);
            return;
        }
        if (serverStatus === 409) {
            goIdleOrAwaiting();
            setUpgradeModal(true);
            handleApiError(serverData, setError);
            return;
        }
        if (
            serverStatus === 403 &&
            potentialError?.type === 'SUBSCRIPTION_EXPIRED'
        ) {
            setIsExpired(true);
            setTimeout(() => {
                goIdleOrAwaiting();
            }, 1500);
            return;
        }
        handleApiError(error, setError);
        setStatus('error');
        setTimeout(() => {
            goIdleOrAwaiting();
        }, 1500);
    };

    /** Multipart upload + usage sync (wallet charge handled by caller if needed). */
    const executeFolderUploadToBackend = async (
        files: File[],
        folderName: string,
        path: string,
        uploadLimit: UploadLimitResult,
        progressInterval: ReturnType<typeof setInterval>,
        chargedWallet: { amount: number; chargeReference: string } | null,
        resumeAwaitingPaymentOnError: boolean,
        clearPendingCleanOnSuccess: boolean
    ) => {
        try {
            const formData = new FormData();
            formData.append('folderName', folderName || 'folder');
            files.forEach((file) => formData.append('files', file, file.name));
            setStatus('processing');

            const start = Date.now();
            log.info('Sending files to backend');
            const storage = localStorage.getItem('auth-storage');
            if (!storage) {
                stopProgressInterval(progressInterval);
                setError('Not authenticated');
                setStatus(
                    resumeAwaitingPaymentOnError ? 'awaiting_payment' : 'idle'
                );
                return;
            }
            const parsed = JSON.parse(storage);
            const userId = parsed.state.user.id;
            const response = await fileCleanerApi.post(
                `/${path}?tierId=${tierId}&isWorkSheet=${isWorkSheet}&userId=${userId}`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );
            const res = response.data;
            log.debug('This is the response from my backend', {
                data: { res },
            });

            if (uploadLimit.allowed) {
                const today = new Date().toDateString();
                const stats = uploadLimit.stats || {
                    count: 0,
                    lastDate: today,
                };
                const newStats = {
                    count: stats.count + 1,
                    lastDate: today,
                };
                localStorage.setItem('upload-stats', JSON.stringify(newStats));
                log.info('Local limit updated instantly');
                try {
                    await welcomePageApi.patch('/increment-usage');
                    log.info('Usage count synced to cloud');
                } catch (err) {
                    log.error('Failed to sync usage count', { data: { err } });
                }
            }

            if (response.data.expired) {
                log.debug(
                    `Is expired sent from the backend ${response.data.isExpired ? 'YES' : 'NO'}`
                );
                setIsExpired(true);
            }

            log.highlight(
                `[FRONTEND] backend responded in ${Date.now() - start}ms`
            );
            log.highlight(
                `[LINK] download link from the backend ${response.data.downloadURL}`
            );
            clearInterval(progressInterval);
            setProgress(100);
            useGeneralStore.getState().setCleaningStats(response.data.stats);
            setDownloadURL(response.data.downloadURL);
            setStatus('complete');
            if (clearPendingCleanOnSuccess) {
                pendingCleanRef.current = null;
            }
        } catch (error) {
            clearInterval(progressInterval);
            log.error('Error in processing files', { data: { error } });
            if (chargedWallet !== null) {
                try {
                    const refundRes = await authApi.post<{
                        walletBalance?: number;
                    }>('/payment/wallet/refund-charge', {
                        chargeReference: chargedWallet.chargeReference,
                        reason: 'upload_failed',
                    });
                    if (typeof refundRes.data?.walletBalance === 'number') {
                        useWalletStore
                            .getState()
                            .setBalanceFromServer(refundRes.data.walletBalance);
                    }
                } catch (refundErr) {
                    log.error('Wallet refund failed after upload failure', {
                        data: { refundErr },
                    });
                }
            }
            applyUploadApiError(error, resumeAwaitingPaymentOnError);
        }
    };

    /**
     * Merger / immediate upload: count + folder state, then POST (no wallet).
     * Folder cleaner uses staging + confirmPayAndProcessFolder instead.
     */
    const processFolderUploadPipeline = async (
        files: File[],
        folderName: string,
        path: string,
        uploadLimit: UploadLimitResult,
        progressInterval: ReturnType<typeof setInterval>
    ) => {
        useErrorStore.getState().clearError();
        fileNoCheck(files.length);
        setUploadedFolder({ name: folderName, files });

        await executeFolderUploadToBackend(
            files,
            folderName,
            path,
            uploadLimit,
            progressInterval,
            null,
            false,
            false
        );
    };

    const confirmPayAndProcessFolder = async (mpesaPhone: string) => {
        if (payProcessInFlight.current) return;
        const pending = pendingCleanRef.current;
        if (
            !pending ||
            !PAID_UPLOAD_PATHS.has(pending.path) ||
            pending.files.length === 0
        ) {
            setError('Select a folder first.');
            return;
        }

        const totalCost = cleanerChargeAmountKes(pending.files.length);

        payProcessInFlight.current = true;
        try {
            useErrorStore.getState().clearError();
            setStatus('uploading');
            setProgress(0);
            const progressInterval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 95) return prev;
                    return prev + 3;
                });
            }, 100);

            try {
                try {
                    const prof = await welcomePageApi.get<{
                        walletBalance?: number;
                    }>('/fetch-profile');
                    if (typeof prof.data?.walletBalance === 'number') {
                        useWalletStore
                            .getState()
                            .setBalanceFromServer(prof.data.walletBalance);
                    }
                } catch (syncErr) {
                    log.warn('Wallet sync skipped', { data: { syncErr } });
                }

                const { hasSufficientFunds } = useWalletStore.getState();

                if (hasSufficientFunds(totalCost)) {
                    const chargedWallet = await chargeWalletForCleanerUpload(
                        pending.files.length
                    );
                    if (chargedWallet === null) {
                        stopProgressInterval(progressInterval);
                        setStatus('awaiting_payment');
                        return;
                    }
                    await executeFolderUploadToBackend(
                        pending.files,
                        pending.folderName,
                        pending.path,
                        pending.uploadLimit,
                        progressInterval,
                        chargedWallet,
                        true,
                        true
                    );
                    return;
                }

                const phone = mpesaPhone.trim();
                const digits = phone.replace(/\D/g, '');
                if (digits.length < 9) {
                    stopProgressInterval(progressInterval);
                    setStatus('awaiting_payment');
                    setError(
                        'Your wallet balance is too low for this job. Enter a valid M-Pesa phone number to top up via STK, or add funds from the Wallet page first.'
                    );
                    return;
                }

                const initRes = await authApi.post<{
                    status?: boolean;
                    data?: {
                        reference: string;
                        amount: number;
                        fileCount: number;
                    };
                    message?: string;
                }>('/payment/folder-clean/initiate', {
                    phoneNumber: phone,
                    fileCount: pending.files.length,
                });

                const reference = initRes.data?.data?.reference;
                if (!reference) {
                    throw new Error(
                        initRes.data?.message ||
                            'Could not start M-Pesa payment. Try again.'
                    );
                }

                const { walletBalance } =
                    await pollFolderCleanPayment(reference);
                useWalletStore.getState().setBalanceFromServer(walletBalance);

                const chargedWallet = await chargeWalletForCleanerUpload(
                    pending.files.length
                );
                if (chargedWallet === null) {
                    stopProgressInterval(progressInterval);
                    setStatus('awaiting_payment');
                    return;
                }

                await executeFolderUploadToBackend(
                    pending.files,
                    pending.folderName,
                    pending.path,
                    pending.uploadLimit,
                    progressInterval,
                    chargedWallet,
                    true,
                    true
                );
            } catch (err: unknown) {
                stopProgressInterval(progressInterval);
                let msg = 'Payment or upload failed. Please try again.';
                if (axios.isAxiosError(err)) {
                    const d = err.response?.data as
                        | { message?: string; error?: { message?: string } }
                        | undefined;
                    msg =
                        d?.error?.message ||
                        (typeof d?.message === 'string' ? d.message : null) ||
                        err.message ||
                        msg;
                } else if (err instanceof Error) {
                    msg = err.message;
                }
                setError(msg);
                log.error('Pay & Process failed', { data: { err } });
                setStatus('awaiting_payment');
            }
        } finally {
            payProcessInFlight.current = false;
        }
    };

    // handle click on folder select button
    const handleFolderSelectClick = () => {
        fileInputRef.current?.click();
    };

    const handleFolderInputChange = async (
        event: React.ChangeEvent<HTMLInputElement>,
        path: string
    ) => {
        log.debug(`Current tierId ${tierId}`);
        const files = event.target.files;
        if (!files || files.length === 0) {
            setError('No folder input');
            return;
        }

        /*const MAX_UPLOADS =
            TIER_CONFIG[tierId as keyof typeof TIER_CONFIG].maxUploads;*/

        try {
            const firstFile = files[0];
            log.highlight('First file', { data: firstFile });
            const folderName = firstFile.webkitRelativePath.split('/')[0];
            log.highlight('Folder name', { data: folderName });
            const fileArray = Array.from(files);
            const uploadLimit = uploadLimiter(fileArray.length);
            if (!uploadLimit.allowed) {
                setError(
                    'Daily limit reached for large files. Resets at midnight.'
                );
                setStatus('idle');
                return;
            }
            /*if (fileArray.length > CURRENT_LIMIT) {
                setError(
                    `You're trying to upload ${fileArray.length} files, but your current plan supports ${CURRENT_LIMIT}.`
                );
                setUpgradeModal(true);
                setStatus('idle');
                return;
            }*/

            if (PAID_UPLOAD_PATHS.has(path)) {
                log.info(`Folder selected via input — staging for payment`);
                useErrorStore.getState().clearError();
                fileNoCheck(fileArray.length);
                setUploadedFolder({ name: folderName, files: fileArray });
                pendingCleanRef.current = {
                    files: fileArray,
                    folderName,
                    path,
                    uploadLimit,
                };
                setStatus('awaiting_payment');
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
            try {
                await processFolderUploadPipeline(
                    fileArray,
                    folderName,
                    path,
                    uploadLimit,
                    progressInterval
                );
            } catch (error) {
                stopProgressInterval(progressInterval);
                log.error('Error in processing files', { data: { error } });
                applyUploadApiError(error, false);
            }
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
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
        let uploadLimit: UploadLimitResult = {
            allowed: true,
        };
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return prev;
                return prev + 3;
            });
        }, 100);

        try {
            const startTime = Date.now();
            const files: File[] = [];
            let folderName = 'folder';
            const items = event.dataTransfer.items;
            log.info(`[FRONTEND] ${items.length} items in drop`);

            if (items.length > 1) {
                setError(
                    `${items.length} folders detected. Kindly upload one at a time`
                );
                stopProgressInterval(progressInterval);
                setStatus('idle');
                setIsDragging(false);
                return;
            }

            if (items && items.length > 0) {
                for (const item of items) {
                    if (item.kind === 'file') {
                        const entry = item.webkitGetAsEntry();
                        if (entry?.isFile) {
                            setError('Kindly drop a folder');
                            stopProgressInterval(progressInterval);
                            setStatus('idle');
                            setIsDragging(false);
                            return;
                        }
                        if (entry && entry.isDirectory) {
                            const dirEntry = entry as FileSystemDirectoryEntry;
                            folderName = dirEntry.name;
                            log.info(
                                `[FRONTEND] processing folder ${dirEntry.name}`
                            );
                            const dirFiles = await traverseDirectory(dirEntry);
                            /*if (dirFiles.length > CURRENT_LIMIT) {
                                log.debug(
                                    `The limit detected after ${Date.now() - startTime}ms`
                                );
                                setError(
                                    `You're trying to upload ${dirFiles.length} files, but your current plan supports ${CURRENT_LIMIT}.`
                                );
                                setUpgradeModal(true);
                                stopProgressInterval(progressInterval);
                                setStatus('idle');
                                setIsDragging(false);
                                return;
                            }*/
                            uploadLimit = uploadLimiter(dirFiles.length);
                            log.debug('Upload limit', { data: uploadLimit });
                            if (!uploadLimit.allowed) {
                                setError(
                                    'Daily limit reached for large files. Resets at midnight.'
                                );
                                stopProgressInterval(progressInterval);
                                setStatus('idle');
                                setIsDragging(false);
                                return;
                            }

                            log.info(
                                `[FRONTEND] ${dirFiles.length} found in folder`
                            );
                            files.push(...dirFiles);
                        }
                    }
                }
            }

            if (files.length === 0) {
                setError('Kindly drop a folder');
                stopProgressInterval(progressInterval);
                setStatus('idle');
                return;
            }

            if (PAID_UPLOAD_PATHS.has(path)) {
                stopProgressInterval(progressInterval);
                useErrorStore.getState().clearError();
                fileNoCheck(files.length);
                setUploadedFolder({ name: folderName, files });
                pendingCleanRef.current = {
                    files,
                    folderName,
                    path,
                    uploadLimit,
                };
                setStatus('awaiting_payment');
                return;
            }

            await processFolderUploadPipeline(
                files,
                folderName,
                path,
                uploadLimit,
                progressInterval
            );
        } catch (error) {
            stopProgressInterval(progressInterval);
            log.error('Error in processing files', { data: { error } });
            applyUploadApiError(error);
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
        pendingCleanRef.current = null;
        setUploadedFolder(null);
        setStatus('idle');
        useTransactions.getState().fileNoCheck(0);
        useGeneralStore.getState().resetStats();
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
        downloadURL,
        openPopup,
        fileInputRef,
        upgradeModal,
        isWorkSheet,
        isExpired,
        setIsExpired,
        setUpgradeModal,
        setIsWorkSheet,
        handleFolderInputChange,
        handleFolderSelectClick,
        setOpenPopUp,
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDrop,
        handleDownload,
        handleReset,
        setStatus,
        resetMergerUpload,
        confirmPayAndProcessFolder,
    };
}
