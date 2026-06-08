import type { Metadata } from "next";
import { JankenTool } from "./JankenTool";

export const metadata: Metadata = {
  title: "じゃんけん | タダtools",
  description:
    "スマホで遊べる無料じゃんけんアプリ。1人対CPU・2〜6人の多人数対戦に対応。登録不要・広告最小限。カウントダウン演出でリアルなじゃんけん体験。",
  keywords: [
    "じゃんけん アプリ 無料",
    "オンライン じゃんけん",
    "多人数 じゃんけん",
    "ランダム じゃんけん",
    "じゃんけん 決定",
  ],
};

export default function JankenPage() {
  return <JankenTool />;
}
