import type { Metadata } from "next";
import { StopwatchTool } from "./StopwatchTool";

const TOOL_NAME = "多列ストップウォッチ";
const TITLE = "ストップウォッチ｜無料・オンラインで複数タイムを同時計測 - ただただ";
const DESCRIPTION =
  "無料のwebストップウォッチ。広告控えめ・ログイン不要で、複数のタイムを同時に計測できます。スポーツや部活のタイム測定・実験・勉強時間の記録などに使えます。";

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
