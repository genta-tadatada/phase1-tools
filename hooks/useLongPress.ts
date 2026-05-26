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
  // Track whether the long-press interval actually fired — if so, suppress the
  // subsequent click event to avoid double-counting on hold ≥ 500 ms.
  const didLongPressRef = useRef(false);

  // Latest-ref pattern: keep callbacks in refs so useCallback deps stay stable
  const onStartRef = useRef(options?.onStart);
  const onEndRef = useRef(options?.onEnd);
  onStartRef.current = options?.onStart;
  onEndRef.current = options?.onEnd;

  const clear = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
    onEndRef.current?.();
  }, []);

  const start = useCallback(() => {
    didLongPressRef.current = false;
    onStartRef.current?.();
    timeoutRef.current = setTimeout(() => {
      didLongPressRef.current = true;
      intervalRef.current = setInterval(() => {
        callback();
      }, interval);
    }, delay);
  }, [callback, delay, interval]);

  // Call this in the button's onClick to skip counting when long-press already fired.
  const suppressClick = useCallback(() => didLongPressRef.current, []);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    suppressClick,
  };
}
