import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ただタダgames | TADATADA",
  description: "ブラウザで遊べる、ログイン不要のゲーム集。高校サッカー育成シミュレーターなどを開発中。すべて無料。",
  openGraph: {
    title: "ただタダgames | TADATADA",
    description: "ブラウザで遊べる、ログイン不要のゲーム集。すべて無料。",
    url: "https://tadatada.net/games",
    siteName: "ただただ",
    locale: "ja_JP",
    type: "website",
  },
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
