import type { Metadata } from "next";
import { CalculatorTool } from "./CalculatorTool";

const TOOL_NAME = "履歴付き電卓";
const TITLE = "電卓｜無料・計算履歴・消費税・関数 - ただただ";
const DESCRIPTION =
  "無料のweb電卓。広告控えめ・ログイン不要で、計算履歴が残り、税込・割引や関数にも対応。家計簿・仕事の集計・数学や理科の課題などに使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "電卓 ブラウザ 無料",
    "電卓 履歴 オンライン",
    "計算機 履歴付き",
    "電卓 1文字消す",
    "税込 計算 ツール",
    "割引 計算 電卓",
    "電卓 web シンプル",
  ],
  alternates: {
    canonical: "/tools/calculator",
  },
  openGraph: {
    url: "https://tadatada.net/tools/calculator",
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
  url: "https://tadatada.net/tools/calculator",
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

export default function CalculatorPage() {
  return (
    <>
      <CalculatorTool />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
