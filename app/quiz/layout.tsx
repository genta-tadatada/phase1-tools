import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ただただ一問一答｜スキマ時間にサクッと解ける、一問一答集。- ただただ",
  description: "完全無料の一問一答クイズ集。スキマ時間にサクッと解ける。広告控えめ・ログイン不要。",
  openGraph: {
    title: "ただただ一問一答｜スキマ時間にサクッと解ける、一問一答集。- ただただ",
    description: "完全無料の一問一答クイズ集。スキマ時間にサクッと解ける。広告控えめ・ログイン不要。",
    url: "https://tadatada.net/quiz",
    siteName: "ただただ",
    locale: "ja_JP",
    type: "website",
    images: [{ url: "/assets/ogp-quiz.jpg", width: 1200, height: 630, alt: "ただただ一問一答." }],
  },
  twitter: { card: "summary_large_image", images: ["/assets/ogp-quiz.jpg"] },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
