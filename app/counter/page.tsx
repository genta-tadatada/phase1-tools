import type { Metadata } from "next";
import { CounterTool } from "./CounterTool";

export const metadata: Metadata = {
  title: "マルチカウンター",
  description:
    "複数の項目を同時にカウントできる無料Webツール。登録不要・広告最小限。審査員の点数カウント・在庫確認・筋トレセット数・研究観察に。ダークモード・URLシェア・履歴記録対応。",
  keywords: [
    "マルチカウンター",
    "多列カウンター",
    "複数カウンター",
    "ブラウザ カウンター",
    "数取器 web",
    "合唱コンクール 点数 数える",
    "審査員 点数 カウント",
    "筋トレ セット数 カウント",
    "在庫確認 カウンター",
    "イベント 入場者数 カウント",
    "カウンター 共有 URL",
    "カウンター ダークモード",
  ],
  openGraph: {
    title: "マルチカウンター | タダtools",
    description: "複数の項目を同時にカウントできる無料Webツール",
    type: "website",
  },
};

export default function CounterPage() {
  return <CounterTool />;
}
