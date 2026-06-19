import type { Metadata } from "next";
import { BpmTool } from "./BpmTool";

const TOOL_NAME = "BPMメトロノーム";
const TITLE = "BPMメトロノーム｜無料・オンライン・タップ計測機能 - ただただ";
const DESCRIPTION =
  "無料のwebメトロノーム。広告控えめ・ログイン不要で、テンポや拍子を設定でき、タップで曲のBPMも計測。ギター・ピアノ・ドラム練習やバンドのテンポ合わせに使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "メトロノーム 無料",
    "オンライン メトロノーム",
    "メトロノーム 広告なし",
    "BPM 測定 タップ",
    "Tap Tempo",
    "タップテンポ 精度",
    "練習 テンポ",
    "拍子 設定",
  ],
  alternates: {
    canonical: "/tools/bpm",
  },
  openGraph: {
    url: "https://tadatada.net/tools/bpm",
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
  url: "https://tadatada.net/tools/bpm",
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

export default function BpmPage() {
  return (
    <>
      <BpmTool />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
