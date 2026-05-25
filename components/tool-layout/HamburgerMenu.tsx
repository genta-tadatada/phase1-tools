"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Link from "next/link";

interface HamburgerMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTool?: string;
}

interface ToolItem {
  name: string;
  href: string;
  description: string;
}

const TOOLS: ToolItem[] = [
  { name: "多列カウンター", href: "/counter", description: "複数カウンターを同時管理" },
  { name: "BPMメトロノーム", href: "/bpm", description: "テンポ・タップ機能付き" },
  { name: "サイコロ・ルーレット", href: "/dice", description: "多面体ダイス対応" },
  { name: "あみだくじ", href: "/amida", description: "自動生成あみだくじ" },
  { name: "じゃんけん", href: "/janken", description: "CPUとじゃんけん" },
  { name: "くじ引き", href: "/lot", description: "名前リストから抽選" },
  { name: "グループ分け", href: "/group", description: "均等グループ自動生成" },
  { name: "ストップウォッチ", href: "/stopwatch", description: "ラップ機能付き" },
  { name: "トーナメント表", href: "/tournament", description: "自動ブラケット生成" },
  { name: "文字数カウント", href: "/word-count", description: "文字・行数・バイト数" },
];

export function HamburgerMenu({ open, onOpenChange, currentTool }: HamburgerMenuProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-xs w-full">
        <SheetHeader>
          <SheetTitle>ただただツール</SheetTitle>
        </SheetHeader>
        <nav className="mt-6">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-3 mb-2">
            ツール一覧
          </p>
          <ul className="space-y-0.5">
            {TOOLS.map((tool) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  onClick={() => onOpenChange(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-muted transition-colors ${
                    currentTool === tool.name
                      ? "bg-muted font-medium"
                      : "text-foreground"
                  }`}
                >
                  {currentTool === tool.name && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                  )}
                  <span className={currentTool === tool.name ? "" : "ml-4"}>
                    {tool.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-8 border-t border-border pt-4 space-y-1">
          <Link
            href="/privacy"
            onClick={() => onOpenChange(false)}
            className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            プライバシーポリシー
          </Link>
          <Link
            href="/contact"
            onClick={() => onOpenChange(false)}
            className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            お問い合わせ
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
