import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ただただ一問一答 | TADATADA",
  description: "スキマ時間にサクッと解ける、一問一答クイズ集。地理・歴史・漢字など多ジャンル対応。ログイン不要・すべて無料。",
  openGraph: {
    title: "ただただ一問一答 | TADATADA",
    description: "スキマ時間にサクッと解ける、一問一答クイズ集。ログイン不要・すべて無料。",
    url: "https://tadatada.net/quiz",
    siteName: "ただただ",
    locale: "ja_JP",
    type: "website",
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
