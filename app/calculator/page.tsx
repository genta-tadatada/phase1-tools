import type { Metadata } from "next";
import { CalculatorTool } from "./CalculatorTool";

export const metadata: Metadata = {
  title: "履歴付き電卓 | 無料・登録不要",
  description:
    "計算履歴が見える・1桁ずつ消せる・税込/割引ボタン付きのブラウザ電卓。iPhone純正電卓の不満を解消。登録不要・広告控えめ・無料。",
  keywords: [
    "電卓 ブラウザ 無料",
    "電卓 履歴 オンライン",
    "計算機 履歴付き",
    "電卓 1文字消す",
    "税込 計算 ツール",
    "割引 計算 電卓",
    "電卓 web シンプル",
  ],
  openGraph: {
    title: "履歴付き電卓 | タダtools",
    description: "履歴が見える・税込/割引ボタン付き。ページを開いたら即叩ける。",
    type: "website",
  },
};

export default function CalculatorPage() {
  return <CalculatorTool />;
}
