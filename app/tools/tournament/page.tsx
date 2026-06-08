import type { Metadata } from "next";
import { TournamentTool } from "./TournamentTool";

export const metadata: Metadata = {
  title: "トーナメント表作成",
  description:
    "無料でトーナメント表を作成・共有。登録不要でURLをシェアできる。4〜32人対応・ランダム抽選・印刷対応。部活・社内大会・ゲーム大会に。",
  keywords: [
    "トーナメント表 無料 作成",
    "組み合わせ 抽選",
    "対戦表 ランダム",
    "登録不要 トーナメント",
    "ブラケット 無料",
  ],
  openGraph: {
    title: "トーナメント表作成 | タダtools",
    description: "4〜32人対応・URLシェア・印刷対応の無料トーナメント表作成ツール",
    type: "website",
  },
};

export default function TournamentPage() {
  return <TournamentTool />;
}
