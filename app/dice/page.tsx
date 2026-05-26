import type { Metadata } from "next";
import { DiceTool } from "./DiceTool";

export const metadata: Metadata = {
  title: "サイコロ・ルーレット | タダtools",
  description:
    "オンラインのサイコロ（D4〜D20対応）とルーレット。ボードゲーム・TRPG・当番決め・何食べるか決めるのに。ログイン不要・広告控えめ・ダークモード対応。",
  keywords: [
    "サイコロ アプリ 無料",
    "オンライン サイコロ",
    "ルーレット 作成 無料",
    "D6 ランダム",
    "ボードゲーム サイコロ",
    "当番決め ルーレット",
  ],
};

export default function DicePage() {
  return <DiceTool />;
}
