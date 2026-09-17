import axios from 'axios';
import { walletApi } from '../library/client';
import createClientLogger from './clientLogger';

const POLL_MAX_MS = 180_000;
const POLL_INITIAL_DELAY_MS = 3500;
const POLL_MAX_ATTEMPTS = 60;
const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));
const log = createClientLogger('PollPayheroPayment.ts');
const parseRetryAfterMs = (value: unknown, fallbackMs = 2000): number => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.max(value * 1000, fallbackMs);
    }

    if (typeof value === 'string') {
        const seconds = Number(value);
        if (Number.isFinite(seconds)) {
            return Math.max(seconds * 1000, fallbackMs);
        }

        const parsed = Date.parse(value);
        if (!Number.isNaN(parsed)) {
            return Math.max(parsed - Date.now(), fallbackMs);
        }
    }

    return fallbackMs;
};

const toFiniteNumber = (value: unknown, fallback = 0): number => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
};

type PollStatusResponse = {
    status?:
        | 'QUEUED'
        | 'PENDING'
        | 'PROCESSING'
        | 'SUCCESS'
        | 'FAILED'
        | 'CANCELLED';
    walletBalance?: number | string;
    amount?: number | string;
    reason?: string;
};

type PollUntilResolvedOptions = {
    signal?: AbortSignal;
    maxDurationMs?: number;
    initialDelayMs?: number;
    maxAttempts?: number;
};

async function pollUntilResolved(
    statusPathBuilder: (reference: string) => string,
    reference: string,
    options: PollUntilResolvedOptions = {}
): Promise<{ walletBalance: number; amount: number }> {
    const {
        signal,
        maxDurationMs = POLL_MAX_MS,
        initialDelayMs = POLL_INITIAL_DELAY_MS,
        maxAttempts = POLL_MAX_ATTEMPTS,
    } = options;

    await sleep(initialDelayMs);

    const startedAt = Date.now();
    let delayMs = 2000;
    let attempts = 0;

    while (Date.now() - startedAt < maxDurationMs && attempts < maxAttempts) {
        if (signal?.aborted) {
            throw new DOMException(
                'Payment polling was cancelled',
                'AbortError'
            );
        }

        try {
            log.debug("Data before the endpoint ",{
                        data:{
                            reference,options,
                            attempts
                        }
                    })
            const { data } = await walletApi.get<PollStatusResponse>(
                statusPathBuilder(reference)
            );
            const status = data?.status ?? 'PROCESSING';
            log.debug(`The status sent from the backend ${status}`);
            log.debug('Full data sent ', {
                data,
            });

            if (status === 'SUCCESS') {
                log.highlight('The payment is successful');
                return {
                    walletBalance: toFiniteNumber(data?.walletBalance, 0),
                    amount: toFiniteNumber(data?.amount, 0),
                };
            }

            if (status === 'FAILED' || status === 'CANCELLED') {
                throw new Error(
                    data?.reason || 'M-Pesa payment was not completed.'
                );
            }

            attempts += 1;
            await sleep(delayMs);
            delayMs = Math.min(Math.round(delayMs * 1.5), 12000);
        } catch (error) {
            if (signal?.aborted) {
                throw new DOMException(
                    'Payment polling was cancelled',
                    'AbortError'
                );
            }

            if (axios.isAxiosError(error)) {
                const statusCode = error.response?.status;

                if (statusCode === 404) {
                    attempts += 1;
                    await sleep(Math.min(delayMs, 6000));
                    continue;
                }
                log.warn(`Status code ${statusCode}`);
                if (statusCode === 429) {
                    const payload = error.response?.data;
                    log.debug('PAYLOAD', { data: payload });
                    log.debug("retry data",{
                        data:{
                            reference:payload?.reference,
                            statusCode,
                            retryAfter:error?.response?.headers?.['retry-after'],
                            attempts
                        }
                    })
                    if (payload?.status === 'SUCCESS') {
                        return {
                            walletBalance: toFiniteNumber(
                                payload?.walletBalance,
                                0
                            ),
                            amount: toFiniteNumber(payload?.amount, 0),
                        };
                    }
                    const retryAfterMs = parseRetryAfterMs(
                        error.response?.headers?.['retry-after']
                    );
                    attempts += 1;
                    await sleep(Math.min(retryAfterMs, 15000));
                    continue;
                }

                if (statusCode && statusCode >= 500 && statusCode < 600) {
                    attempts += 1;
                    await sleep(Math.min(delayMs, 8000));
                    continue;
                }
            }

            throw error;
        }
    }

    throw new Error(
        'Payment was not confirmed in time. If you completed M-Pesa on your phone, wait a moment and try again.'
    );
}

export async function pollFolderCleanPayment(
    reference: string,
    options?: PollUntilResolvedOptions
): Promise<{ walletBalance: number; amount: number }> {
    return pollUntilResolved(
        (ref) => `/payment/folder-clean/status/${encodeURIComponent(ref)}`,
        reference,
        options
    );
}

export async function pollWalletTopupPayment(
    reference: string,
    options?: PollUntilResolvedOptions
): Promise<{ walletBalance: number; amount: number }> {
    return pollUntilResolved(
        (ref) => `/payment/wallet-topup/status/${encodeURIComponent(ref)}`,
        reference,
        options
    );
}

export async function pollFileMergerPayment(
    reference: string,
    options?: PollUntilResolvedOptions
): Promise<{ walletBalance: number; amount: number }> {
    return pollUntilResolved(
        (ref) => `/payment/file-merger/status/${encodeURIComponent(ref)}`,
        reference,
        options
    );
}
