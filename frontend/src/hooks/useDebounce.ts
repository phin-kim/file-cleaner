import { useRef, useCallback } from 'react';

/**
 * Hook to prevent multiple function calls within a specified time window
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds (default: 1000ms)
 * @returns Debounced function
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number = 1000
): (...args: Parameters<T>) => void {
    const lastCallRef = useRef<number>(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

    return useCallback(
        (...args: Parameters<T>) => {
            const now = Date.now();

            // Clear any pending timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // If enough time has passed, call immediately
            if (now - lastCallRef.current >= delay) {
                lastCallRef.current = now;
                callback(...args);
            } else {
                // Otherwise, schedule the call for later
                timeoutRef.current = setTimeout(
                    () => {
                        lastCallRef.current = Date.now();
                        callback(...args);
                    },
                    delay - (now - lastCallRef.current)
                );
            }
        },
        [callback, delay]
    );
}
