"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { TOOL_CATALOG } from "@/lib/tools-catalog";

type Section = "tools" | "quiz" | "games" | null;

interface GlobalMenuProps {
  activeSection?: Section;
}

// ツール一覧は lib/tools-catalog.ts が単一情報源
const TOOLS = TOOL_CATALOG.map((t) => ({ href: t.path, label: t.name }));

interface NavItem {
  href: string;
  iconImg: string;
  iconBg: string;
  label: string;
  soon?: boolean;
  section?: Section;
  children?: Array<{ href: string; label: string; soon?: boolean }>;
  iconCover?: boolean;
  iconScale?: number;
}

const NAV: NavItem[] = [
  { href: "/",        iconImg: "/assets/kawaii-house.png",    iconBg: "#fef9c3", label: "ホーム",
    iconCover: true, iconScale: 2.1 },
  { href: "/news",    iconImg: "/assets/kawaii-bell.png",     iconBg: "#fce7f3", label: "お知らせ",
    iconCover: true, iconScale: 2.3 },
  {
    href: "/tools",   iconImg: "/assets/kawaii-tools-clean.png",    iconBg: "#d1fae5", label: "タダtools",
    section: "tools", children: TOOLS, iconScale: 1.2,
  },
  {
    href: "/quiz",    iconImg: "/assets/kawaii-book-clean.png",     iconBg: "#ede9fe", label: "ただただ一問一答",
    soon: true,       section: "quiz",  iconScale: 1.2,
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
    href: "/games",   iconImg: "/assets/kawaii-controller-clean.png", iconBg: "#fce7f3", label: "ただタダgames",
    soon: true,       section: "games", iconScale: 1.2,
    children: [
      { href: "#", label: "高校サッカー育成シミュレーション", soon: true },
    ],
  },
  { href: "/contact", iconImg: "/assets/kawaii-envelope.png", iconBg: "#ede9fe", label: "お問い合わせ",
    iconCover: true, iconScale: 2.1 },
  { href: "/privacy", iconImg: "/assets/kawaii-padlock.png",  iconBg: "#f1ecf3", label: "プライバシーポリシー",
    iconCover: true, iconScale: 2.3 },
];

const PersonSVG = ({ size = 20, color }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color ?? "var(--ibtn-color)"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    style={{ width: size, height: size }} aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

const iconBtnBase: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12,
  border: "2px solid var(--ibtn-border)", background: "var(--ibtn-bg)",
  cursor: "pointer", display: "inline-flex",
  alignItems: "center", justifyContent: "center",
  transition: "all 0.2s ease", padding: 0, flexShrink: 0,
  position: "relative",
};

export function GlobalMenu({ activeSection = null }: GlobalMenuProps) {
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [authOpen, setAuthOpen]       = useState(false);
  const [openGroups, setOpenGroups]   = useState<Record<number, boolean>>({});
  const [mounted, setMounted]         = useState(false);
  useEffect(() => setMounted(true), []);

  function closeAll() {
    setDrawerOpen(false);
    setAuthOpen(false);
  }

  function handleDrawerOpen() {
    const init: Record<number, boolean> = {};
    NAV.forEach((item, idx) => {
      if (item.section && item.section === activeSection) init[idx] = true;
    });
    setOpenGroups(init);
    setAuthOpen(false);
    setDrawerOpen(true);
  }

  function handleAuthOpen() {
    setDrawerOpen(false);
    setAuthOpen(true);
  }

  function toggleGroup(idx: number) {
    setOpenGroups((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  const showBackdrop = drawerOpen || authOpen;

  return (
    <>
      {/* ヘッダーボタン群 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

        {/* アカウントボタン */}
        <button
          type="button"
          onClick={handleAuthOpen}
          aria-label="アカウント"
          style={iconBtnBase}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--ibtn-border-hover)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--ibtn-border)";
            e.currentTarget.style.transform = "";
          }}
        >
          <PersonSVG />
          {/* ピンクバッジ */}
          <span style={{
            position: "absolute", top: 6, right: 6,
            width: 7, height: 7, borderRadius: "50%",
            background: "#f9a8d4", border: "2px solid var(--ibtn-bg)",
          }} />
        </button>

        {/* ハンバーガーボタン */}
        <button
          type="button"
          onClick={handleDrawerOpen}
          aria-label="メニューを開く"
          aria-expanded={drawerOpen}
          style={{
            ...iconBtnBase,
            border: drawerOpen ? "2px solid var(--ibtn-border-active)" : "2px solid var(--ibtn-border)",
            background: drawerOpen ? "var(--ibtn-bg-active)" : "var(--ibtn-bg)",
          }}
          onMouseEnter={(e) => {
            if (!drawerOpen) {
              e.currentTarget.style.borderColor = "var(--ibtn-border-hover)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            if (!drawerOpen) e.currentTarget.style.borderColor = "var(--ibtn-border)";
            e.currentTarget.style.transform = "";
          }}
        >
          <svg viewBox="0 0 18 15" width="18" height="15" fill="none" aria-hidden="true">
            <rect x="0" y="0"    width="18"   height="2.5" rx="1.25" fill="var(--ibtn-color)" />
            <rect x="0" y="6.5" width="12.6" height="2.5" rx="1.25" fill="var(--ibtn-color)" />
            <rect x="0" y="13"  width="15.3" height="2.5" rx="1.25" fill="var(--ibtn-color)" />
          </svg>
        </button>
      </div>

      {/* バックドロップ・ドロワー・モーダルは document.body に portal レンダリング */}
      {mounted && createPortal(
        <>
          {/* バックドロップ */}
          {showBackdrop && (
            <div
              onClick={closeAll}
              aria-hidden="true"
              style={{
                position: "fixed", inset: 0,
                background: "rgba(31,29,43,0.4)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                zIndex: 1000,
              }}
            />
          )}

          {/* ナビドロワー */}
          <aside
            aria-hidden={!drawerOpen}
            style={{
              position: "fixed", top: 0, right: 0,
              height: "100vh", width: 340, maxWidth: "86vw",
              background: "var(--drawer-bg)", zIndex: 1001,
              transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
              transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: "-16px 0 40px -16px rgba(120,80,140,0.3)",
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            <div style={{ position:"absolute", top:-60, right:-60, width:200, height:200, background:"radial-gradient(circle, #fbcfe8, transparent 70%)", opacity:0.3, pointerEvents:"none" }} />
            <div style={{ position:"absolute", bottom:-40, left:-40, width:160, height:160, background:"radial-gradient(circle, #a7f3d0, transparent 70%)", opacity:0.25, pointerEvents:"none" }} />

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"22px 24px", borderBottom:"1px dashed var(--drawer-border)", position:"relative", zIndex:1 }}>
              <span style={{ fontFamily:"'M PLUS Rounded 1c', sans-serif", fontWeight:900, fontSize:17, color:"var(--drawer-text)", letterSpacing:"0.04em" }}>
                ✦ メニュー
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="閉じる"
                style={{ width:36, height:36, borderRadius:"50%", border:"2px solid var(--drawer-border)", background:"var(--drawer-bg)", cursor:"pointer", fontSize:18, color:"var(--drawer-text-muted)", display:"inline-flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s ease", padding:0 }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#f9a8d4"; e.currentTarget.style.color = "#ec4899"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--drawer-border)"; e.currentTarget.style.color = "var(--drawer-text-muted)"; }}
              >
                ✕
              </button>
            </div>

            <nav style={{ flex:1, padding:"16px", display:"flex", flexDirection:"column", gap:4, position:"relative", zIndex:1, overflowY:"auto" }}>
              {NAV.map((item, idx) => {
                const hasChildren = !!item.children?.length;
                const isGroupOpen = openGroups[idx];

                return (
                  <div key={idx} style={{ display:"flex", flexDirection:"column" }}>
                    <div style={{ display:"flex", alignItems:"stretch", gap:2 }}>
                      <Link
                        href={item.href}
                        onClick={() => !hasChildren && setDrawerOpen(false)}
                        style={{
                          display:"flex", alignItems:"center", gap:14, flex:1,
                          padding:"14px 16px", borderRadius:16,
                          textDecoration:"none", color:"var(--drawer-text)",
                          fontFamily:"'M PLUS Rounded 1c', sans-serif",
                          fontWeight:700, fontSize:15,
                          transition:"background 0.18s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--drawer-hover-bg)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <span aria-hidden="true" style={{ width:44, height:44, borderRadius:12, display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0, background:item.iconBg, overflow:"hidden" }}>
                          <Image src={item.iconImg} alt="" width={40} height={40}
                            style={{ objectFit: item.iconCover ? "cover" : "contain", transform: `scale(${item.iconScale ?? 1.1})` }} />
                        </span>
                        <span style={{ flex:1 }}>{item.label}</span>
                        {item.soon && (
                          <span style={{ fontFamily:"'M PLUS Rounded 1c', sans-serif", fontWeight:800, fontSize:10, letterSpacing:"0.02em", padding:"3px 9px", borderRadius:999, background:"#ede9fe", color:"#8b5cf6", display:"inline-flex", alignItems:"center", gap:4 }}>
                            <svg width="10" height="4" viewBox="0 0 10 4" aria-hidden="true"><circle cx="1.5" cy="2" r="1.5" fill="currentColor"/><circle cx="5" cy="2" r="1.5" fill="currentColor"/><circle cx="8.5" cy="2" r="1.5" fill="currentColor"/></svg>
                            開発中
                          </span>
                        )}
                      </Link>

                      {hasChildren && !item.soon && (
                        <button
                          type="button"
                          onClick={() => toggleGroup(idx)}
                          aria-expanded={isGroupOpen}
                          style={{ width:36, borderRadius:12, border:"none", background:"transparent", cursor:"pointer", color:isGroupOpen ? "#8b5cf6" : "var(--drawer-text-subtle)", display:"inline-flex", alignItems:"center", justifyContent:"center", transition:"all 0.22s ease", flexShrink:0, padding:0 }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                            style={{ width:16, height:16, transform:isGroupOpen ? "rotate(180deg)" : undefined, transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1)" }}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {hasChildren && !item.soon && (
                      <div style={{ display:"grid", gridTemplateRows:isGroupOpen ? "1fr" : "0fr", transition:"grid-template-rows 0.32s cubic-bezier(0.4,0,0.2,1)" }}>
                        <div style={{ minHeight:0, overflow:"hidden", paddingLeft:56 }}>
                          <div style={{ display:"flex", flexDirection:"column", gap:2, paddingTop:isGroupOpen ? 4 : 0, paddingBottom:isGroupOpen ? 8 : 0, transition:"padding 0.32s ease" }}>
                            {item.children!.map((child, ci) => (
                              <Link
                                key={ci}
                                href={child.href}
                                onClick={() => setDrawerOpen(false)}
                                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 12px", borderRadius:10, textDecoration:"none", color:"var(--drawer-text-muted)", fontFamily:"'M PLUS Rounded 1c', sans-serif", fontWeight:700, fontSize:13, transition:"all 0.18s ease" }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--drawer-hover-bg)"; e.currentTarget.style.color = "var(--drawer-text)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--drawer-text-muted)"; }}
                              >
                                <span>
                                  <span style={{ color:"#c4b5fd", fontWeight:900, marginRight:8 }}>·</span>
                                  {child.label}
                                </span>
                                {child.soon && (
                                  <span style={{ fontFamily:"'M PLUS Rounded 1c', sans-serif", fontWeight:800, fontSize:9, letterSpacing:"0.02em", padding:"2px 7px", borderRadius:999, background:"#ede9fe", color:"#8b5cf6", marginLeft:8, flexShrink:0, display:"inline-flex", alignItems:"center", gap:3 }}>
                                    <svg width="8" height="3" viewBox="0 0 8 3" aria-hidden="true"><circle cx="1" cy="1.5" r="1" fill="currentColor"/><circle cx="4" cy="1.5" r="1" fill="currentColor"/><circle cx="7" cy="1.5" r="1" fill="currentColor"/></svg>
                                    開発中
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

            <div style={{ padding:"16px 24px 24px", borderTop:"1px dashed var(--drawer-border)", textAlign:"center", fontSize:11, color:"var(--drawer-text-subtle)", fontFamily:"Quicksand, sans-serif", letterSpacing:"0.06em", position:"relative", zIndex:1 }}>
              © 2026 ただただ <span style={{ color:"#f9a8d4" }}>♥</span>
            </div>
          </aside>

          {/* 認証モーダル */}
          {authOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="アカウント"
              style={{
                position: "fixed", inset: 0, zIndex: 1001,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 20,
              }}
            >
              <div style={{
                background: "var(--drawer-bg)", borderRadius: 28,
                width: "100%", maxWidth: 380,
                padding: "32px 28px 28px",
                position: "relative",
                boxShadow: "0 30px 80px -20px rgba(120,80,140,0.4)",
                overflow: "hidden",
              }}>
                <div style={{ position:"absolute", top:-50, right:-50, width:180, height:180, background:"radial-gradient(circle, #fbcfe8, transparent 70%)", opacity:0.3, pointerEvents:"none" }} />
                <div style={{ position:"absolute", bottom:-40, left:-40, width:160, height:160, background:"radial-gradient(circle, #a7f3d0, transparent 70%)", opacity:0.25, pointerEvents:"none" }} />

                <button
                  type="button"
                  onClick={() => setAuthOpen(false)}
                  aria-label="閉じる"
                  style={{ position:"absolute", top:18, right:18, width:32, height:32, borderRadius:"50%", border:"2px solid var(--drawer-border)", background:"var(--drawer-bg)", cursor:"pointer", color:"var(--drawer-text-muted)", fontSize:16, display:"inline-flex", alignItems:"center", justifyContent:"center", zIndex:2, padding:0, transition:"all 0.2s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#f9a8d4"; e.currentTarget.style.color = "#ec4899"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--drawer-border)"; e.currentTarget.style.color = "var(--drawer-text-muted)"; }}
                >
                  ✕
                </button>

                <div style={{ width:68, height:68, margin:"0 auto 16px", borderRadius:"50%", background:"linear-gradient(160deg, #ddd6fe, #c4b5fd)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", zIndex:1 }}>
                  <PersonSVG size={36} color="#ffffff" />
                </div>

                <h3 style={{ textAlign:"center", fontFamily:"'M PLUS Rounded 1c', sans-serif", fontWeight:900, fontSize:22, color:"var(--drawer-text)", marginBottom:8, position:"relative", zIndex:1 }}>
                  アカウント
                </h3>

                <p style={{ textAlign:"center", fontSize:13, color:"var(--drawer-text-muted)", lineHeight:1.7, marginBottom:24, position:"relative", zIndex:1 }}>
                  ツール履歴の保存・デバイス間の同期など、<br />
                  アカウント機能を準備中です。
                </p>

                <div style={{ padding:"20px", borderRadius:16, background:"linear-gradient(135deg, #ede9fe, #fce7f3)", textAlign:"center", marginBottom:16, position:"relative", zIndex:1 }}>
                  <p style={{ fontFamily:"Quicksand, sans-serif", fontWeight:800, fontSize:13, letterSpacing:"0.08em", color:"#8b5cf6", marginBottom:6 }}>COMING SOON</p>
                  <p style={{ fontSize:12, color:"#6b6779", lineHeight:1.6 }}>
                    基本機能はそのまま無料で<br />ご利用いただけます。
                  </p>
                </div>

                <p style={{ textAlign:"center", fontSize:11.5, color:"var(--drawer-text-subtle)", lineHeight:1.6, position:"relative", zIndex:1 }}>
                  <span style={{ color:"#f9a8d4" }}>♥</span> 登録なしでも全ツール使えます
                </p>
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </>
  );
}
