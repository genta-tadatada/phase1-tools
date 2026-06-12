"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import "../(portal)/portal.css";
import { GlobalMenu } from "@/components/shared/GlobalMenu";
import { TadatadaLogo } from "@/components/shared/TadatadaLogo";
import { DarkModeToggle } from "@/components/tool-layout/DarkModeToggle";

interface Game {
  icon: string;
  name: string;
  desc: string;
}

const GAMES: Game[] = [
  { icon: "⚽", name: "高校サッカー育成シミュレーション", desc: "サッカー監督として高校チームを育成" },
];

const PLACEHOLDER_COUNT = 3;

const ACCENT = {
  iconGrad: "linear-gradient(135deg,#fb7185,#f9a8d4)",
  iconShadow: "0 6px 18px -6px rgba(251,113,133,0.7)",
  cardBg: "var(--cat-text-card)",
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

function GameCard({ game, index }: { game: Game; index: number }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="relative flex flex-col gap-3 p-4 rounded-2xl overflow-hidden"
      style={{
        background: ACCENT.cardBg,
        border: "1.5px solid var(--tools-card-border)",
        boxShadow: "0 2px 12px -4px rgba(180,140,200,0.15)",
        opacity: 0.65,
        pointerEvents: "none",
      }}
    >
      {/* Coming Soonバッジ */}
      <span
        className="absolute top-3 right-3 px-2 py-0.5 rounded-full"
        style={{
          background: "linear-gradient(135deg,#fb7185,#f9a8d4)",
          color: "#fff",
          fontSize: 10,
          fontWeight: 700,
          fontFamily: "Quicksand, sans-serif",
          letterSpacing: "0.04em",
          boxShadow: "0 2px 8px -2px rgba(251,113,133,0.5)",
        }}
      >
        COMING SOON
      </span>
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: ACCENT.iconGrad, boxShadow: "0 4px 12px -4px rgba(0,0,0,0.15)", fontSize: 28 }}
      >
        <span aria-hidden>{game.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="font-black text-sm leading-snug mb-0.5"
          style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", color: "var(--th-text)" }}
        >
          {game.name}
        </div>
        <div
          className="text-[11px] leading-relaxed"
          style={{ color: "var(--th-text-muted)", fontFamily: "'M PLUS Rounded 1c', sans-serif",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {game.desc}
        </div>
      </div>
    </motion.div>
  );
}

function PlaceholderCard({ index }: { index: number }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl"
      style={{
        minHeight: 132,
        border: "2px dashed var(--th-border)",
        background: "transparent",
        opacity: 0.55,
        pointerEvents: "none",
      }}
    >
      <span
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: "var(--tools-filter-inactive-bg)", fontSize: 22, fontWeight: 900, color: "var(--th-text-muted)", fontFamily: "'M PLUS Rounded 1c', sans-serif" }}
        aria-hidden
      >
        ？
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--th-text-muted)", fontFamily: "'M PLUS Rounded 1c', sans-serif" }}>
        企画中
      </span>
    </motion.div>
  );
}

export default function GamesPage() {
  return (
    <div className="portal-page tools-dark-mode min-h-screen">
      <style>{`
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
        .dark .tools-dark-mode .p-header { background: var(--th-bg) !important; }
      `}</style>

      <header className="p-header">
        <div className="p-header-inner md">
          <Link href="/" className="p-logo">
            <TadatadaLogo titleNode={
              <span style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 900, fontSize: 11, letterSpacing: "0.02em", color: "var(--th-text)" }}>
                ただ<span style={{ color: "#fb7185" }}>タダ</span><span style={{ color: "#ec4899" }}>games</span>
              </span>
            } />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <DarkModeToggle />
            <GlobalMenu activeSection="games" />
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden" style={{ padding: "60px 0 36px" }}>
        <img src="/uploads/kawaii-blob-pink.svg"     alt="" aria-hidden className="float-a absolute -top-20 -right-10 w-64 opacity-40 pointer-events-none select-none" />
        <img src="/uploads/kawaii-blob-lavender.svg" alt="" aria-hidden className="float-b absolute top-4 -left-16 w-56 opacity-30 pointer-events-none select-none" />
        <img src="/uploads/kawaii-blob-blue.svg"     alt="" aria-hidden className="float-c absolute -bottom-4 right-1/3 w-44 opacity-20 pointer-events-none select-none" />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle,var(--th-text-muted) 1px,transparent 1px)", backgroundSize: "28px 28px", opacity: "var(--tools-dot-opacity)" }} />

        <div className="relative max-w-3xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-6 text-center md:text-left">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest mb-7"
                style={{ background: "linear-gradient(135deg, #fce7f3, #fbcfe8)", color: "#db2777", fontFamily: "Quicksand, sans-serif", border: "1.5px solid rgba(249,168,212,0.5)", backdropFilter: "blur(8px)", boxShadow: "0 3px 14px rgba(249,168,212,0.28), inset 0 1px 0 rgba(255,255,255,0.8)" }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8Z" fill="#fb7185"/>
                </svg>
                GAMES · ゲーム
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 }}
                style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 900, fontSize: "clamp(40px,9vw,68px)", lineHeight: 1.1, letterSpacing: "0.01em", marginBottom: 20, display: "block" }}
              >
                <span className="relative inline-block" style={{ color: "var(--th-text)" }}>
                  ただ
                  <span className="absolute rounded-full" style={{ left: "-2%", right: "-2%", bottom: 5, height: 8, background: "rgba(249,168,212,0.6)", opacity: 0.9, transform: "skewX(-8deg)", zIndex: -1 }} />
                </span>
                <span style={{ color: "#fb7185" }}>タダ</span>
                <span style={{ color: "#ec4899" }}>games</span>
                <span style={{ color: "#a78bfa" }}>.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.22 }}
                style={{ fontSize: 15, color: "var(--th-text-muted)", fontFamily: "'M PLUS Rounded 1c', sans-serif", lineHeight: 1.9, marginBottom: 0 }}
              >
                ブラウザで遊べる、ログイン不要のゲーム集。
              </motion.p>
            </div>

            {/* TODO: 将来ここにgames用イラスト（サッカーボールなど）を追加 */}
            <motion.img
              src="/uploads/kawaii-trophy.svg"
              alt=""
              aria-hidden
              className="float-a pointer-events-none select-none flex-shrink-0"
              style={{ width: 160 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            />
          </div>
        </div>
      </section>

      <main style={{ padding: "20px 0 80px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 20px" }}>
          <div
            className="flex items-center gap-2 mb-4"
            style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 800, fontSize: 13, color: "var(--th-text-muted)" }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#fb7185" }} />
            開発中のゲーム
          </div>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            }}
          >
            {GAMES.map((game, i) => (
              <GameCard key={game.name} game={game} index={i} />
            ))}
            {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
              <PlaceholderCard key={`placeholder-${i}`} index={GAMES.length + i} />
            ))}
          </div>
          <p
            className="text-center mt-8"
            style={{ fontSize: 12, color: "var(--th-text-muted)", fontFamily: "'M PLUS Rounded 1c', sans-serif" }}
          >
            ただいま開発中です。公開までしばらくお待ちください。
          </p>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid var(--th-border)", padding: "28px 24px 40px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <Link href="/" style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 900, color: "var(--th-text)", textDecoration: "none" }}>
              ただ<span style={{ color: "#fb7185" }}>タダ</span><span style={{ color: "#ec4899" }}>games</span><span style={{ color: "#a78bfa" }}>.</span>
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
