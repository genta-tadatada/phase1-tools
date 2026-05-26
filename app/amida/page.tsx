import type { Metadata } from "next";
import { AmidaTool } from "./AmidaTool";

export const metadata: Metadata = {
  title: "あみだくじ",
  description:
    "無料のあみだくじ作成ツール。参加者名と結果を入力してランダム生成。LINEやSNSにURLで共有できる。登録不要・広告最小限。2〜8人対応。",
  keywords: [
    "あみだくじ 無料 作成",
    "あみだくじ オンライン",
    "くじ引き アプリ",
    "あみだくじ LINE 共有",
    "当番決め くじ",
  ],
  openGraph: {
    title: "あみだくじ | タダtools",
    description: "URLで共有できるあみだくじ無料作成ツール。2〜8人対応",
    type: "website",
  },
};

export default function AmidaPage() {
  return <AmidaTool />;
}
