import type { Metadata } from "next";
import { CounterTool } from "./CounterTool";
import { ToolJsonLd } from "@/components/tool-layout/ToolJsonLd";

const TOOL_NAME = "マルチカウンター";
const TITLE = "マルチカウンター｜無料で複数のカウントを同時管理 - ただただ";
const DESCRIPTION =
  "無料のwebマルチカウンター（数取り器）。広告控えめ・ログイン不要で、複数項目を同時カウント。在庫数え・人数カウント・スポーツの審判・周回カウントなどに使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "マルチカウンター",
    "多列カウンター",
    "複数カウンター",
    "ブラウザ カウンター",
    "数取器 web",
    "合唱コンクール 点数 数える",
    "審査員 点数 カウント",
    "筋トレ セット数 カウント",
    "在庫確認 カウンター",
    "イベント 入場者数 カウント",
    "カウンター 共有 URL",
    "カウンター ダークモード",
  ],
  alternates: {
    canonical: "/tools/counter",
  },
  openGraph: {
    url: "https://tadatada.net/tools/counter",
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

export default function CounterPage() {
  return (
    <>
      <CounterTool />
      <ToolJsonLd slug="counter" description={DESCRIPTION} />
    </>
  );
}
