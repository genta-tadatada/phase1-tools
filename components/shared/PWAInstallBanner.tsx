"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("pwa-dismissed") === "1") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;

    if (isIOS) {
      setShowIOSHint(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem("pwa-dismissed", "1");
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    if (outcome === "dismissed") localStorage.setItem("pwa-dismissed", "1");
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between gap-3"
      style={{
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid #fce7f3",
        boxShadow: "0 -2px 16px rgba(244,114,182,0.10)",
      }}
      role="banner"
      aria-label="ホーム画面への追加を促すバナー"
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/kawaii-house.png" alt="" aria-hidden="true" className="shrink-0" style={{ width: 36, height: 36, objectFit: "contain" }} />
        <div className="text-sm leading-tight min-w-0" style={{ color: "#3d3550" }}>
          {showIOSHint ? (
            <>
              <span className="font-medium">ホーム画面に追加できます</span>
              <span className="block text-xs" style={{ color: "#6b6779" }}>
                共有ボタン → 「ホーム画面に追加」
              </span>
            </>
          ) : (
            <span>
              <span className="font-medium">ただただ</span>をホーム画面に追加できます
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={dismiss}
          className="text-xs px-2 py-1.5 rounded"
          style={{ color: "#9ca3af" }}
          aria-label="後で"
        >
          後で
        </button>
        <button
          onClick={showIOSHint ? dismiss : handleInstall}
          className="text-xs font-medium text-white px-4 py-1.5 rounded-full"
          style={{ background: "linear-gradient(135deg, #f9a8d4 0%, #c084fc 100%)" }}
        >
          {showIOSHint ? "OK" : "ホーム画面に追加"}
        </button>
      </div>
    </div>
  );
}
