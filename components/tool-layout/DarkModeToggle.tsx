"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div style={{ width: 44, height: 24 }} />;

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "ライトモードに切り替える" : "ダークモードに切り替える"}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: `1.5px solid ${isDark ? "#4c3a8a" : "#bae6fd"}`,
        background: isDark
          ? "linear-gradient(135deg, #1e1040, #2d1f5e)"
          : "linear-gradient(135deg, #e0f2fe, #f0f9ff)",
        cursor: "pointer",
        padding: 0,
        display: "flex",
        alignItems: "center",
        paddingInline: 3,
        transition: "all 0.28s ease",
        flexShrink: 0,
        position: "relative",
        boxShadow: isDark
          ? "inset 0 1px 3px rgba(0,0,0,0.4)"
          : "inset 0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      {/* スライドサム */}
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: isDark
            ? "linear-gradient(135deg, #a78bfa, #7c3aed)"
            : "linear-gradient(135deg, #38bdf8, #0ea5e9)",
          transform: isDark ? "translateX(18px)" : "translateX(0)",
          transition: "transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.28s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          flexShrink: 0,
        }}
      >
        {/* アイコン */}
        {isDark ? (
          <svg width="8" height="8" viewBox="0 0 24 24" fill="white" aria-hidden>
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        ) : (
          <svg width="8" height="8" viewBox="0 0 24 24" fill="white" aria-hidden>
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="21" x2="12" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="1" y1="12" x2="3" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="21" y1="12" x2="23" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </span>
    </button>
  );
}
