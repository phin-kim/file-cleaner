import React, { useEffect, useState } from 'react';
import PaystackPop from '@paystack/inline-js';
import authApi from '../library/authApi';
import createClientLogger from '../utils/clientLogger';
import handleApiError from '../utils/apiError';

const log = createClientLogger('PayheroButton');

interface Props {
    amount: number;
    email?: string | null;
    currency?: string;
    metadata?: Record<string, unknown>;
    disabled?: boolean;
    className?: string;
    children?: React.ReactNode;
    onSuccess?: (data: any) => void;
    onError?: (err: any) => void;
}

const PAYHERO_SDK_URL =
    'https://applet.payherokenya.com/cdn/button_sdk.js?v=3.1';

export default function PayheroButton({
    amount,
    email,
    currency = 'KES',
    metadata,
    disabled,
    className,
    children,
    onSuccess,
    onError,
}: Props) {
    const [loadingSdk, setLoadingSdk] = useState(false);

    useEffect(() => {
        // load Payhero SDK script if not already present
        if (typeof window === 'undefined') return;
        const existing = document.querySelector(
            `script[src="${PAYHERO_SDK_URL}"]`
        );
        if (existing) return;

        setLoadingSdk(true);
        const script = document.createElement('script');
        script.src = PAYHERO_SDK_URL;
        script.async = true;
        script.onload = () => {
            setLoadingSdk(false);
            log.info('Payhero SDK loaded');
        };
        script.onerror = () => {
            setLoadingSdk(false);
            log.error('Failed to load Payhero SDK');
        };
        document.head.appendChild(script);
    }, []);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (disabled) return;
        try {
            const payload = {
                amount,
                email,
                currency,
                metadata,
            } as any;

            const res = await authApi.post(
                '/payment/initialize-payment',
                payload
            );
            const data = res.data;
            log.info('initialize-payment response', { data });

            if (data?.status && data?.data?.access_code) {
                const paystack = new PaystackPop();
                paystack.resumeTransaction(data.data.access_code);
                onSuccess?.(data);
            } else {
                const err = new Error('Payment initialization failed');
                onError?.(err);
            }
        } catch (err) {
            log.error('Error when initializing payment', { err });
            handleApiError(err, (message: string) => onError?.(message));
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled || loadingSdk}
            className={className}
            aria-busy={loadingSdk}
        >
            {children ?? (loadingSdk ? 'Loading...' : 'Pay')}
        </button>
    );
}
