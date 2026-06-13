"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import "../(portal)/portal.css";
import { GlobalMenu } from "@/components/shared/GlobalMenu";
import { TadatadaLogo } from "@/components/shared/TadatadaLogo";
import { DarkModeToggle } from "@/components/tool-layout/DarkModeToggle";
import { RequestCTA } from "@/components/shared/RequestCTA";

interface QuizCategory {
  icon: string;
  name: string;
  desc: string;
}

const CATEGORIES: QuizCategory[] = [
  { icon: "🗾", name: "地理", desc: "都道府県・国旗・地図系" },
  { icon: "📜", name: "歴史", desc: "年号・人物・事件系" },
  { icon: "✏️", name: "漢字", desc: "漢検レベル別" },
  { icon: "🔤", name: "英語", desc: "英検・TOEIC系" },
  { icon: "🚦", name: "交通", desc: "交通ルール・標識系" },
  { icon: "💡", name: "雑学", desc: "四字熟語・ことわざ系" },
];

const ACCENT = {
  iconGrad: "linear-gradient(135deg,#c4b5fd,#a78bfa)",
  iconShadow: "0 6px 18px -6px rgba(167,139,250,0.7)",
  cardBg: "var(--cat-play-card)",
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

function CategoryCard({ category, index }: { category: QuizCategory; index: number }) {
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
      {/* 開発中バッジ */}
      <span
        className="absolute top-3 right-3 px-2 py-0.5 rounded-full"
        style={{
          background: "linear-gradient(135deg,#a78bfa,#c4b5fd)",
          color: "#fff",
          fontSize: 10,
          fontWeight: 700,
          fontFamily: "'M PLUS Rounded 1c', sans-serif",
          letterSpacing: "0.04em",
          boxShadow: "0 2px 8px -2px rgba(167,139,250,0.5)",
        }}
      >
        開発中
      </span>
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: ACCENT.iconGrad, boxShadow: "0 4px 12px -4px rgba(0,0,0,0.15)", fontSize: 28 }}
      >
        <span aria-hidden>{category.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="font-black text-sm leading-snug mb-0.5 truncate"
          style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", color: "var(--th-text)" }}
        >
          {category.name}
        </div>
        <div
          className="text-[11px] leading-relaxed"
          style={{ color: "var(--th-text-muted)", fontFamily: "'M PLUS Rounded 1c', sans-serif",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {category.desc}
        </div>
      </div>
    </motion.div>
  );
}

export default function QuizPage() {
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
                ただただ<span style={{ color: "#a78bfa" }}>一問一答</span>
              </span>
            } />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <DarkModeToggle />
            <GlobalMenu activeSection="quiz" />
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden" style={{ padding: "60px 0 36px" }}>
        <img src="/uploads/kawaii-blob-lavender.svg" alt="" aria-hidden className="float-a absolute -top-20 -right-10 w-64 opacity-40 pointer-events-none select-none" />
        <img src="/uploads/kawaii-blob-pink.svg"     alt="" aria-hidden className="float-b absolute top-4 -left-16 w-56 opacity-30 pointer-events-none select-none" />
        <img src="/uploads/kawaii-blob-mint.svg"     alt="" aria-hidden className="float-c absolute -bottom-4 right-1/3 w-44 opacity-20 pointer-events-none select-none" />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle,var(--th-text-muted) 1px,transparent 1px)", backgroundSize: "28px 28px", opacity: "var(--tools-dot-opacity)" }} />

        <div className="relative max-w-3xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-6 text-center md:text-left">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest mb-7"
                style={{ background: "linear-gradient(135deg, #ede9fe, #ddd6fe)", color: "#7c3aed", fontFamily: "Quicksand, sans-serif", border: "1.5px solid rgba(196,181,253,0.45)", backdropFilter: "blur(8px)", boxShadow: "0 3px 14px rgba(196,181,253,0.28), inset 0 1px 0 rgba(255,255,255,0.8)" }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8Z" fill="#a78bfa"/>
                </svg>
                QUIZ · 一問一答
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 }}
                style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 900, fontSize: "clamp(36px,8.5vw,60px)", lineHeight: 1.1, letterSpacing: "0.01em", marginBottom: 20, display: "block" }}
              >
                <span className="relative inline-block" style={{ color: "var(--th-text)" }}>
                  ただただ
                  <span className="absolute rounded-full" style={{ left: "-2%", right: "-2%", bottom: 5, height: 8, background: "rgba(196,181,253,0.6)", opacity: 0.9, transform: "skewX(-8deg)", zIndex: -1 }} />
                </span>
                <span style={{ color: "#7c3aed" }}>一問</span>
                <span style={{ color: "#a78bfa" }}>一答</span>
                <span style={{ color: "#fcd34d" }}>.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.22 }}
                style={{ fontSize: 15, color: "var(--th-text-muted)", fontFamily: "'M PLUS Rounded 1c', sans-serif", lineHeight: 1.9, marginBottom: 0 }}
              >
                スキマ時間にサクッと解ける、一問一答クイズ集。
              </motion.p>
            </div>

            {/* TODO: 将来ここに一問一答用イラスト（日本列島など）を追加 */}
            <motion.img
              src="/uploads/kawaii-article-hero.svg"
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
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#a78bfa" }} />
            準備中のカテゴリ
          </div>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            }}
          >
            {CATEGORIES.map((category, i) => (
              <CategoryCard key={category.name} category={category} index={i} />
            ))}
          </div>
          <p
            className="text-center mt-8"
            style={{ fontSize: 12, color: "var(--th-text-muted)", fontFamily: "'M PLUS Rounded 1c', sans-serif" }}
          >
            ただいま準備中です。公開までしばらくお待ちください。
          </p>
        </div>
      </main>

      <RequestCTA context="quiz" />

      <footer style={{ borderTop: "1px solid var(--th-border)", padding: "28px 24px 40px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <Link href="/" style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 900, color: "var(--th-text)", textDecoration: "none" }}>
              ただただ<span style={{ color: "#7c3aed" }}>一問</span><span style={{ color: "#a78bfa" }}>一答</span><span style={{ color: "#fcd34d" }}>.</span>
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
