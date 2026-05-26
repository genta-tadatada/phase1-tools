import type { Metadata } from "next";
import { RouletteTool } from "./RouletteTool";

export const metadata: Metadata = {
  title: "ルーレット",
  description:
    "選択肢を入力してルーレットを回すだけ。何でも決められる無料Webツール。登録不要・広告最小限。",
  keywords: ["ルーレット", "くじ引き", "ランダム選択", "決める", "選択ツール"],
  openGraph: {
    title: "ルーレット | タダtools",
    description: "選択肢を入力してルーレットを回すだけ",
    type: "website",
  },
};

export default function RoulettePage() {
  return <RouletteTool />;
}
