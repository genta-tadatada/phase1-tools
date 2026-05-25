"use client";

import { useState, useEffect } from "react";
import { getStorageItem, setStorageItem } from "@/lib/storage";
import { decodeState } from "@/lib/share";

interface PersistentStateOptions<T> {
  urlParam?: string;
  serialize?: (v: T) => string;
  deserialize?: (s: string) => T;
}

export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  options?: PersistentStateOptions<T>
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(defaultValue);

  useEffect(() => {
    let restored = false;

    if (options?.urlParam) {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get(options.urlParam);
      if (encoded) {
        const decoded = decodeState<T>(encoded);
        if (decoded !== null) {
          setState(decoded);
          restored = true;
        }
      }
    }

    if (!restored) {
      const stored = getStorageItem<T>(key, defaultValue);
      setState(stored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPersistentState = (value: T) => {
    setState(value);
    setStorageItem(key, value);
  };

  return [state, setPersistentState];
}
