"use client";
import { useLayoutEffect } from "react";
import { useTheme } from "next-themes";

/**
 * ポータルページに配置するコンポーネント。
 * マウント時に html.dark クラスを除去してライトモードを強制し、
 * アンマウント時（ツールページへの遷移時）にダークモードを復元する。
 * useLayoutEffect を使うことでフラッシュなしに同期実行される。
 */
export function ForceLight() {
  const { theme } = useTheme();

  useLayoutEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");

    // ダークモードを強制的に解除
    html.classList.remove("dark");

    return () => {
      // ポータルを離れたとき、元のテーマが dark なら復元
      if (wasDark || theme === "dark") {
        html.classList.add("dark");
      }
    };
  }, [theme]);

  return null;
}
