"use client";

import { useEffect } from "react";

// /pomodoro は /timer に統合されました。クライアントサイドでリダイレクトします。
// static export のため next.config.ts の redirects は使用不可。
export default function PomodoroRedirect() {
  useEffect(() => {
    window.location.replace("/timer");
  }, []);
  return null;
}
