import axios from 'axios';
import { walletApi } from '../library/client';

const POLL_MAX_MS = 180_000;
/** PayHero often returns 404 until the STK row is indexed — wait before first status call. */
const POLL_INITIAL_DELAY_MS = 3500;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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

type PollStatusResponse = {
    status: 'QUEUED' | 'SUCCESS' | 'FAILED';
    walletBalance?: number;
    amount?: number;
    reason?: string;
};

async function pollUntilResolved(
    statusPathBuilder: (reference: string) => string,
    reference: string
): Promise<{ walletBalance: number; amount: number }> {
    await sleep(POLL_INITIAL_DELAY_MS);
    const started = Date.now();
    let delayMs = 2000;

    while (Date.now() - started < POLL_MAX_MS) {
        try {
            const { data } = await walletApi.get<PollStatusResponse>(
                statusPathBuilder(reference)
            );

            if (data.status === 'SUCCESS') {
                return {
                    walletBalance: Number(data.walletBalance ?? 0),
                    amount: Number(data.amount ?? 0),
                };
            }

            if (data.status === 'FAILED') {
                throw new Error(
                    data.reason || 'M-Pesa payment was not completed.'
                );
            }

            await sleep(delayMs);
            delayMs = Math.min(Math.round(delayMs * 1.5), 12000);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 429) {
                const retryAfterMs = parseRetryAfterMs(
                    error.response.headers?.['retry-after']
                );
                await sleep(Math.min(retryAfterMs, 15000));
                continue;
            }

            throw error;
        }
    }

    throw new Error(
        'Payment was not confirmed in time. If you completed M-Pesa on your phone, wait a moment and try again.'
    );
}

export async function pollFolderCleanPayment(reference: string): Promise<{
    walletBalance: number;
    amount: number;
}> {
    return pollUntilResolved(
        (ref) => `/payment/folder-clean/status/${encodeURIComponent(ref)}`,
        reference
    );
}

export async function pollWalletTopupPayment(reference: string): Promise<{
    walletBalance: number;
    amount: number;
}> {
    return pollUntilResolved(
        (ref) => `/payment/wallet-topup/status/${encodeURIComponent(ref)}`,
        reference
    );
}

export async function pollFileMergerPayment(reference: string): Promise<{
    walletBalance: number;
    amount: number;
}> {
    return pollUntilResolved(
        (ref) => `/payment/file-merger/status/${encodeURIComponent(ref)}`,
        reference
    );
}
