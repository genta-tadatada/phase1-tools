import type { Metadata } from "next";
import { JankenTool } from "./JankenTool";

const TOOL_NAME = "じゃんけん";
const TITLE = "無料じゃんけん｜ひとりでも遊べるオンラインじゃんけん - ただただ";
const DESCRIPTION =
  "相手がいなくても遊べる無料のオンラインじゃんけん。順番決めや勝負ごとの判定にぴったり。インストール不要でスマホからもPCからもブラウザですぐ遊べます。";

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
