"use client";

import { useState } from "react";
import Link from "next/link";
import "../(portal)/portal.css";
import { GlobalMenu } from "@/components/shared/GlobalMenu";

type Cat = "all" | "calc" | "text" | "play";

interface Tool {
  href: string;
  icon: string;
  name: string;
  desc: string;
  cat: Cat;
}

const TOOLS: Tool[] = [
  { href: "/counter",       icon: "🔢", name: "マルチカウンター",    desc: "複数項目を同時にカウント",      cat: "calc" },
  { href: "/stopwatch",     icon: "⏱️", name: "多列ストップウォッチ", desc: "ラップ計測対応・1/100秒精度",   cat: "calc" },
  { href: "/timer",         icon: "⏳", name: "タイマー",            desc: "カウントダウン・アラーム付き",  cat: "calc" },
  { href: "/bpm",           icon: "🎵", name: "BPMメトロノーム",     desc: "40〜240 BPM・拍子設定可",      cat: "calc" },
  { href: "/calculator",    icon: "🧮", name: "履歴付き電卓",        desc: "計算履歴表示・税込割引特化",    cat: "calc" },
  { href: "/word-count",    icon: "📝", name: "文字数カウント",       desc: "文字・単語・行数を瞬時に集計",  cat: "text" },
  { href: "/random-number", icon: "🎲", name: "ランダム数字",         desc: "範囲指定・重複なし対応",        cat: "play" },
  { href: "/dice",          icon: "⚀",  name: "サイコロ",             desc: "最大10個まで同時に振れる",      cat: "play" },
  { href: "/roulette",      icon: "🎡", name: "ルーレット",           desc: "選択肢を入れて回すだけ",        cat: "play" },
  { href: "/janken",        icon: "✊", name: "じゃんけん",            desc: "CPU対戦・多人数モード対応",     cat: "play" },
  { href: "/lot",           icon: "🎫", name: "くじ引き",             desc: "名前リストから公平に抽選",      cat: "play" },
  { href: "/group",         icon: "👥", name: "グループ分け",         desc: "均等グループを自動生成",        cat: "play" },
  { href: "/amida",         icon: "📏", name: "あみだくじ",           desc: "自動生成あみだくじ",            cat: "play" },
  { href: "/tournament",    icon: "🏆", name: "トーナメント表",       desc: "参加者入力で自動ブラケット",    cat: "play" },
];

const catIconBg: Record<string, string> = {
  calc: "linear-gradient(160deg,#d1fae5,#a7f3d0)",
  text: "linear-gradient(160deg,#fce7f3,#fbcfe8)",
  play: "linear-gradient(160deg,#fbcfe8,#ddd6fe,#a7f3d0)",
};
const catHoverBorder: Record<string, string> = {
  calc: "#6ee7b7",
  text: "#f9a8d4",
  play: "#f9a8d4",
};
const catHoverShadow: Record<string, string> = {
  calc: "rgba(110,231,183,0.18)",
  text: "rgba(249,168,212,0.2)",
  play: "rgba(249,168,212,0.22)",
};

const FILTERS: { cat: Cat; label: string }[] = [
  { cat: "all",  label: "ぜんぶ" },
  { cat: "calc", label: "計算・計測" },
  { cat: "text", label: "テキスト" },
  { cat: "play", label: "抽選" },
];

export default function ToolsPage() {
  const [activeCat, setActiveCat] = useState<Cat>("all");

  const visible = TOOLS.filter((t) => activeCat === "all" || t.cat === activeCat);

  return (
    <div className="portal-page">
      <style>{`
        @keyframes twinkle {
          0%,100%{transform:scale(1) rotate(0);opacity:.9}
          50%{transform:scale(.5) rotate(30deg);opacity:.3}
        }
        @keyframes toolCardHover {}
        .tool-card { transition: all 0.22s cubic-bezier(0.4,0,0.2,1); }
        .tool-card:hover { transform: translateY(-3px); }
        .tool-card:hover .tool-icon-inner { transform: rotate(-4deg) scale(1.05); }
        .tool-icon-inner { transition: transform 0.22s ease; }
        .sparkle-anim { animation: twinkle 2.6s ease-in-out infinite; }
      `}</style>

      {/* ヘッダー */}
      <header className="p-header">
        <div className="p-header-inner md">
          <Link href="/" className="p-breadcrumb">
            <span className="p-brand">TADATADA<span className="p-brand-dot" /></span>
            <span className="p-sep">/</span>
            <span style={{ fontFamily:"'M PLUS Rounded 1c', sans-serif", fontWeight:900, fontSize:15, letterSpacing:"0.02em", color:"#1f1d2b" }}>
                タダ<span style={{ color:"#0ea5e9" }}>tools</span><span style={{ color:"#f9a8d4" }}>.</span>
              </span>
          </Link>
          <GlobalMenu activeSection="tools" />
        </div>
      </header>

      {/* ヒーロー */}
      <section style={{ position:"relative", padding:"48px 0 16px", overflow:"hidden" }}>
        {/* ドット背景 */}
        <div style={{ position:"absolute", top:30, left:-60, width:200, height:200, backgroundImage:"radial-gradient(circle, #fbcfe8 1.5px, transparent 2px)", backgroundSize:"16px 16px", opacity:0.55, pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-30, right:-60, width:240, height:240, background:"radial-gradient(circle at center, rgba(196,181,253,0.35), transparent 70%)", pointerEvents:"none" }} />

        {/* スパークル */}
        <span className="sparkle-anim" style={{ position:"absolute", top:80, left:"14%", width:14, height:14, background:"#f9a8d4", clipPath:"polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)" }} />
        <span className="sparkle-anim" style={{ position:"absolute", top:140, right:"12%", width:10, height:10, background:"#c4b5fd", clipPath:"polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)", animationDelay:"0.6s" }} />
        <span className="sparkle-anim" style={{ position:"absolute", bottom:90, left:"8%", width:12, height:12, background:"#6ee7b7", clipPath:"polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)", animationDelay:"1.2s" }} />
        <span className="sparkle-anim" style={{ position:"absolute", top:50, right:"22%", width:9, height:9, background:"#fcd34d", clipPath:"polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)", animationDelay:"1.8s" }} />

        <div style={{ maxWidth:896, margin:"0 auto", padding:"0 24px", position:"relative" }}>
          <div style={{ textAlign:"center", maxWidth:640, margin:"0 auto" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", background:"#ede9fe", color:"#8b5cf6", borderRadius:999, fontFamily:"Quicksand, sans-serif", fontWeight:700, fontSize:11, letterSpacing:"0.18em", marginBottom:24 }}>
              ✦ FREE TOOLS &nbsp;·&nbsp; {TOOLS.length} tools
            </div>
            <h1 style={{ fontFamily:"'M PLUS Rounded 1c', sans-serif", fontWeight:900, fontSize:"clamp(48px,8vw,80px)", lineHeight:1.1, letterSpacing:"0.02em", color:"#1f1d2b", marginBottom:24, position:"relative", display:"inline-block" }}>
              <span style={{ position:"relative", display:"inline-block" }}>
                タダ
                <span style={{ position:"absolute", left:"-2%", right:"-2%", bottom:6, height:10, background:"#fbcfe8", borderRadius:6, zIndex:-1, transform:"skewX(-8deg)" }} />
              </span>
              <span style={{ color:"#0ea5e9" }}>tools</span>
              <span style={{ color:"#f9a8d4" }}>.</span>
            </h1>
            <p style={{ fontSize:16, color:"#6b6779", lineHeight:1.85, marginBottom:0 }}>
              日常で使える無料Webツール集。<br />
              広告控えめ、使いたいものだけを。
            </p>
          </div>
        </div>
      </section>

      {/* ツール一覧 */}
      <main style={{ padding:"8px 0 80px", position:"relative" }}>
        <div style={{ maxWidth:896, margin:"0 auto", padding:"0 24px", position:"relative" }}>

          {/* フィルターチップ */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", marginBottom:20 }}>
            {FILTERS.map((f) => (
              <button
                key={f.cat}
                type="button"
                onClick={() => setActiveCat(f.cat)}
                style={{
                  fontFamily:"'M PLUS Rounded 1c', sans-serif", fontWeight:700, fontSize:13,
                  padding:"8px 16px", borderRadius:999,
                  background: activeCat === f.cat ? "#1f1d2b" : "#fff",
                  border: activeCat === f.cat ? "2px solid #1f1d2b" : "2px solid #f1ecf3",
                  color: activeCat === f.cat ? "#fff" : "#6b6779",
                  cursor:"pointer", transition:"all 0.22s ease",
                  display:"inline-flex", alignItems:"center", gap:6,
                }}
              >
                {f.cat !== "all" && (
                  <span style={{
                    width:8, height:8, borderRadius:"50%", display:"inline-block",
                    background: f.cat === "calc" ? "#6ee7b7" : f.cat === "text" ? "#f9a8d4" : "linear-gradient(135deg,#f9a8d4,#c4b5fd,#6ee7b7)",
                  }} />
                )}
                {f.label}
                {f.cat === "all" && (
                  <span style={{ fontFamily:"Quicksand, sans-serif", fontWeight:800, opacity:0.7, marginLeft:2 }}>{TOOLS.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* ツールグリッド */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}
            className="tools-grid">
            <style>{`
              @media(max-width:880px){.tools-grid{grid-template-columns:repeat(3,1fr)!important}}
              @media(max-width:600px){.tools-grid{grid-template-columns:repeat(2,1fr)!important}}
              @media(max-width:380px){.tools-grid{grid-template-columns:1fr!important}}
            `}</style>

            {visible.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="tool-card"
                style={{
                  display:"block", textDecoration:"none", color:"inherit",
                  padding:"16px 14px 38px", background:"#ffffff",
                  border:"2px solid #f1ecf3", borderRadius:18,
                  cursor:"pointer", overflow:"hidden", minHeight:132,
                  position:"relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = catHoverBorder[tool.cat];
                  e.currentTarget.style.boxShadow = `0 0 0 4px ${catHoverShadow[tool.cat]}, 0 12px 28px -10px rgba(180,140,200,0.32)`;
                  const arrow = e.currentTarget.querySelector<HTMLElement>(".tool-arrow");
                  if (arrow) arrow.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#f1ecf3";
                  e.currentTarget.style.boxShadow = "";
                  const arrow = e.currentTarget.querySelector<HTMLElement>(".tool-arrow");
                  if (arrow) arrow.style.opacity = "0";
                }}
              >
                <div className="tool-icon-inner" style={{ position:"relative", width:40, height:40, borderRadius:12, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:12, background:catIconBg[tool.cat] }}>
                  {tool.icon}
                  <span style={{ position:"absolute", top:-3, right:-3, fontSize:10, color:"#fcd34d", opacity:0, transition:"all 0.22s ease" }} className="tool-sparkle">✦</span>
                </div>
                <div style={{ fontFamily:"'M PLUS Rounded 1c', sans-serif", fontWeight:900, fontSize:13.5, color:"#1f1d2b", marginBottom:2, letterSpacing:"0.02em", lineHeight:1.35 }}>
                  {tool.name}
                </div>
                <div style={{ fontSize:11, color:"#6b6779", lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                  {tool.desc}
                </div>
                <span className="tool-arrow" style={{ position:"absolute", bottom:12, right:14, width:22, height:22, borderRadius:"50%", background:"#fdf9fb", display:"inline-flex", alignItems:"center", justifyContent:"center", color:"#9a96a8", opacity:0, transition:"opacity 0.22s ease", fontSize:12 }}>
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer style={{ borderTop:"1px solid #f1ecf3", padding:"36px 0 48px" }}>
        <div style={{ maxWidth:896, margin:"0 auto", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, color:"#1f1d2b" }}>
            <span style={{ fontFamily:"Quicksand, sans-serif", fontWeight:800, letterSpacing:"0.04em" }}>TADATADA</span>
            <span style={{ color:"#9a96a8" }}>—</span>
            <span style={{ color:"#6b6779" }}>タダtools</span>
          </div>
          <span style={{ fontFamily:"Quicksand, sans-serif", fontWeight:600, fontSize:11, color:"#9a96a8", letterSpacing:"0.06em" }}>
            Made with <span style={{ color:"#f9a8d4" }}>♥</span> 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
