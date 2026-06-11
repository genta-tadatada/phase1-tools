import type { Metadata } from "next";
import { WordCountTool } from "./WordCountTool";

const TOOL_NAME = "文字数カウント";
const TITLE = "無料文字数カウント｜文字数・行数を即チェック - ただただ";
const DESCRIPTION =
  "貼り付けるだけで文字数を瞬時にカウントする無料ツール。原稿・レポート・SNS投稿の文字数チェックに。インストール不要でスマホからもPCからもすぐ使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "文字数カウント 無料",
    "文字数 カウンター オンライン",
    "ツイッター 文字数 確認",
    "X 文字数 カウント",
    "文字数 リアルタイム",
    "SNS 文字数 制限 確認",
  ],
  alternates: {
    canonical: "/tools/word-count",
  },
  openGraph: {
    url: "https://tadatada.net/tools/word-count",
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: [
      {
        url: "/assets/icon-word-count.png",
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
  url: "https://tadatada.net/tools/word-count",
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

export default function WordCountPage() {
  return (
    <>
      <WordCountTool />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
