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
        <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <TadatadaLogo title={title} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <DarkModeToggle />
          <GlobalMenu activeSection="tools" />
        </div>
      </div>
    </header>
  );
}
