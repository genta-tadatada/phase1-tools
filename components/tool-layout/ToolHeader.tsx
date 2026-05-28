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
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "saturate(180%) blur(14px)",
        WebkitBackdropFilter: "saturate(180%) blur(14px)",
        borderBottom: "1px solid #f1ecf3",
      }}
    >
      <div style={{ height: 80, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", overflow: "hidden" }}>
        {/* 左：breadcrumb */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <TadatadaLogo />
          <span style={{ color: "#9a96a8", fontSize: 12 }}>/</span>
          <span style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 700, fontSize: 14, color: "#1f1d2b" }}>
            {title}
          </span>
        </Link>

        {/* 右：ダークモード + グローバルメニュー */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <DarkModeToggle />
          <GlobalMenu activeSection="tools" />
        </div>
      </div>
    </header>
  );
}
