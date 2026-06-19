import type { Metadata } from "next";
import { JankenTool } from "./JankenTool";

const TOOL_NAME = "じゃんけん";
const TITLE = "じゃんけん｜無料・ひとりプレイ・多人数対応 - ただただ";
const DESCRIPTION =
  "無料のwebじゃんけん。広告控えめ・ログイン不要で、ひとりでCPUと、みんなで大人数でも遊べます。順番決め・担当者決め・勝負ごとなどに使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "じゃんけん アプリ 無料",
    "オンライン じゃんけん",
    "多人数 じゃんけん",
    "ランダム じゃんけん",
    "じゃんけん 決定",
  ],
  alternates: {
    canonical: "/tools/janken",
  },
  openGraph: {
    url: "https://tadatada.net/tools/janken",
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
  url: "https://tadatada.net/tools/janken",
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

export default function JankenPage() {
  return (
    <>
      <JankenTool />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
