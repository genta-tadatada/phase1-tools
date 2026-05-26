import type { Metadata } from "next";
import { LotTool } from "./LotTool";

export const metadata: Metadata = {
  title: "くじ引き",
  description:
    "無料のオンラインくじ引きツール。当たり・はずれなどのカスタムくじや数字くじに対応。スクラッチ演出・封筒開封演出付き。登録不要・URLで設定を共有できる。",
  keywords: [
    "くじ引き 無料 オンライン",
    "ガチャ アプリ 無料",
    "抽選 ツール 無料",
    "当たり はずれ くじ",
    "景品 抽選 アプリ",
  ],
  openGraph: {
    title: "くじ引き | タダtools",
    description: "カスタムくじ・数字くじ・スクラッチ演出付き無料くじ引きツール",
    type: "website",
  },
};

export default function LotPage() {
  return <LotTool />;
}
