"use client";

import { useState } from "react";
import Link from "next/link";

type Section = "tools" | "quiz" | "games" | null;

interface GlobalMenuProps {
  activeSection?: Section;
}

const TOOLS = [
  { href: "/counter",       label: "マルチカウンター" },
  { href: "/stopwatch",     label: "多列ストップウォッチ" },
  { href: "/timer",         label: "タイマー" },
  { href: "/bpm",           label: "BPMメトロノーム" },
  { href: "/calculator",    label: "履歴付き電卓" },
  { href: "/random-number", label: "ランダム数字" },
  { href: "/dice",          label: "サイコロ" },
  { href: "/roulette",      label: "ルーレット" },
  { href: "/word-count",    label: "文字数カウント" },
  { href: "/janken",        label: "じゃんけん" },
  { href: "/lot",           label: "くじ引き" },
  { href: "/group",         label: "グループ分け" },
  { href: "/amida",         label: "あみだくじ" },
  { href: "/tournament",    label: "トーナメント表" },
];

interface NavItem {
  href: string;
  icon: string;
  iconBg: string;
  label: string;
  soon?: boolean;
  section?: Section;
  children?: Array<{ href: string; label: string; soon?: boolean }>;
}

const NAV: NavItem[] = [
  { href: "/",        icon: "🏠", iconBg: "#fef9c3", label: "ホーム" },
  { href: "/news",    icon: "📢", iconBg: "#fce7f3", label: "お知らせ" },
  {
    href: "/tools",   icon: "🧰", iconBg: "#d1fae5", label: "タダtools",
    section: "tools", children: TOOLS,
  },
  {
    href: "#",        icon: "📖", iconBg: "#ede9fe", label: "ただただ一問一答",
    soon: true,       section: "quiz",
    children: [
      { href: "#", label: "地理", soon: true },
      { href: "#", label: "歴史", soon: true },
      { href: "#", label: "漢検", soon: true },
      { href: "#", label: "英検・TOEIC", soon: true },
      { href: "#", label: "交通ルール", soon: true },
      { href: "#", label: "四字熟語", soon: true },
    ],
  },
  {
    href: "#",        icon: "🎮", iconBg: "#fce7f3", label: "ただタダgames",
    soon: true,       section: "games",
    children: [
      { href: "#", label: "高校サッカー育成シミュレーション", soon: true },
    ],
  },
  { href: "/contact", icon: "✉️", iconBg: "#ede9fe", label: "お問い合わせ" },
];

export function GlobalMenu({ activeSection = null }: GlobalMenuProps) {
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({});

  function handleOpen() {
    const init: Record<number, boolean> = {};
    NAV.forEach((item, idx) => {
      if (item.section && item.section === activeSection) init[idx] = true;
    });
    setOpenGroups(init);
    setOpen(true);
  }

  function toggleGroup(idx: number) {
    setOpenGroups((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  return (
    <>
      {/* ハンバーガーボタン */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label="メニューを開く"
        aria-expanded={open}
        style={{
          width: 40, height: 40, borderRadius: 12,
          border: open ? "2px solid #c4b5fd" : "2px solid #f1ecf3",
          background: open ? "#ede9fe" : "#ffffff",
          cursor: "pointer", display: "inline-flex",
          alignItems: "center", justifyContent: "center",
          transition: "all 0.2s ease", padding: 0, flexShrink: 0,
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = "#c4b5fd";
            e.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = "#f1ecf3";
          }
          e.currentTarget.style.transform = "";
        }}
      >
        {/* SVG hamburger — crisp at all DPR, variable line widths match reference */}
        <svg viewBox="0 0 18 15" width="18" height="15" fill="none" aria-hidden="true">
          <rect x="0" y="0"    width="18"   height="2.5" rx="1.25" fill="#1f1d2b" />
          <rect x="0" y="6.5" width="12.6" height="2.5" rx="1.25" fill="#1f1d2b" />
          <rect x="0" y="13"  width="15.3" height="2.5" rx="1.25" fill="#1f1d2b" />
        </svg>
      </button>

      {/* バックドロップ */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          aria-hidden="true"
          style={{
            position: "fixed", inset: 0,
            background: "rgba(31,29,43,0.4)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 100,
          }}
        />
      )}

      {/* ドロワー */}
      <aside
        aria-hidden={!open}
        style={{
          position: "fixed", top: 0, right: 0,
          height: "100vh", width: 340, maxWidth: "86vw",
          background: "#ffffff", zIndex: 101,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "-16px 0 40px -16px rgba(120,80,140,0.3)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* 装飾ブロブ */}
        <div style={{ position:"absolute", top:-60, right:-60, width:200, height:200, background:"radial-gradient(circle, #fbcfe8, transparent 70%)", opacity:0.5, pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-40, left:-40, width:160, height:160, background:"radial-gradient(circle, #a7f3d0, transparent 70%)", opacity:0.4, pointerEvents:"none" }} />

        {/* ヘッダー */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"22px 24px", borderBottom:"1px dashed #f1ecf3", position:"relative", zIndex:1 }}>
          <span style={{ fontFamily:"'M PLUS Rounded 1c', sans-serif", fontWeight:900, fontSize:17, color:"#1f1d2b", letterSpacing:"0.04em" }}>
            ✦ メニュー
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="閉じる"
            style={{ width:36, height:36, borderRadius:"50%", border:"2px solid #f1ecf3", background:"#fff", cursor:"pointer", fontSize:18, color:"#6b6779", display:"inline-flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s ease", padding:0 }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#f9a8d4"; e.currentTarget.style.color = "#ec4899"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#f1ecf3"; e.currentTarget.style.color = "#6b6779"; }}
          >
            ✕
          </button>
        </div>

        {/* ナビゲーション */}
        <nav style={{ flex:1, padding:"16px", display:"flex", flexDirection:"column", gap:4, position:"relative", zIndex:1, overflowY:"auto" }}>
          {NAV.map((item, idx) => {
            const hasChildren = !!item.children?.length;
            const isGroupOpen = openGroups[idx];

            return (
              <div key={idx} style={{ display:"flex", flexDirection:"column" }}>
                <div style={{ display:"flex", alignItems:"stretch", gap:2 }}>
                  <Link
                    href={item.href}
                    onClick={() => !hasChildren && setOpen(false)}
                    style={{
                      display:"flex", alignItems:"center", gap:14, flex:1,
                      padding:"14px 16px", borderRadius:16,
                      textDecoration:"none", color:"#1f1d2b",
                      fontFamily:"'M PLUS Rounded 1c', sans-serif",
                      fontWeight:700, fontSize:15,
                      transition:"background 0.18s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <span style={{ width:32, height:32, borderRadius:10, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0, background:item.iconBg }}>
                      {item.icon}
                    </span>
                    <span style={{ flex:1 }}>{item.label}</span>
                    {item.soon && (
                      <span style={{ fontFamily:"Quicksand, sans-serif", fontWeight:700, fontSize:10, letterSpacing:"0.06em", padding:"3px 8px", borderRadius:999, background:"#ede9fe", color:"#8b5cf6" }}>
                        SOON
                      </span>
                    )}
                  </Link>

                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(idx)}
                      aria-expanded={isGroupOpen}
                      style={{ width:36, borderRadius:12, border:"none", background:"transparent", cursor:"pointer", color:isGroupOpen ? "#8b5cf6" : "#9a96a8", display:"inline-flex", alignItems:"center", justifyContent:"center", transition:"all 0.22s ease", flexShrink:0, padding:0 }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                        style={{ width:16, height:16, transform:isGroupOpen ? "rotate(180deg)" : undefined, transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1)" }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* 展開リスト (grid-rows アニメーション) */}
                {hasChildren && (
                  <div style={{ display:"grid", gridTemplateRows:isGroupOpen ? "1fr" : "0fr", transition:"grid-template-rows 0.32s cubic-bezier(0.4,0,0.2,1)" }}>
                    <div style={{ minHeight:0, overflow:"hidden", paddingLeft:56 }}>
                      <div style={{ display:"flex", flexDirection:"column", gap:2, paddingTop:isGroupOpen ? 4 : 0, paddingBottom:isGroupOpen ? 8 : 0, transition:"padding 0.32s ease" }}>
                        {item.children!.map((child, ci) => (
                          <Link
                            key={ci}
                            href={child.href}
                            onClick={() => setOpen(false)}
                            style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 12px", borderRadius:10, textDecoration:"none", color:"#6b6779", fontFamily:"'M PLUS Rounded 1c', sans-serif", fontWeight:700, fontSize:13, transition:"all 0.18s ease" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.color = "#1f1d2b"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "#6b6779"; }}
                          >
                            <span>
                              <span style={{ color:"#c4b5fd", fontWeight:900, marginRight:8 }}>·</span>
                              {child.label}
                            </span>
                            {child.soon && (
                              <span style={{ fontFamily:"Quicksand, sans-serif", fontWeight:700, fontSize:9, letterSpacing:"0.06em", padding:"2px 7px", borderRadius:999, background:"#f1ecf3", color:"#9a96a8", marginLeft:8, flexShrink:0 }}>
                                SOON
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* フッター */}
        <div style={{ padding:"16px 24px 24px", borderTop:"1px dashed #f1ecf3", textAlign:"center", fontSize:11, color:"#9a96a8", fontFamily:"Quicksand, sans-serif", letterSpacing:"0.06em", position:"relative", zIndex:1 }}>
          © 2026 ただただ。 <span style={{ color:"#f9a8d4" }}>♥</span>
        </div>
      </aside>
    </>
  );
}
