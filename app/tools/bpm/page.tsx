import type { Metadata } from "next";
import { BpmTool } from "./BpmTool";

export const metadata: Metadata = {
  title: "メトロノーム | タダtools",
  description:
    "無料のオンラインメトロノーム。BPM設定・タップテンポ精度±1BPM・拍子設定対応。演奏中は広告非表示・ログイン不要。音楽練習・合唱・ダンス振付・吹奏楽・ピアノ練習のテンポ確認に。ダークモード対応。",
  keywords: [
    "メトロノーム 無料",
    "オンライン メトロノーム",
    "メトロノーム 広告なし",
    "BPM 測定 タップ",
    "Tap Tempo",
    "タップテンポ 精度",
    "練習 テンポ",
    "拍子 設定",
  ],
};

export default function BpmPage() {
  return <BpmTool />;
}
