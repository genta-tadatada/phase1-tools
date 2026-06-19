import type { Metadata } from "next";
import { LotTool } from "./LotTool";

const TOOL_NAME = "くじ引き";
const TITLE = "くじ引き｜無料・あたり本数を設定して当選者決め - ただただ";
const DESCRIPTION =
  "無料のwebくじ引き。広告控えめ・ログイン不要で、あたり本数を設定でき、公平に抽選。順番決め・係決め・イベント抽選などに使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "くじ引き 無料 オンライン",
    "ガチャ アプリ 無料",
    "抽選 ツール 無料",
    "当たり はずれ くじ",
    "景品 抽選 アプリ",
  ],
  alternates: {
    canonical: "/tools/lot",
  },
  openGraph: {
    url: "https://tadatada.net/tools/lot",
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
  url: "https://tadatada.net/tools/lot",
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

export default function LotPage() {
  return (
    <>
      <LotTool />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
