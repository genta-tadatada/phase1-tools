"use client";

import { useState } from "react";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const TOOLS = [
  { href: "/tools/counter",       label: "マルチカウンター" },
  { href: "/tools/stopwatch",     label: "多列ストップウォッチ" },
  { href: "/tools/timer",         label: "タイマー" },
  { href: "/tools/bpm",           label: "BPMメトロノーム" },
  { href: "/tools/calculator",    label: "履歴付き電卓" },
  { href: "/tools/random-number", label: "ランダム数字" },
  { href: "/tools/dice",          label: "サイコロ" },
  { href: "/tools/roulette",      label: "ルーレット" },
  { href: "/tools/word-count",    label: "文字数カウント" },
  { href: "/tools/janken",        label: "じゃんけん" },
  { href: "/tools/lot",           label: "くじ引き" },
  { href: "/tools/group",         label: "グループ分け" },
  { href: "/tools/amida",         label: "あみだくじ" },
  { href: "/tools/tournament",    label: "トーナメント表" },
  { href: "/tools/pomodoro",      label: "ポモドーロタイマー", soon: true },
];

interface NavItem {
  href: string;
  icon: string;
  label: string;
  soon?: boolean;
  children?: { href: string; label: string; soon?: boolean }[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/portal", icon: "🏠", label: "ホーム" },
  { href: "/news",   icon: "📢", label: "お知らせ" },
  { href: "/tools", icon: "🧰", label: "タダtools", children: TOOLS },
  { href: "#", icon: "📖", label: "ただただ一問一答", soon: true,
    children: [
      { href: "#", label: "地理", soon: true },
      { href: "#", label: "歴史", soon: true },
      { href: "#", label: "漢検", soon: true },
      { href: "#", label: "英検・TOEIC", soon: true },
      { href: "#", label: "交通ルール", soon: true },
      { href: "#", label: "四字熟語", soon: true },
    ],
  },
  { href: "#", icon: "🎮", label: "ただタダgames", soon: true,
    children: [
      { href: "#", label: "高校サッカー育成シミュレーション", soon: true },
    ],
  },
  { href: "/contact", icon: "✉️", label: "お問い合わせ" },
];

const iconColors: Record<string, string> = {
  "🏠": "#fcd34d",
  "📢": "#f9a8d4",
  "🧰": "#6ee7b7",
  "📖": "#c4b5fd",
  "🎮": "#f9a8d4",
  "✉️": "#c4b5fd",
};

export function PortalSiteNav({ currentPath }: { currentPath?: string }) {
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({});

  function toggleGroup(idx: number) {
    setOpenGroups((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  return (
    <>
      <button
        className="p-menu-btn"
        onClick={() => setOpen(true)}
        aria-label="メニューを開く"
        type="button"
      >
        ☰
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="max-w-xs w-full p-0 overflow-y-auto">
          <div style={{ background: "linear-gradient(135deg, #fdf2f8 0%, #f5f3ff 100%)", minHeight: "100%" }}>
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#f1ecf3]">
              <SheetTitle>
                <span style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 800, letterSpacing: "0.1em" }}>
                  メニュー
                </span>
              </SheetTitle>
            </SheetHeader>

            <nav className="px-4 py-4 flex flex-col gap-1">
              {NAV_ITEMS.map((item, idx) => {
                const isActive = item.href !== "#" && currentPath === item.href;
                const hasChildren = item.children && item.children.length > 0;
                const isGroupOpen = openGroups[idx];

                return (
                  <div key={idx}>
                    <div className="flex items-center gap-1">
                      <Link
                        href={item.href}
                        onClick={() => !hasChildren && setOpen(false)}
                        className="flex items-center gap-3 flex-1 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors hover:bg-white/60"
                        style={{
                          color: isActive ? "#8b5cf6" : "#1f1d2b",
                          background: isActive ? "rgba(196,181,253,0.15)" : undefined,
                        }}
                      >
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: `${iconColors[item.icon] ?? "#e5e7eb"}30`, fontSize: "18px" }}
                        >
                          {item.icon}
                        </span>
                        <span className="flex-1">{item.label}</span>
                        {item.soon && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ede9fe] text-[#8b5cf6]">SOON</span>
                        )}
                      </Link>
                      {hasChildren && !item.soon && (
                        <button
                          type="button"
                          onClick={() => toggleGroup(idx)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9a96a8] hover:text-[#1f1d2b] hover:bg-white/60 transition-colors flex-shrink-0"
                          aria-expanded={isGroupOpen}
                        >
                          <span style={{ transform: isGroupOpen ? "rotate(180deg)" : undefined, display: "inline-block", transition: "transform 0.2s" }}>▾</span>
                        </button>
                      )}
                    </div>

                    {hasChildren && !item.soon && isGroupOpen && (
                      <div className="ml-11 mt-1 flex flex-col gap-0.5">
                        {item.children!.map((child, ci) => (
                          <Link
                            key={ci}
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className="px-3 py-2 text-xs text-[#6b6779] rounded-lg hover:bg-white/60 hover:text-[#1f1d2b] transition-colors flex items-center justify-between"
                          >
                            {child.label}
                            {child.soon && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ede9fe] text-[#8b5cf6]">SOON</span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="px-6 py-4 border-t border-[#f1ecf3] text-center text-xs text-[#9a96a8]" style={{ fontFamily: "Quicksand, sans-serif" }}>
              © 2026 ただただ。 <span style={{ color: "#f9a8d4" }}>♥</span>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
