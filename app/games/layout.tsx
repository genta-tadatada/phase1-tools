import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ただタダ games｜無料で遊べるブラウザゲーム集。- ただただ",
  description: "無料で遊べるブラウザゲーム集。高校サッカー育成シミュレーターなどを開発中。",
  openGraph: {
    title: "ただタダ games｜無料で遊べるブラウザゲーム集。- ただただ",
    description: "無料で遊べるブラウザゲーム集。",
    url: "https://tadatada.net/games",
    siteName: "ただただ",
    locale: "ja_JP",
    type: "website",
    images: [{ url: "/assets/ogp-games.jpg", width: 1200, height: 630, alt: "ただタダgames." }],
  },
  twitter: { card: "summary_large_image", images: ["/assets/ogp-games.jpg"] },
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
