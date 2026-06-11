import type { Metadata } from "next";
import { TimerTool } from "./TimerTool";

const TOOL_NAME = "タイマー";
const TITLE = "無料タイマー｜ポモドーロ対応のシンプルタイマー - ただただ";
const DESCRIPTION =
  "作業や勉強に集中できる無料タイマー。ポモドーロ・テクニックにも対応し、25分集中＋休憩のサイクルを自動管理。インストール不要でスマホからもすぐ使えます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "タイマー オンライン 無料",
    "カウントダウンタイマー ブラウザ",
    "ポモドーロタイマー 無料",
    "キッチンタイマー web",
    "5分タイマー",
    "25分タイマー",
    "勉強 タイマー ブラウザ",
    "集中 タイマー 無料",
  ],
  alternates: {
    canonical: "/tools/timer",
  },
  openGraph: {
    url: "https://tadatada.net/tools/timer",
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: [
      {
        url: "/assets/icon-timer.png",
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
  url: "https://tadatada.net/tools/timer",
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

export default function TimerPage() {
  return (
    <>
      <TimerTool />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
