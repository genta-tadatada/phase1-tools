import type { Metadata } from "next";
import { WordCountTool } from "./WordCountTool";
import { ToolJsonLd } from "@/components/tool-layout/ToolJsonLd";

const TOOL_NAME = "文字数カウント";
const TITLE = "文字数カウント｜無料・字数制限チェック・原稿用紙換算 - ただただ";
const DESCRIPTION =
  "無料のweb文字数カウント。広告控えめ・ログイン不要で、字数制限の残りもバーで確認できます。レポート・小論文・X投稿(140字)・原稿用紙の換算などに使えます。";

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

export default function WordCountPage() {
  return (
    <>
      <WordCountTool />
      <ToolJsonLd slug="word-count" description={DESCRIPTION} />
    </>
  );
}
