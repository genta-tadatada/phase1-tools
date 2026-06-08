import type { Metadata } from "next";
import { TimerTool } from "./TimerTool";

export const metadata: Metadata = {
  title: "タイマー・ポモドーロタイマー | 無料・登録不要",
  description:
    "ブラウザですぐ使えるカウントダウンタイマー＆ポモドーロタイマー。1分・5分・25分などプリセットで即スタート。タブを閉じても正確に動作・通知対応・広告控えめ・完全無料。",
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
  openGraph: {
    title: "タイマー・ポモドーロタイマー | タダtools",
    description: "1分・5分・25分プリセット即スタート。ポモドーロ対応。タブを閉じても止まらない。",
    type: "website",
  },
};

export default function TimerPage() {
  return <TimerTool />;
}
