"use client";

import Link from "next/link";
import { toast } from "sonner";
import { DarkModeToggle } from "./DarkModeToggle";
import { GlobalMenu } from "@/components/shared/GlobalMenu";

interface ToolHeaderProps {
  title: string;
}

export function ToolHeader({ title }: ToolHeaderProps) {
  return (
    <header
      role="banner"
      style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "var(--th-bg)",
        backdropFilter: "saturate(180%) blur(16px)",
        WebkitBackdropFilter: "saturate(180%) blur(16px)",
        borderBottom: "1px solid var(--th-border)",
      }}
    >
      <div style={{
        padding: "0 16px",
        height: 56,
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 8,
        maxWidth: 1280, margin: "0 auto",
      }}>
        {/* 左：ホームへ + ツール名パンくず */}
        <Link
          href="/tools"
          style={{ textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}
        >
          <span
            style={{
              fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 900, fontSize: 13,
              letterSpacing: "0.02em", flexShrink: 0, color: "var(--th-text)",
            }}
          >
            タダ<span style={{ color: "#0ea5e9" }}>tools</span><span style={{ color: "#f9a8d4" }}>.</span>
          </span>

          <span style={{ color: "var(--th-border)", fontSize: 10, flexShrink: 0 }}>›</span>

          {/* ツール名チップ */}
          <span
            style={{
              fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 700, fontSize: 12,
              color: "var(--th-text-muted)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              maxWidth: 160,
            }}
          >
            {title}
          </span>
        </Link>

        {/* 右：アクションボタン群 */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {/* URLシェアボタン */}
          <IconBtn
            aria-label="URLをコピー"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("URLをコピーしました");
              } catch {
                toast.error("コピーに失敗しました");
              }
            }}
            title="URLをシェア"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </IconBtn>

          <DarkModeToggle />
          <GlobalMenu activeSection="tools" />
        </div>
      </div>
    </header>
  );
}

// ─── 共通アイコンボタン ────────────────────────────────────────────
function IconBtn({
  children, onClick, title, "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      style={{
        width: 36, height: 36, borderRadius: 10,
        border: "1.5px solid var(--ibtn-border)",
        background: "var(--ibtn-bg)",
        color: "var(--ibtn-color)",
        cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.18s ease",
        flexShrink: 0, padding: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--ibtn-border-hover)";
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 4px 12px -4px rgba(196,181,253,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--ibtn-border)";
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      {children}
    </button>
  );
}
