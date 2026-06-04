"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import "../(portal)/portal.css";
import { GlobalMenu } from "@/components/shared/GlobalMenu";
import { TadatadaLogo } from "@/components/shared/TadatadaLogo";
import { DarkModeToggle } from "@/components/tool-layout/DarkModeToggle";

type Cat = "all" | "calc" | "text" | "play";

interface Tool {
  href: string;
  icon: string;
  name: string;
  desc: string;
  cat: Cat;
}

const TOOLS: Tool[] = [
  { href: "/counter",       icon: "/assets/icon-counter.png",       name: "マルチカウンター",    desc: "複数項目を同時にカウント",      cat: "calc" },
  { href: "/stopwatch",     icon: "/assets/icon-stopwatch.png",     name: "多列ストップウォッチ", desc: "ラップ計測対応・1/100秒精度",   cat: "calc" },
  { href: "/timer",         icon: "/assets/icon-timer.png",         name: "タイマー",            desc: "カウントダウン・アラーム付き",  cat: "calc" },
  { href: "/bpm",           icon: "/assets/icon-bpm.png",           name: "BPMメトロノーム",     desc: "40〜240 BPM・拍子設定可",      cat: "calc" },
  { href: "/calculator",    icon: "/assets/icon-calculator.png",    name: "履歴付き電卓",        desc: "計算履歴表示・税込割引特化",    cat: "calc" },
  { href: "/word-count",    icon: "/assets/icon-word-count.png",    name: "文字数カウント",       desc: "文字・単語・行数を瞬時に集計",  cat: "text" },
  { href: "/random-number", icon: "/assets/icon-random-number.png", name: "ランダム数字",         desc: "範囲指定・重複なし対応",        cat: "play" },
  { href: "/dice",          icon: "/assets/icon-dice.png",          name: "サイコロ",             desc: "最大10個まで同時に振れる",      cat: "play" },
  { href: "/roulette",      icon: "/assets/icon-roulette.png",      name: "ルーレット",           desc: "選択肢を入れて回すだけ",        cat: "play" },
  { href: "/janken",        icon: "/assets/icon-janken.png",        name: "じゃんけん",            desc: "CPU対戦・多人数モード対応",     cat: "play" },
  { href: "/lot",           icon: "/assets/icon-lot.png",           name: "くじ引き",             desc: "名前リストから公平に抽選",      cat: "play" },
  { href: "/group",         icon: "/assets/icon-group.png",         name: "グループ分け",         desc: "均等グループを自動生成",        cat: "play" },
  { href: "/amida",         icon: "/assets/icon-amida.png",         name: "あみだくじ",           desc: "自動生成あみだくじ",            cat: "play" },
  { href: "/tournament",    icon: "/assets/icon-tournament.png",    name: "トーナメント表",       desc: "参加者入力で自動ブラケット",    cat: "play" },
];

const CAT_STYLE: Record<Cat, {
  iconGrad: string; iconShadow: string; cardBg: string; dot: string;
  filterActive: string; filterShadow: string;
}> = {
  calc: {
    iconGrad: "linear-gradient(135deg,#6ee7b7,#38bdf8)",
    iconShadow: "0 6px 18px -6px rgba(110,231,183,0.7)",
    cardBg: "linear-gradient(160deg,#ecfdf5,#e0f2fe)",
    dot: "#6ee7b7",
    filterActive: "linear-gradient(135deg,#6ee7b7,#38bdf8)",
    filterShadow: "0 4px 14px -4px rgba(110,231,183,0.6)",
  },
  text: {
    iconGrad: "linear-gradient(135deg,#f9a8d4,#f472b6)",
    iconShadow: "0 6px 18px -6px rgba(249,168,212,0.7)",
    cardBg: "linear-gradient(160deg,#fdf2f8,#fce7f3)",
    dot: "#f9a8d4",
    filterActive: "linear-gradient(135deg,#f9a8d4,#e879f9)",
    filterShadow: "0 4px 14px -4px rgba(249,168,212,0.6)",
  },
  play: {
    iconGrad: "linear-gradient(135deg,#c4b5fd,#f9a8d4)",
    iconShadow: "0 6px 18px -6px rgba(196,181,253,0.7)",
    cardBg: "linear-gradient(160deg,#f5f3ff,#fdf2f8)",
    dot: "#c4b5fd",
    filterActive: "linear-gradient(135deg,#a78bfa,#f9a8d4)",
    filterShadow: "0 4px 14px -4px rgba(196,181,253,0.6)",
  },
  all: {
    iconGrad: "linear-gradient(135deg,#7dd3fc,#c4b5fd)",
    iconShadow: "0 6px 18px -6px rgba(125,211,252,0.6)",
    cardBg: "linear-gradient(160deg,#f0f9ff,#f5f3ff)",
    dot: "#7dd3fc",
    filterActive: "linear-gradient(135deg,#7dd3fc,#a78bfa)",
    filterShadow: "0 4px 14px -4px rgba(125,211,252,0.5)",
  },
};

const FILTERS: { cat: Cat; label: string }[] = [
  { cat: "all",  label: "ぜんぶ" },
  { cat: "calc", label: "計算・計測" },
  { cat: "text", label: "テキスト" },
  { cat: "play", label: "抽選" },
];

const MotionLink = motion(Link);

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.04, duration: 0.35, ease: "easeOut" as const },
  }),
};

function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  const st = CAT_STYLE[tool.cat];
  return (
    <MotionLink
      href={tool.href}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
      whileTap={{ scale: 0.97 }}
      className="group relative flex flex-col gap-3 p-4 rounded-2xl overflow-hidden"
      style={{
        background: st.cardBg,
        border: "1.5px solid rgba(255,255,255,0.8)",
        boxShadow: "0 2px 12px -4px rgba(180,140,200,0.15)",
        textDecoration: "none",
        color: "inherit",
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
        e.currentTarget.style.boxShadow = `0 8px 28px -8px rgba(180,140,200,0.28), ${st.iconShadow}`;
        e.currentTarget.style.borderColor = "rgba(255,255,255,1)";
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
        e.currentTarget.style.boxShadow = "0 2px 12px -4px rgba(180,140,200,0.15)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.8)";
      }}
    >
      {/* シマーライン */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "linear-gradient(110deg,transparent 40%,rgba(255,255,255,0.4) 55%,transparent 70%)", backgroundSize: "200% 100%", animation: "shimmer 1.2s ease-out" }}
      />

      {/* アイコン */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3"
        style={{ background: st.iconGrad, boxShadow: "0 4px 12px -4px rgba(0,0,0,0.15)" }}
      >
        <Image src={tool.icon} alt="" width={46} height={46} style={{ objectFit: "contain", transform: "translateY(2px)" }} />
      </div>

      {/* テキスト */}
      <div className="flex-1 min-w-0">
        <div
          className="font-black text-sm leading-snug mb-0.5 truncate"
          style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", color: "var(--th-text)" }}
        >
          {tool.name}
        </div>
        <div
          className="text-[11px] leading-relaxed"
          style={{ color: "var(--th-text-muted)", fontFamily: "'M PLUS Rounded 1c', sans-serif",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {tool.desc}
        </div>
      </div>

      {/* 矢印 */}
      <div
        className="absolute bottom-3 right-3 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0"
        style={{ background: "rgba(255,255,255,0.85)", fontSize: 10, color: "var(--th-text-muted)" }}
      >
        →
      </div>
    </MotionLink>
  );
}

export default function ToolsPage() {
  const [activeCat, setActiveCat] = useState<Cat>("all");
  const visible = TOOLS.filter((t) => activeCat === "all" || t.cat === activeCat);

  return (
    <div className="portal-page min-h-screen">
      <style>{`
        @keyframes shimmer {
          0%{background-position:200% 0}
          100%{background-position:-200% 0}
        }
        @keyframes floatA {
          0%,100%{transform:translateY(0) rotate(0deg)}
          50%{transform:translateY(-12px) rotate(3deg)}
        }
        @keyframes floatB {
          0%,100%{transform:translateY(0) rotate(0deg)}
          50%{transform:translateY(-8px) rotate(-2deg)}
        }
        .float-a { animation: floatA 5s ease-in-out infinite; }
        .float-b { animation: floatB 7s ease-in-out 1s infinite; }
        .float-c { animation: floatA 6s ease-in-out 2.5s infinite; }
        .dark .portal-page .p-header { background: var(--th-bg) !important; }
        .tool-filter-bar { background: rgba(255,255,255,0.82); }
        .dark .tool-filter-bar { background: rgba(15,16,26,0.88); }
      `}</style>

      {/* ─── ヘッダー ─── */}
      <header className="p-header">
        <div className="p-header-inner md">
          <Link href="/" className="p-logo">
            <TadatadaLogo titleNode={
              <span style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 900, fontSize: 11, letterSpacing: "0.02em", color: "var(--th-text)" }}>
                タダ<span style={{ color: "#0ea5e9" }}>tools</span><span style={{ color: "#f9a8d4" }}>.</span>
              </span>
            } />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <DarkModeToggle />
            <GlobalMenu activeSection="tools" />
          </div>
        </div>
      </header>

      {/* ─── ヒーロー ─── */}
      <section className="relative overflow-hidden" style={{ padding: "60px 0 36px" }}>
        {/* 装飾blob */}
        <img src="/uploads/kawaii-blob-pink.svg"     alt="" aria-hidden className="float-a absolute -top-20 -right-10 w-64 opacity-35 pointer-events-none select-none" />
        <img src="/uploads/kawaii-blob-lavender.svg" alt="" aria-hidden className="float-b absolute top-4 -left-16 w-56 opacity-30 pointer-events-none select-none" />
        <img src="/uploads/kawaii-blob-mint.svg"     alt="" aria-hidden className="float-c absolute -bottom-4 right-1/3 w-44 opacity-20 pointer-events-none select-none" />
        {/* ドット背景 */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle,#f9a8d4 1px,transparent 1px)", backgroundSize: "28px 28px", opacity: 0.2 }} />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          {/* バッジ */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest mb-7"
            style={{ background: "rgba(237,233,254,0.85)", color: "#7c3aed", fontFamily: "Quicksand, sans-serif", border: "1.5px solid #ddd6fe", backdropFilter: "blur(8px)" }}
          >
            ✦ FREE TOOLS &nbsp;·&nbsp; {TOOLS.length} tools
          </motion.div>

          {/* メインタイトル */}
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 900, fontSize: "clamp(52px,11vw,88px)", lineHeight: 1.05, letterSpacing: "0.01em", marginBottom: 20, display: "block" }}
          >
            <span className="relative inline-block" style={{ color: "var(--th-text)" }}>
              タダ
              <span className="absolute rounded-full" style={{ left: "-2%", right: "-2%", bottom: 6, height: 10, background: "#fbcfe8", opacity: 0.8, transform: "skewX(-8deg)", zIndex: -1 }} />
            </span>
            <span style={{ color: "#0ea5e9" }}>tools</span>
            <span style={{ color: "#f9a8d4" }}>.</span>
          </motion.h1>

          {/* サブコピー */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            style={{ fontSize: 15, color: "var(--th-text-muted)", fontFamily: "'M PLUS Rounded 1c', sans-serif", lineHeight: 1.9, marginBottom: 0 }}
          >
            日常で使える無料Webツール集。<br />広告控えめ、使いたいものだけを。
          </motion.p>
        </div>
      </section>

      {/* ─── フィルタータブ ─── */}
      <div
        className="tool-filter-bar sticky z-30 flex justify-center gap-2 flex-wrap px-4 py-3"
        style={{ top: 57, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: "1px solid rgba(241,236,243,0.9)" }}
      >
        {FILTERS.map((f) => {
          const st = CAT_STYLE[f.cat];
          const isActive = activeCat === f.cat;
          return (
            <motion.button
              key={f.cat}
              type="button"
              onClick={() => setActiveCat(f.cat)}
              whileTap={{ scale: 0.94 }}
              className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition-colors duration-200"
              style={{
                fontFamily: "'M PLUS Rounded 1c', sans-serif",
                background: isActive ? st.filterActive : "rgba(255,255,255,0.65)",
                color: isActive ? "#fff" : "var(--th-text-muted)",
                border: isActive ? "1.5px solid transparent" : "1.5px solid rgba(241,236,243,0.9)",
                boxShadow: isActive ? st.filterShadow : "none",
                backdropFilter: "blur(8px)",
              }}
            >
              {f.cat !== "all" && (
                <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isActive ? "rgba(255,255,255,0.7)" : st.dot }} />
              )}
              {f.label}
              {f.cat === "all" && (
                <span style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 800, fontSize: 10, opacity: 0.7, marginLeft: 2 }}>{TOOLS.length}</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ─── ツールグリッド ─── */}
      <main style={{ padding: "20px 0 80px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 20px" }}>
          <motion.div
            key={activeCat}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            }}
          >
            {visible.map((tool, i) => (
              <ToolCard key={tool.href} tool={tool} index={i} />
            ))}
          </motion.div>
        </div>
      </main>

      {/* ─── フッター ─── */}
      <footer style={{ borderTop: "1px solid var(--th-border)", padding: "28px 24px 40px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <Link href="/" style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 900, color: "var(--th-text)", textDecoration: "none" }}>
              タダ<span style={{ color: "#0ea5e9" }}>tools</span><span style={{ color: "#f9a8d4" }}>.</span>
            </Link>
            <span style={{ color: "var(--th-border)" }}>—</span>
            <Link href="/" style={{ color: "var(--th-text-muted)", textDecoration: "none", fontSize: 12 }}>ポータルへ</Link>
            <span style={{ color: "var(--th-border)" }}>·</span>
            <Link href="/privacy" style={{ color: "var(--th-text-muted)", textDecoration: "none", fontSize: 12 }}>プライバシー</Link>
          </div>
          <span style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 600, fontSize: 11, color: "var(--th-text-muted)", letterSpacing: "0.06em" }}>
            Made with <span style={{ color: "#f9a8d4" }}>♥</span> 2026 ただただ
          </span>
        </div>
      </footer>
    </div>
  );
}
