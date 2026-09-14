import { useRef, useCallback } from 'react';

/**
 * Hook to prevent multiple function calls within a specified time window
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds (default: 1000ms)
 * @returns Debounced function
 */
export function useDebounce<T extends (...args: never[]) => unknown>(
    callback: T,
    delay: number = 1000
): (...args: Parameters<T>) => void {
    const lastCallRef = useRef<number>(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    return useCallback(
        (...args: Parameters<T>) => {
            const now = Date.now();

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            if (now - lastCallRef.current >= delay) {
                lastCallRef.current = now;
                callback(...args);
            } else {
                const remainingDelay = Math.max(
                    0,
                    delay - (now - lastCallRef.current)
                );

                timeoutRef.current = setTimeout(() => {
                    lastCallRef.current = Date.now();
                    callback(...args);
                }, remainingDelay);
            }
        },
        [callback, delay]
    );
}
