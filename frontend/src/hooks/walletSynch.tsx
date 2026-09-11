import { useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import authApi from '../library/authApi';
import { pollWalletTopupPayment } from '../utils/pollPayHeroPayment';
import useErrorStore from '../Store/ErrorStore';
export function useWalletBalanceTopUp() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            mpesaPhone,
            val,
        }: {
            mpesaPhone: string;
            val: number;
        }) => {
            const initRes = await authApi.post<{
                status?: boolean;
                data?: { reference: string; amount: number };
                message?: string;
            }>('/payment/wallet-topup/initiate', {
                phoneNumber: mpesaPhone.trim(),
                amount: val,
            });
            const reference = initRes.data?.data?.reference;
            if (!reference) {
                throw new Error(
                    initRes.data?.message ||
                        'Could not start M-Pesa payment. Try again.'
                );
            }

            const { walletBalance } = await pollWalletTopupPayment(reference);
            return walletBalance;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['wallet-balance'],
            });
        },
        onError: (err) => {
            let msg = 'Top-up failed. Try again.';
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
            const setError = useErrorStore.getState().setError;
            setError(msg);
        },
    });
}
