import { useRef, useCallback } from 'react';

/**
 * Throttle consecutive function calls within a specified time interval.
 *
 * @param callback Function to call
 * @param delay Time interval (in milliseconds)
 * @returns Memoized callback function
 */
export default function useThrottle<A extends unknown[], R>(
  callback: (...args: A) => R,
  delay: number = 1000,
) {
  const lastCallRef = useRef(0);
  return useCallback(
    (...args: A): R | undefined => {
      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        return callback(...args);
      }
    },
    [callback, delay],
  );
}
