import type { Metadata } from "next";
import { WordCountTool } from "./WordCountTool";

export const metadata: Metadata = {
  title: "文字数カウンター",
  description:
    "テキストの文字数をリアルタイムにカウントする無料ツール。X・Instagram等のSNS文字数制限チェックにも対応。スペース除き・行数・単語数も即時表示。登録不要。",
  keywords: [
    "文字数カウント 無料",
    "文字数 カウンター オンライン",
    "ツイッター 文字数 確認",
    "X 文字数 カウント",
    "文字数 リアルタイム",
    "SNS 文字数 制限 確認",
  ],
  openGraph: {
    title: "文字数カウンター | タダtools",
    description: "リアルタイムに文字数をカウント。SNS制限チェックにも対応。",
    type: "website",
  },
};

export default function WordCountPage() {
  return <WordCountTool />;
}
