import type { Metadata } from "next";
import { TimerTool } from "./TimerTool";
import { ToolJsonLd } from "@/components/tool-layout/ToolJsonLd";

const TOOL_NAME = "タイマー";
const TITLE = "タイマー｜無料・オンライン・ポモドーロ機能 - ただただ";
const DESCRIPTION =
  "無料のwebタイマー。広告控えめ・ログイン不要で、ポモドーロ・全画面表示・アラーム通知に対応。勉強・作業・料理・筋トレの時間管理などに使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "タイマー オンライン 無料",
    "カウントダウンタイマー ブラウザ",
    "ポモドーロタイマー 無料",
    "キッチンタイマー web",
    "5分タイマー",
    "25分タイマー",
    "勉強 タイマー ブラウザ",
    "集中 タイマー 無料",
  ],
  alternates: {
    canonical: "/tools/timer",
  },
  openGraph: {
    url: "https://tadatada.net/tools/timer",
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

export default function TimerPage() {
  return (
    <>
      <TimerTool />
      <ToolJsonLd slug="timer" description={DESCRIPTION} />
    </>
  );
}
