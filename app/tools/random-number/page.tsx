import type { Metadata } from "next";
import { RandomNumberTool } from "./RandomNumberTool";

const TOOL_NAME = "ランダム数字";
const TITLE = "無料の乱数生成｜範囲を指定して数字をランダム表示 - ただただ";
const DESCRIPTION =
  "指定した範囲からランダムに数字を選ぶ無料の乱数生成ツール。抽選・順番決め・席替えなどに便利。インストール不要でスマホからもPCからもすぐ使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "ランダム 数字 生成",
    "乱数 ジェネレーター",
    "くじ番号 作成",
    "ランダム 当番決め",
    "無作為 数字",
  ],
  alternates: {
    canonical: "/tools/random-number",
  },
  openGraph: {
    url: "https://tadatada.net/tools/random-number",
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: [
      {
        url: "/assets/icon-random-number.png",
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
  url: "https://tadatada.net/tools/random-number",
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

export default function RandomNumberPage() {
  return (
    <>
      <RandomNumberTool />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
