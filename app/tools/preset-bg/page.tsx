"use client";

import { useEffect } from "react";

// プリセット背景ギャラリーは完成度が低いため一旦非公開。
// 実装本体は PresetBgTool.tsx に保持。再公開時はこの page.tsx を元に戻す（git履歴参照）。
export default function PresetBgDisabledRedirect() {
  useEffect(() => {
    window.location.replace("/tools");
  }, []);
  return null;
}
