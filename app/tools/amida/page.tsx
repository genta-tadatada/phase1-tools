import type { Metadata } from "next";
import { AmidaTool } from "./AmidaTool";

const TOOL_NAME = "あみだくじ";
const TITLE = "あみだくじ｜無料で作成・順番決めや役割分担に - ただただ";
const DESCRIPTION =
  "無料のwebあみだくじ。広告控えめ・ログイン不要で、線をたどる演出で1人ずつ結果を発表。係決め・宴会の余興・プレゼント交換などに使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "あみだくじ 無料 作成",
    "あみだくじ オンライン",
    "くじ引き アプリ",
    "あみだくじ LINE 共有",
    "当番決め くじ",
  ],
  alternates: {
    canonical: "/tools/amida",
  },
  openGraph: {
    url: "https://tadatada.net/tools/amida",
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
  url: "https://tadatada.net/tools/amida",
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

export default function AmidaPage() {
  return (
    <>
      <AmidaTool />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
