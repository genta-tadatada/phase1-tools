import type { Metadata } from "next";
import { GroupTool } from "./GroupTool";
import { ToolJsonLd } from "@/components/tool-layout/ToolJsonLd";

const TOOL_NAME = "グループ分け";
const TITLE = "班分け・チーム分け｜無料で名前を入れて自動グループ分け - ただただ";
const DESCRIPTION =
  "無料のwebグループ分け。広告控えめ・ログイン不要で、グループ数か1グループあたりの人数でランダムに振り分け。班決め・席替え・チーム編成などに使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "グループ分け アプリ 無料",
    "ランダム グループ",
    "チーム 分け ランダム",
    "班分け ツール",
    "グループ分け 学校 無料",
  ],
  alternates: {
    canonical: "/tools/group",
  },
  openGraph: {
    url: "https://tadatada.net/tools/group",
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

export default function GroupPage() {
  return (
    <>
      <GroupTool />
      <ToolJsonLd slug="group" description={DESCRIPTION} />
    </>
  );
}
