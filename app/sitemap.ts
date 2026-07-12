import type { MetadataRoute } from "next";
import { TOOL_CATALOG } from "@/lib/tools-catalog";
import { NEWS_DATA } from "@/lib/news-data";

export const dynamic = "force-static";

const BASE_URL = "https://tadatada.net";

// 公開ツール一覧は lib/tools-catalog.ts が単一情報源
// "preset-bg" は完成度が低いため一旦非公開（リダイレクト）。再公開時にカタログへ戻す
// "pomodoro" はリダイレクト専用ページのため sitemap から除外

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date("2026-06-08"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/tools`,
      lastModified: new Date("2026-06-08"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...TOOL_CATALOG.map((tool) => ({
      url: `${BASE_URL}${tool.path}`,
      lastModified: new Date("2026-06-08"),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${BASE_URL}/quiz`,
      lastModified: new Date("2026-06-12"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/games`,
      lastModified: new Date("2026-06-12"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/news`,
      lastModified: new Date("2026-06-12"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...NEWS_DATA.map((item) => ({
      url: `${BASE_URL}/news/${item.id}`,
      lastModified: new Date(item.date),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date("2026-06-09"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date("2026-06-12"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
