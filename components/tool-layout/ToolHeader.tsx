"use client";

import Link from "next/link";
import { DarkModeToggle } from "./DarkModeToggle";
import { GlobalMenu } from "@/components/shared/GlobalMenu";

interface ToolHeaderProps {
  title: string;
}

export function ToolHeader({ title }: ToolHeaderProps) {
  return (
    <header
      role="banner"
      className="h-16 px-6 flex items-center justify-between border-b border-border bg-background sticky top-0 z-40"
    >
      {/* 左：breadcrumb */}
      <div className="flex items-center gap-1.5 leading-none">
        <Link
          href="/"
          className="font-brand text-[13px] font-black tracking-[0.06em] text-foreground hover:opacity-70 transition-opacity"
        >
          TADATADA
        </Link>
        <span className="text-[13px] font-light text-foreground/30 select-none">/</span>
        <span className="text-[13px] font-black tracking-tight text-accent">
          {title}
        </span>
      </div>

      {/* 右：ダークモード + グローバルメニュー */}
      <div className="flex items-center gap-2">
        <DarkModeToggle />
        <GlobalMenu activeSection="tools" />
      </div>
    </header>
  );
}
