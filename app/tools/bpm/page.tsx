import type { Metadata } from "next";
import { BpmTool } from "./BpmTool";

const TOOL_NAME = "BPMメトロノーム";
const TITLE = "無料メトロノーム｜タップでBPMを測れるオンラインメトロノーム - ただただ";
const DESCRIPTION =
  "テンポを刻む無料オンラインメトロノーム。タップでBPMを測定でき、楽器練習やリズム確認に便利。アプリ不要でスマホからもPCからもブラウザですぐ使えます。";

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
        url: "/assets/icon-bpm.png",
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
