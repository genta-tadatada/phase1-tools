import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE_URL = "https://tadatada.net";

const TOOL_SLUGS = [
  "counter",
  "stopwatch",
  "timer",
  "bpm",
  "calculator",
  "word-count",
  "random-number",
  "dice",
  "roulette",
  "janken",
  "lot",
  "group",
  "amida",
  "tournament",
  "slide-bg",
  // "pomodoro" はリダイレクト専用ページのため sitemap から除外
];

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
    ...TOOL_SLUGS.map((slug) => ({
      url: `${BASE_URL}/tools/${slug}`,
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
