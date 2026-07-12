import type { Metadata } from "next";
import { TournamentTool } from "./TournamentTool";
import { ToolJsonLd } from "@/components/tool-layout/ToolJsonLd";

const TOOL_NAME = "トーナメント表";
const TITLE = "トーナメント表｜無料・自動作成・シード/ランダム対応 - ただただ";
const DESCRIPTION =
  "無料のwebトーナメント表。広告控えめ・ログイン不要で、勝者クリックで対戦が進行。3位決定戦にも対応。スポーツ大会・ゲーム大会・部活の試合などに使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "トーナメント表 無料 作成",
    "組み合わせ 抽選",
    "対戦表 ランダム",
    "登録不要 トーナメント",
    "ブラケット 無料",
  ],
  alternates: {
    canonical: "/tools/tournament",
  },
  openGraph: {
    url: "https://tadatada.net/tools/tournament",
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

export default function TournamentPage() {
  return (
    <>
      <TournamentTool />
      <ToolJsonLd slug="tournament" description={DESCRIPTION} />
    </>
  );
}
