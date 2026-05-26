import type { Metadata } from "next";
import { GroupTool } from "./GroupTool";

export const metadata: Metadata = {
  title: "グループ分け",
  description:
    "メンバーをランダムにグループ分けする無料ツール。グループ数・1グループの人数を指定できる。教員・研修・部活動に。URLで結果を共有可能。登録不要。",
  keywords: [
    "グループ分け アプリ 無料",
    "ランダム グループ",
    "チーム 分け ランダム",
    "班分け ツール",
    "グループ分け 学校 無料",
  ],
  openGraph: {
    title: "グループ分け | タダtools",
    description: "ランダムグループ分け無料ツール。URLで結果を共有。",
    type: "website",
  },
};

export default function GroupPage() {
  return <GroupTool />;
}
