import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "全ツール一覧 | ただただ",
  description:
    "広告控えめ・登録不要で今すぐ使えるシンプルツール集。カウンター・タイマー・BPMメトロノーム・あみだくじ・電卓など15種類以上。",
  alternates: { canonical: "https://tadatada.net/tools" },
  openGraph: {
    url: "https://tadatada.net/tools",
    title: "全ツール一覧 | ただただ",
    description: "広告控えめ・登録不要で今すぐ使えるシンプルツール集。",
    type: "website",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
