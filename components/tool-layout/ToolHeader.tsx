"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "./DarkModeToggle";
import { HamburgerMenu } from "./HamburgerMenu";

interface ToolHeaderProps {
  title: string;
}

export function ToolHeader({ title }: ToolHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header
        role="banner"
        className="h-14 px-3 flex items-center justify-between border-b border-border bg-background sticky top-0 z-40"
      >
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(true)}
            aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
            className="w-10 h-10 flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex flex-col justify-center leading-none pl-0.5 gap-0.5">
            <span className="font-brand text-[9px] font-light text-primary/35 tracking-[0.38em] uppercase">
              TADATADA
            </span>
            <span className="text-[18px] font-black tracking-tight leading-none">
              {title}
            </span>
          </div>
        </div>
        <DarkModeToggle />
      </header>
      <HamburgerMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        currentTool={title}
      />
    </>
  );
}
