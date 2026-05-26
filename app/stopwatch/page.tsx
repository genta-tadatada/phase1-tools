import type { Metadata } from "next";
import { StopwatchTool } from "./StopwatchTool";

export const metadata: Metadata = {
  title: "多列ストップウォッチ",
  description:
    "複数のストップウォッチを同時に動かせる無料ツール。最大5個・一斉スタート/ストップ・ラップ記録・CSVエクスポート対応。部活動のタイム計測・研究・スポーツ指導に。",
  keywords: [
    "ストップウォッチ 無料 オンライン",
    "マルチ ストップウォッチ",
    "ラップ タイム 計測",
    "部活 タイム計測",
    "複数 ストップウォッチ 同時",
  ],
  openGraph: {
    title: "多列ストップウォッチ | タダtools",
    description:
      "最大5個のストップウォッチを同時起動。ラップ記録・CSVエクスポート対応。",
    type: "website",
  },
};

export default function StopwatchPage() {
  return <StopwatchTool />;
}
