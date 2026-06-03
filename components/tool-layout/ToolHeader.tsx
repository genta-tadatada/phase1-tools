"use client";

import Link from "next/link";
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
        {/* 左：ロゴ（上段）＋ページ名（下段） */}
        <Link href="/" style={{ display: "flex", flexDirection: "column", gap: 2, textDecoration: "none", minWidth: 0 }}>
          <TadatadaLogo height={38} />
          <span style={{
            fontFamily: "'M PLUS Rounded 1c', sans-serif",
            fontWeight: 700, fontSize: 10,
            color: "var(--th-text-muted)",
            paddingLeft: 4,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            maxWidth: "55vw",
          }}>
            {title}
          </span>
        </Link>

        {/* 右：ダークモード + グローバルメニュー（flexShrink:0で常に表示） */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <DarkModeToggle />
          <GlobalMenu activeSection="tools" />
        </div>
      </div>
    </header>
  );
}
