"use client";

import { useRef, useCallback } from "react";

interface LongPressOptions {
  delay?: number;
  interval?: number;
  onStart?: () => void;
  onEnd?: () => void;
}

export function useLongPress(
  callback: () => void,
  options?: LongPressOptions
) {
  const delay = options?.delay ?? 500;
  const interval = options?.interval ?? 100;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
    options?.onEnd?.();
  }, [options]);

  const start = useCallback(() => {
    options?.onStart?.();
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        callback();
      }, interval);
    }, delay);
  }, [callback, delay, interval, options]);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
  };
}
