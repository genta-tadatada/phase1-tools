import type { Metadata } from "next";
import { GroupTool } from "./GroupTool";

const TOOL_NAME = "グループ分け";
const TITLE = "無料グループ分け｜名前を入れて自動でチーム分け - ただただ";
const DESCRIPTION =
  "メンバーの名前を入れるだけで自動的にグループ分けできる無料ツール。班分け・チーム分け・席替えに便利。インストール不要でスマホからもすぐ使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "グループ分け アプリ 無料",
    "ランダム グループ",
    "チーム 分け ランダム",
    "班分け ツール",
    "グループ分け 学校 無料",
  ],
  alternates: {
    canonical: "/tools/group",
  },
  openGraph: {
    url: "https://tadatada.net/tools/group",
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
  url: "https://tadatada.net/tools/group",
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

export default function GroupPage() {
  return (
    <>
      <GroupTool />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
