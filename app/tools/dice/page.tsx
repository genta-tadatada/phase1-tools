import type { Metadata } from "next";
import { DiceTool } from "./DiceTool";
import { ToolJsonLd } from "@/components/tool-layout/ToolJsonLd";

const TOOL_NAME = "サイコロ";
const TITLE = "サイコロ｜無料・複数個・面数切替 - ただただ";
const DESCRIPTION =
  "無料のサイコロ。広告控えめ・ログイン不要で、複数個まとめて振れて多面ダイスにも対応。ボードゲーム・TRPG・罰ゲーム決めなどに使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "サイコロ アプリ 無料",
    "オンライン サイコロ",
    "ルーレット 作成 無料",
    "D6 ランダム",
    "ボードゲーム サイコロ",
    "当番決め ルーレット",
  ],
  alternates: {
    canonical: "/tools/dice",
  },
  openGraph: {
    url: "https://tadatada.net/tools/dice",
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

export default function DicePage() {
  return (
    <>
      <DiceTool />
      <ToolJsonLd slug="dice" description={DESCRIPTION} />
    </>
  );
}
