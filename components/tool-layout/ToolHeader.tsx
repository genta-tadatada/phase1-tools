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
        className="h-14 px-4 flex items-center justify-between border-b border-border bg-background sticky top-0 z-40"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMenuOpen(true)}
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          className="w-11 h-11"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-lg font-medium">{title}</span>
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
