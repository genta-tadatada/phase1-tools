import { getToolBySlug } from "@/lib/tools-catalog";

const BASE_URL = "https://tadatada.net";

export interface ToolFaqItem {
  q: string;
  a: string;
}

interface ToolJsonLdProps {
  slug: string;
  /** 各ページの meta description と同文を渡す */
  description: string;
  /** ツール固有FAQ。渡された時だけ FAQPage を出力する（中身の執筆は別タスク） */
  faq?: ToolFaqItem[];
}

/**
 * ツールページ用の構造化データ（JSON-LD）。
 * 全ツール共通で WebApplication + BreadcrumbList を出力し、
 * faq が渡された場合のみ FAQPage を追加する（AI検索/LLMO対策）。
 * 静的エクスポート前提のサーバーコンポーネント（インライン出力）。
 */
export function ToolJsonLd({ slug, description, faq }: ToolJsonLdProps) {
  const tool = getToolBySlug(slug);
  if (!tool) return null;

  const url = `${BASE_URL}${tool.path}`;

  const webApplication = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    url,
    description,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    inLanguage: "ja",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
    },
    provider: {
      "@type": "Organization",
      name: "ただただ",
      url: BASE_URL,
    },
  };

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ただただ", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "タダtools", item: `${BASE_URL}/tools` },
      { "@type": "ListItem", position: 3, name: tool.name, item: url },
    ],
  };

  const jsonLd: object[] = [webApplication, breadcrumbList];

  if (faq && faq.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
