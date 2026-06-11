"use client";

import { useEffect } from "react";

// /tools/pomodoro は /tools/timer に統合されました。クライアントサイドでリダイレクトします。
// static export のため next.config.ts の redirects は使用不可。
export default function PomodoroRedirect() {
  useEffect(() => {
    window.location.replace("/tools/timer");
  }, []);
  return null;
}
