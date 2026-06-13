import type { Metadata } from "next";
import { SlideBgTool } from "./SlideBgTool";

const TOOL_NAME = "プレゼン背景メーカー";
const TITLE = "プレゼン背景メーカー｜スライド用の背景画像を無料作成 - ただただ";
const DESCRIPTION =
  "スライドに敷ける背景画像を原寸（16:9・4:3）で無料作成。グラデーション・ドット・波などの上品な背景をブラウザで作ってPNG保存。インストール不要、商用利用OK。パワーポイント・Googleスライド・Keynoteの背景に。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "プレゼン 背景",
    "スライド 背景 画像",
    "パワーポイント 背景 無料",
    "googleスライド 背景",
    "背景 ジェネレーター",
    "グラデーション 背景 作成",
    "プレゼン 背景 シンプル",
    "16:9 背景 画像",
    "背景画像 フリー 作成",
    "スライド おしゃれ 背景",
    "keynote 背景",
    "背景 png 作成",
  ],
  alternates: {
    canonical: "/tools/slide-bg",
  },
  openGraph: {
    url: "https://tadatada.net/tools/slide-bg",
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: [
      {
        url: "/assets/ogp-tools.jpg",
        width: 1200,
        height: 630,
        alt: `${TOOL_NAME} | ただただ`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/assets/ogp-tools.jpg"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: TOOL_NAME,
  url: "https://tadatada.net/tools/slide-bg",
  description: DESCRIPTION,
  applicationCategory: "DesignApplication",
  operatingSystem: "Web Browser",
  inLanguage: "ja",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "JPY",
  },
  provider: {
    "@type": "Organization",
    name: "ただただ",
    url: "https://tadatada.net",
  },
};

export default function SlideBgPage() {
  return (
    <>
      <SlideBgTool />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
