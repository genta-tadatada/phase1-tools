import type { Metadata } from "next";
import { StopwatchTool } from "./StopwatchTool";

const TOOL_NAME = "多列ストップウォッチ";
const TITLE = "無料ストップウォッチ｜複数同時に計測できる多列タイマー - ただただ";
const DESCRIPTION =
  "複数のタイムを同時に計測できる無料ストップウォッチ。スポーツ・実験・作業時間の比較計測に最適。インストール不要でスマホからもPCからもすぐ使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "ストップウォッチ 無料 オンライン",
    "マルチ ストップウォッチ",
    "ラップ タイム 計測",
    "部活 タイム計測",
    "複数 ストップウォッチ 同時",
  ],
  alternates: {
    canonical: "/tools/stopwatch",
  },
  openGraph: {
    url: "https://tadatada.net/tools/stopwatch",
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
  url: "https://tadatada.net/tools/stopwatch",
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

export default function StopwatchPage() {
  return (
    <>
      <StopwatchTool />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
