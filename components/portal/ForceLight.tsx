"use client";
import { useLayoutEffect } from "react";

/**
 * ポータルページ専用。
 * マウント時（描画前）に html.dark を除去し、アンマウント時に復元する。
 * useLayoutEffect で同期実行するためフラッシュが発生しない。
 * deps=[] でマウント/アンマウント時のみ実行（余計な再実行を防ぐ）。
 */
export function ForceLight() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");
    html.classList.remove("dark");
    return () => {
      if (wasDark) html.classList.add("dark");
    };
  }, []);
  return null;
}
