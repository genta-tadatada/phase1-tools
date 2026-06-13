import type { Metadata } from "next";
import { TournamentTool } from "./TournamentTool";

const TOOL_NAME = "トーナメント表";
const TITLE = "無料トーナメント表メーカー｜対戦表をかんたん作成 - ただただ";
const DESCRIPTION =
  "参加者を入れるだけで対戦表が完成する無料のトーナメント表メーカー。大会・ゲーム・スポーツの組み合わせ作成に。インストール不要でスマホからもすぐ使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "トーナメント表 無料 作成",
    "組み合わせ 抽選",
    "対戦表 ランダム",
    "登録不要 トーナメント",
    "ブラケット 無料",
  ],
  alternates: {
    canonical: "/tools/tournament",
  },
  openGraph: {
    url: "https://tadatada.net/tools/tournament",
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: [
      {
        url: "/assets/ogp-tools.jpg",
        width: 1200,
        height: 630,
        alt: `${TOOL_NAME} | ただただ`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/assets/ogp-tools.jpg"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: TOOL_NAME,
  url: "https://tadatada.net/tools/tournament",
  description: DESCRIPTION,
  applicationCategory: "UtilityApplication",
  operatingSystem: "Web Browser",
  inLanguage: "ja",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "JPY",
  },
  provider: {
    "@type": "Organization",
    name: "ただただ",
    url: "https://tadatada.net",
  },
};

export default function TournamentPage() {
  return (
    <>
      <TournamentTool />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
