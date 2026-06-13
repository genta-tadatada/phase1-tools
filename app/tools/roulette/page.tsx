import type { Metadata } from "next";
import { RouletteTool } from "./RouletteTool";

const TOOL_NAME = "ルーレット";
const TITLE = "無料ルーレット｜項目を入れて回せる抽選ルーレット - ただただ";
const DESCRIPTION =
  "好きな項目を入れて回すだけの無料ルーレット。ランチ決め・順番決め・抽選に使えて盛り上がります。インストール不要でスマホからもPCからもすぐ使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["ルーレット", "くじ引き", "ランダム選択", "決める", "選択ツール"],
  alternates: {
    canonical: "/tools/roulette",
  },
  openGraph: {
    url: "https://tadatada.net/tools/roulette",
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
  url: "https://tadatada.net/tools/roulette",
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

export default function RoulettePage() {
  return (
    <>
      <RouletteTool />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
