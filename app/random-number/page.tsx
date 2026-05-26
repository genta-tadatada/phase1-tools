import type { Metadata } from "next";
import { RandomNumberTool } from "./RandomNumberTool";

export const metadata: Metadata = {
  title: "ランダム数字ジェネレーター | タダtools",
  description:
    "指定した範囲から好きな個数のランダムな数字を生成。くじ引きの番号作成・当番決め・ゲームに。重複なし対応・履歴保存・無料・ログイン不要。",
  keywords: [
    "ランダム 数字 生成",
    "乱数 ジェネレーター",
    "くじ番号 作成",
    "ランダム 当番決め",
    "無作為 数字",
  ],
};

export default function RandomNumberPage() {
  return <RandomNumberTool />;
}
