import type { Metadata } from "next";
import { AmidaTool } from "./AmidaTool";

const TOOL_NAME = "あみだくじ";
const TITLE = "無料あみだくじ｜名前を入れて作れるオンラインあみだ - ただただ";
const DESCRIPTION =
  "紙がなくても作れる無料のオンラインあみだくじ。名前と結果を入れるだけで線を自動生成し、順番決めや係決めに。インストール不要でスマホからもすぐ使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "あみだくじ 無料 作成",
    "あみだくじ オンライン",
    "くじ引き アプリ",
    "あみだくじ LINE 共有",
    "当番決め くじ",
  ],
  alternates: {
    canonical: "/tools/amida",
  },
  openGraph: {
    url: "https://tadatada.net/tools/amida",
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: [
      {
        url: "/assets/icon-amida.png",
        width: 512,
        height: 512,
        alt: `${TOOL_NAME} | ただただ`,
      },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: TOOL_NAME,
  url: "https://tadatada.net/tools/amida",
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

export default function AmidaPage() {
  return (
    <>
      <AmidaTool />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
