import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "タダtools｜日常で使える無料Webツール集 - ただただ",
  description:
    "完全無料のWebツール集。広告控えめ・ログイン不要で、いますぐ使える。",
  alternates: { canonical: "https://tadatada.net/tools" },
  openGraph: {
    url: "https://tadatada.net/tools",
    title: "タダtools｜日常で使える無料Webツール集 - ただただ",
    description: "完全無料のWebツール集。広告控えめ・ログイン不要で、いますぐ使える。",
    type: "website",
    images: [{ url: "/assets/ogp-tools.jpg", width: 1200, height: 630, alt: "タダtools." }],
  },
  twitter: { card: "summary_large_image", images: ["/assets/ogp-tools.jpg"] },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
