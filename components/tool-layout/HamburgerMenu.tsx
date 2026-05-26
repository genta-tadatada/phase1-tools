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
  { name: "マルチカウンター", href: "/counter", description: "複数カウンターを同時管理" },
  { name: "ストップウォッチ", href: "/stopwatch", description: "ラップ機能付き" },
  { name: "電卓", href: "/calculator", description: "計算履歴・税込・割引対応" },
  { name: "文字数カウント", href: "/word-count", description: "文字・行数・バイト数" },
  { name: "タイマー", href: "/timer", description: "カウントダウン・ポモドーロ対応" },
  { name: "BPMメトロノーム", href: "/bpm", description: "テンポ・タップ機能付き" },
  { name: "ランダム数字", href: "/random-number", description: "範囲指定で乱数生成" },
  { name: "サイコロ", href: "/dice", description: "多面体ダイス対応" },
  { name: "ルーレット", href: "/roulette", description: "選択肢を回して決める" },
  { name: "じゃんけん", href: "/janken", description: "CPUとじゃんけん" },
  { name: "くじ引き", href: "/lot", description: "名前リストから抽選" },
  { name: "グループ分け", href: "/group", description: "均等グループ自動生成" },
  { name: "あみだくじ", href: "/amida", description: "自動生成あみだくじ" },
  { name: "トーナメント表", href: "/tournament", description: "自動ブラケット生成" },
];

export function HamburgerMenu({ open, onOpenChange, currentTool }: HamburgerMenuProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-xs w-full">
        <SheetHeader>
          <SheetTitle>
            <span className="font-brand tracking-widest text-sm font-medium">TADATADA</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6">
          <Link
            href="/"
            onClick={() => onOpenChange(false)}
            className="block text-xs font-medium tracking-wider px-3 mb-2 text-muted-foreground hover:text-accent transition-colors"
          >
            タダtools
          </Link>
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
