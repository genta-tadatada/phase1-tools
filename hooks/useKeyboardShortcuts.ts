"use client";

import { useEffect } from "react";

interface ShortcutConfig {
  key: string;
  handler: () => void;
  preventDefault?: boolean;
  disabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
}

const INPUT_TAGS = ["INPUT", "TEXTAREA", "SELECT"];

export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  options?: UseKeyboardShortcutsOptions
): void {
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (INPUT_TAGS.includes(target.tagName)) return;

      for (const shortcut of shortcuts) {
        if (shortcut.disabled) continue;
        if (e.key === shortcut.key) {
          if (shortcut.preventDefault !== false) e.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts, enabled]);
}
