import type { Metadata } from "next";
import { JankenTool } from "./JankenTool";
import { ToolJsonLd } from "@/components/tool-layout/ToolJsonLd";

const TOOL_NAME = "じゃんけん";
const TITLE = "じゃんけん｜無料・ひとりプレイ・多人数対応 - ただただ";
const DESCRIPTION =
  "無料のwebじゃんけん。広告控えめ・ログイン不要で、ひとりでCPUと、みんなで大人数でも遊べます。順番決め・担当者決め・勝負ごとなどに使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "じゃんけん アプリ 無料",
    "オンライン じゃんけん",
    "多人数 じゃんけん",
    "ランダム じゃんけん",
    "じゃんけん 決定",
  ],
  alternates: {
    canonical: "/tools/janken",
  },
  openGraph: {
    url: "https://tadatada.net/tools/janken",
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

export default function JankenPage() {
  return (
    <>
      <JankenTool />
      <ToolJsonLd slug="janken" description={DESCRIPTION} />
    </>
  );
}
