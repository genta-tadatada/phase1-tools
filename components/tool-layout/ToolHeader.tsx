"use client";

import Link from "next/link";
import { toast } from "sonner";
import { DarkModeToggle } from "./DarkModeToggle";
import { GlobalMenu } from "@/components/shared/GlobalMenu";
import { TadatadaLogo } from "@/components/shared/TadatadaLogo";
import "@/app/(portal)/portal.css";

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
        backdropFilter: "saturate(180%) blur(14px)",
        WebkitBackdropFilter: "saturate(180%) blur(14px)",
        borderBottom: "1px solid var(--th-border)",
      }}
    >
      <div style={{
        padding: "6px 16px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 8,
      }}>
        <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <TadatadaLogo title={title} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {/* URLシェアボタン */}
          <button
            type="button"
            aria-label="URLをコピー"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("URLをコピーしました");
              } catch {
                toast.error("コピーに失敗しました");
              }
            }}
            style={{
              width: 40, height: 40, borderRadius: 12,
              border: "2px solid var(--ibtn-border)",
              background: "var(--ibtn-bg)",
              cursor: "pointer", display: "inline-flex",
              alignItems: "center", justifyContent: "center",
              transition: "all 0.2s ease", padding: 0, flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--ibtn-border-hover)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--ibtn-border)";
              e.currentTarget.style.transform = "";
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--ibtn-color)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>
          <DarkModeToggle />
          <GlobalMenu activeSection="tools" />
        </div>
      </div>
    </header>
  );
}
