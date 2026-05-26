import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DarkModeToggle } from "@/components/tool-layout/DarkModeToggle";

export const metadata: Metadata = {
  title: "タダtools — 無料Webツール集",
  description:
    "広告控えめ・ログイン不要の無料Webツール集。カウンター・タイマー・電卓・じゃんけん・サイコロなど、日常で使えるツールを揃えています。",
};

type Tool = {
  name: string;
  href: string;
  description: string;
  emoji?: string;
  image?: string;
  playful?: boolean;
};

type Category = {
  label: string;
  playful?: boolean;
  tools: Tool[];
};

const CATEGORIES: Category[] = [
  {
    label: "計測・タイマー",
    tools: [
      {
        name: "マルチカウンター",
        href: "/counter",
        description: "複数のカウンターを同時に管理。ラップ記録・URLシェア対応。",
        image: "/icons/tool-counter.png",
      },
      {
        name: "ストップウォッチ",
        href: "/stopwatch",
        description: "ラップ機能付きストップウォッチ。",
        emoji: "⏱️",
      },
      {
        name: "タイマー",
        href: "/timer",
        description: "カウントダウン＆ポモドーロ。プリセットで即スタート。",
        emoji: "⏳",
      },
      {
        name: "BPMメトロノーム",
        href: "/bpm",
        description: "タップBPM測定・拍子設定対応。演奏中は広告非表示。",
        emoji: "🎵",
      },
    ],
  },
  {
    label: "数字・計算",
    tools: [
      {
        name: "電卓",
        href: "/calculator",
        description: "計算履歴・税込・割引対応。",
        emoji: "🧮",
      },
      {
        name: "ランダム数字",
        href: "/random-number",
        description: "範囲と個数を指定してランダムな整数を生成。重複なし対応。",
        emoji: "🎲",
        playful: true,
      },
      {
        name: "サイコロ",
        href: "/dice",
        description: "D4〜D20の多面体ダイス。複数同時振り対応。",
        emoji: "⚀",
        playful: true,
      },
      {
        name: "ルーレット",
        href: "/roulette",
        description: "選択肢を入れて回すだけ。何でも決められる。",
        emoji: "🎡",
        playful: true,
      },
    ],
  },
  {
    label: "テキスト",
    tools: [
      {
        name: "文字数カウント",
        href: "/word-count",
        description: "文字数・行数・バイト数を瞬時にカウント。SNS制限チェックにも。",
        emoji: "📝",
      },
    ],
  },
  {
    label: "抽選・対戦",
    playful: true,
    tools: [
      {
        name: "じゃんけん",
        href: "/janken",
        description: "CPU対戦・2〜6人の多人数モード。カウントダウン演出付き。",
        emoji: "✊",
        playful: true,
      },
      {
        name: "くじ引き",
        href: "/lot",
        description: "名前リストから公平に抽選。",
        emoji: "🎫",
        playful: true,
      },
      {
        name: "グループ分け",
        href: "/group",
        description: "均等グループを自動生成。",
        emoji: "👥",
        playful: true,
      },
      {
        name: "あみだくじ",
        href: "/amida",
        description: "自動生成あみだくじ。名前を入れるだけ。",
        emoji: "📏",
        playful: true,
      },
      {
        name: "トーナメント表",
        href: "/tournament",
        description: "参加者を入力するだけで自動ブラケット生成。",
        emoji: "🏆",
        playful: true,
      },
    ],
  },
];

const TOOL_COUNT = CATEGORIES.reduce((sum, c) => sum + c.tools.length, 0);

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-border bg-background sticky top-0 z-40">
        <span className="font-brand text-xl font-medium tracking-tight">TADATADA</span>
        <DarkModeToggle />
      </header>

      <main className="flex-1 px-4 sm:px-6 md:px-8">
        {/* Hero */}
        <div className="max-w-4xl mx-auto pt-16 pb-14 sm:pt-24 sm:pb-20 text-center">
          <p className="font-brand text-xs font-light text-muted-foreground tracking-[0.35em] uppercase mb-4">
            TADATADA
          </p>
          <h1 className="font-brand text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.05] mb-6">
            タダtools
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto leading-relaxed mb-8">
            広告控えめ・ログイン不要。
            <br className="hidden sm:block" />
            日常で使える無料Webツール集。
          </p>
          <span className="inline-block text-xs text-muted-foreground border border-border rounded-full px-3 py-1">
            {TOOL_COUNT} tools — すべて無料
          </span>
        </div>

        {/* Tool grid by category */}
        <div className="max-w-4xl mx-auto pb-20 flex flex-col gap-12">
          {CATEGORIES.map((cat) => (
            <section key={cat.label}>
              <h2 className={`text-xs font-medium tracking-widest uppercase mb-4 flex items-center gap-3 ${cat.playful ? "text-pink-400" : "text-muted-foreground"}`}>
                <span>{cat.label}</span>
                <span className={`flex-1 h-px ${cat.playful ? "bg-gradient-to-r from-pink-300 via-purple-300 to-teal-300" : "bg-border"}`} />
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.tools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className={`group block rounded-xl border bg-card shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 p-5 ${tool.playful ? "border-border hover:border-pink-300/60 hover:shadow-pink-100/50" : "border-border hover:border-accent/40"}`}
                  >
                    <div className="flex items-start gap-3">
                      {tool.image ? (
                        <Image
                          src={tool.image}
                          alt={tool.name}
                          width={36}
                          height={36}
                          className="flex-shrink-0 mt-0.5 object-contain"
                        />
                      ) : (
                        <span className="text-2xl flex-shrink-0 mt-0.5">{tool.emoji}</span>
                      )}
                      <div className="min-w-0">
                        <h3 className={`text-sm font-semibold text-foreground transition-colors leading-snug mb-1 ${tool.playful ? "group-hover:text-pink-400" : "group-hover:text-accent"}`}>
                          {tool.name}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-border py-6 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          <span className="font-brand">TADATADA</span> — 無料Webツール集
        </p>
      </footer>
    </div>
  );
}
