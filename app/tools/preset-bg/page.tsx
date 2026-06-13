import type { Metadata } from "next";
import { PresetBgTool } from "./PresetBgTool";

const TOOL_NAME = "プリセット背景ギャラリー";
const TITLE = "プレゼン背景テンプレート｜用途で選ぶだけのスライド背景 無料 - ただただ";
const DESCRIPTION =
  "ビジネス・学校発表・和風など用途を選ぶだけで、プロ品質のスライド背景がすぐ手に入る無料テンプレート集。各背景に合うパワーポイント標準フォントも提案。PNG・PowerPoint形式で保存、インストール不要・商用利用OK。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "プレゼン 背景 テンプレート",
    "スライド 背景 おしゃれ",
    "パワーポイント 背景 テンプレート 無料",
    "プレゼン 背景 ビジネス",
    "スライド 背景 シンプル",
    "和風 背景 スライド",
    "googleスライド 背景 テンプレート",
    "プレゼン テンプレート 無料",
    "背景 テンプレート ダウンロード",
    "パワポ 背景 かわいい",
    "スライド フォント おすすめ",
    "keynote 背景 テンプレート",
  ],
  alternates: {
    canonical: "/tools/preset-bg",
  },
  openGraph: {
    url: "https://tadatada.net/tools/preset-bg",
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
  url: "https://tadatada.net/tools/preset-bg",
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

export default function PresetBgPage() {
  return (
    <>
      <PresetBgTool />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
