import type { Metadata } from "next";
import { DiceTool } from "./DiceTool";

const TOOL_NAME = "サイコロ";
const TITLE = "無料サイコロ｜ブラウザで振れるデジタルサイコロ - ただただ";
const DESCRIPTION =
  "ボタンを押すだけで振れる無料のデジタルサイコロ。複数個の同時振りにも対応し、ボードゲームや順番決めに便利。インストール不要でスマホからもすぐ使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "サイコロ アプリ 無料",
    "オンライン サイコロ",
    "ルーレット 作成 無料",
    "D6 ランダム",
    "ボードゲーム サイコロ",
    "当番決め ルーレット",
  ],
  alternates: {
    canonical: "/tools/dice",
  },
  openGraph: {
    url: "https://tadatada.net/tools/dice",
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: [
      {
        url: "/assets/icon-dice.png",
        width: 512,
        height: 512,
        alt: `${TOOL_NAME} | ただただ`,
      },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: TOOL_NAME,
  url: "https://tadatada.net/tools/dice",
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

export default function DicePage() {
  return (
    <>
      <DiceTool />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
