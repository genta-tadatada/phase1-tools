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
      className="h-14 px-3 flex items-center justify-between border-b border-border bg-background sticky top-0 z-40"
    >
      {/* 左：ブランド + ツール名 */}
      <div className="flex flex-col justify-center leading-none gap-0.5">
        <Link
          href="/"
          className="font-brand text-[9px] font-light text-primary/35 tracking-[0.38em] uppercase hover:text-primary/60 transition-colors"
        >
          TADATADA
        </Link>
        <Link
          href="/tools"
          className="text-[18px] font-black tracking-tight leading-none hover:opacity-70 transition-opacity"
        >
          {title}
        </Link>
      </div>

      {/* 右：ダークモード + グローバルメニュー */}
      <div className="flex items-center gap-2">
        <DarkModeToggle />
        <GlobalMenu activeSection="tools" />
      </div>
    </header>
  );
}
