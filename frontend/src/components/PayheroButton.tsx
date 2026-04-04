import React, { useEffect, useState, useRef } from 'react';
import createClientLogger from '../utils/clientLogger';
const log = createClientLogger('PayheroButton.tsx');
const PAYHERO_SDK_URL =
    'https://applet.payherokenya.com/cdn/button_sdk.js?v=3.1';

interface Props {
    amount: number;
    phone?: string;
    name?: string;
    reference?: string;
    channelID?: number;
    paymentUrl?: string;
    buttonColor?: string;
    successUrl?: string;
    failedUrl?: string;
    callbackUrl?: string | null;
    disabled?: boolean;
    className?: string;
    onSuccess?: (data: any) => void;
    onError?: (err: any) => void;
}

export default function PayheroButton({
    amount,
    phone,
    name,
    reference = 'payment',
    channelID,
    paymentUrl,
    buttonColor = '#00a884',
    successUrl,
    failedUrl,
    callbackUrl = null,
    disabled,
    className,
    onSuccess,
    onError,
}: Props) {
    const [sdkLoading, setSdkLoading] = useState(false);
    const containerIdRef = useRef<string>(
        `payhero-${Math.random().toString(36).slice(2, 9)}`
    );
    const initializedRef = useRef(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const existing = document.querySelector(
            `script[src="${PAYHERO_SDK_URL}"]`
        );
        if (existing) return;

        setSdkLoading(true);
        const script = document.createElement('script');
        script.src = PAYHERO_SDK_URL;
        script.async = true;
        script.onload = () => setSdkLoading(false);
        script.onerror = () => setSdkLoading(false);
        document.head.appendChild(script);
    }, []);

    useEffect(() => {
        const initIfReady = () => {
            if (!window.PayHero) return;
            if (!channelID || !paymentUrl) return;
            const options = {
                paymentUrl,
                width: '100%',
                height: '100%',
                containerId: containerIdRef.current,
                channelID,
                amount,
                phone: phone ?? '',
                name: name ?? undefined,
                reference,
                buttonName: `Pay Ksh ${amount} Now`,
                buttonColor,
                successUrl: successUrl ?? window.location.href,
                failedUrl: failedUrl ?? window.location.href,
                callbackUrl,
            } as any;

            try {
                const containerEl = document.getElementById(
                    containerIdRef.current
                );
                if (containerEl) containerEl.innerHTML = '';
                window.PayHero.init(options);
                initializedRef.current = true;

                const styleId = `payhero-hide-${containerIdRef.current}`;
                if (!document.getElementById(styleId)) {
                    const style = document.createElement('style');
                    style.id = styleId;
                    style.innerHTML = `#${containerIdRef.current} .payhero-button { display: none !important; }`;
                    document.head.appendChild(style);
                }
            } catch (err) {
                console.error('PayHero.init failed', err);
            }
        };

        initIfReady();
    }, [
        amount,
        phone,
        name,
        reference,
        channelID,
        paymentUrl,
        buttonColor,
        successUrl,
        failedUrl,
        callbackUrl,
    ]);

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (!event?.data) return;
            if (event.data.paymentSuccess) {
                onSuccess?.(event.data);
            } else if ('paymentSuccess' in event.data) {
                onError?.(event.data);
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [onSuccess, onError]);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (disabled) return;

        const sdkButton = document.querySelector(
            `#${containerIdRef.current} .payhero-button`
        ) as HTMLButtonElement | null;
        if (sdkButton) {
            sdkButton.click();
            return;
        }

        if (window.PayHero && !initializedRef.current) {
            try {
                window.PayHero.init({ containerId: containerIdRef.current });
                const btn = document.querySelector(
                    `#${containerIdRef.current} .payhero-button`
                ) as HTMLButtonElement | null;
                if (btn) btn.click();
            } catch (err) {
                console.error('Failed to init PayHero on click', err);
                onError?.(err);
            }
        } else {
            onError?.(new Error('Payment SDK not ready'));
        }
    };
    log.debug('The payhero button is being triggered');

    return (
        <div>
            <div id={containerIdRef.current} />
            <button
                onClick={handleClick}
                disabled={disabled || sdkLoading}
                className={
                    className ??
                    'inline-flex items-center justify-center rounded-md bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700'
                }
            >
                <span>Pay Ksh {amount} Now</span>
            </button>
        </div>
    );
}
