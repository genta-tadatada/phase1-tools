import type { Metadata } from "next";
import { CalculatorTool } from "./CalculatorTool";

const TOOL_NAME = "履歴付き電卓";
const TITLE = "無料電卓｜計算履歴が残るブラウザ電卓 - ただただ";
const DESCRIPTION =
  "計算の履歴がそのまま残る無料のブラウザ電卓。前の計算を見返しながら作業でき、家計簿や仕事の集計に便利。インストール不要でスマホからもすぐ使えます。";

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
