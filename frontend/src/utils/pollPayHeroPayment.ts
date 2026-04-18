import authApi from '../library/authApi';

const POLL_MAX_MS = 180_000;
/** PayHero often returns 404 until the STK row is indexed — wait before first status call. */
const POLL_INITIAL_DELAY_MS = 3500;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type PollStatusResponse = {
    status: 'pending' | 'success' | 'failed';
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
        const { data } = await authApi.get<PollStatusResponse>(
            statusPathBuilder(reference)
        );
        if (data.status === 'success') {
            return {
                walletBalance: Number(data.walletBalance ?? 0),
                amount: Number(data.amount ?? 0),
            };
        }
        if (data.status === 'failed') {
            throw new Error(data.reason || 'M-Pesa payment was not completed.');
        }
        await sleep(delayMs);
        delayMs = Math.min(Math.round(delayMs * 1.5), 12000);
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
        (ref) =>
            `/payment/folder-clean/status/${encodeURIComponent(ref)}`,
        reference
    );
}

export async function pollWalletTopupPayment(reference: string): Promise<{
    walletBalance: number;
    amount: number;
}> {
    return pollUntilResolved(
        (ref) =>
            `/payment/wallet-topup/status/${encodeURIComponent(ref)}`,
        reference
    );
}
