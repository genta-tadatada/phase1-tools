import type { Metadata } from "next";
import { LotTool } from "./LotTool";

const TOOL_NAME = "くじ引き";
const TITLE = "無料くじ引き｜あたり・はずれを決めるオンライン抽選 - ただただ";
const DESCRIPTION =
  "あたり・はずれの数を決めて引くだけの無料くじ引きツール。順番決めや当選者選びに便利。インストール不要でスマホからもPCからもブラウザですぐ使えます。";

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
        url: "/assets/icon-lot.png",
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
