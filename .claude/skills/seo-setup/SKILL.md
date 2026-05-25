---
name: seo-setup
description: >
  Phase1ツールのSEOメタタグ・sitemap・robots.txtを設定する。
  ページのURLとツール説明を受け取り、このプロジェクト固有のSEO設定を生成する。
trigger: /seo-setup
---

# /seo-setup SEOセットアップスキル

## いつ使うか

新しいツールページのSEO設定をまとめて行うとき。
`/seo-setup` を実行すると対象ページのメタタグ・共通SEOファイルを整備する。

## このプロジェクトのSEO方針

- **ツール名** より **悩み・状況クエリ** をdescriptionに優先する
- description: 50〜120文字（Googleの表示範囲）
- title: `[ツール名] | ただただツール`（layout.tsxのtemplateで自動補完）
- OGP画像は現時点では設定しない（Phase1完成後に一括対応）

## 実行手順

### Step 1: 対象ページの確認

引数からページのslugを取得する。引数がなければ確認する。
該当の `app/[slug]/page.tsx` を読み込む。

### Step 2: metadata を生成・更新

以下の形式で metadata を生成する:

```typescript
export const metadata: Metadata = {
  title: "[ツール名]",
  description: "[悩み・状況を含む50〜120文字の説明]",
  keywords: [
    "[ツール名]",
    "[使用場面1]",
    "[使用場面2]",
    // ターゲットユーザーが検索しそうなキーワード5〜10個
  ],
  openGraph: {
    title: "[ツール名] | ただただツール",
    description: "[descriptionと同じ or 短縮版]",
    type: "website",
    url: "https://tadatada-tool.jp/[slug]",
  },
};
```

### Step 3: sitemap.ts の確認・更新

`app/sitemap.ts` が存在するか確認する。

存在しない場合は新規作成:

```typescript
import type { MetadataRoute } from "next";

const BASE_URL = "https://tadatada-tool.jp";

const TOOL_SLUGS = [
  "counter",
  // 追加されたツールのslugをここに列挙
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    ...TOOL_SLUGS.map((slug) => ({
      url: `${BASE_URL}/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
```

存在する場合は `TOOL_SLUGS` 配列に今回のslugを追加する。

### Step 4: robots.ts の確認・作成

`app/robots.ts` が存在しない場合のみ作成する:

```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://tadatada-tool.jp/sitemap.xml",
  };
}
```

### Step 5: layout.tsx の title template 確認

`app/layout.tsx` の metadata に `template` が設定されているか確認する:

```typescript
export const metadata: Metadata = {
  title: {
    default: "ただただツール",
    template: "%s | ただただツール",
  },
  description: "シンプルで使いやすい無料Webツール集",
};
```

設定されていなければ追加する。

### Step 6: 完了報告

更新・作成したファイルと、descriptionの文字数を報告する。

## 注意事項

- ドメインは現在 `phase1-tools.pages.dev` だが、ファイル内は `tadatada-tool.jp` で記述する（取得後に一括変更しやすくするため）
- sitemap.xml と robots.txt は `output: 'export'` の静的ビルドでも自動生成される（Next.js 16対応済み）
- OGP画像（og:image）は設定しない（Phase1完成後に一括対応）
