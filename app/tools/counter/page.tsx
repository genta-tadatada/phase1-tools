import type { Metadata } from "next";
import { CounterTool } from "./CounterTool";

const TOOL_NAME = "マルチカウンター";
const TITLE = "無料カウンターアプリ｜複数を同時に数える多機能カウンター - ただただ";
const DESCRIPTION =
  "複数のカウントを同時に管理できる無料カウンターアプリ。在庫数え・人数カウント・読書記録などに。インストール不要、スマホでもPCでもブラウザですぐ使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
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
  alternates: {
    canonical: "/tools/counter",
  },
  openGraph: {
    url: "https://tadatada.net/tools/counter",
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
  url: "https://tadatada.net/tools/counter",
  description: DESCRIPTION,
  applicationCategory: "UtilityApplication",
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

export default function CounterPage() {
  return (
    <>
      <CounterTool />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
