---
name: new-tool
description: >
  Phase1の新しいツールページをスキャフォールドする。
  ToolLayoutを使った標準構造のTSXファイルを生成し、
  HamburgerMenuのツール一覧に追加する。
trigger: /new-tool
---

# /new-tool スキャフォールドスキル

## いつ使うか

新しいツールページを作り始めるとき。`/new-tool` を実行すると標準構造のファイルが生成される。

## 実行手順

### Step 1: 引数の解析

ユーザーが `/new-tool [ツール名]` と入力した場合、引数からツール情報を取得する。
引数がない場合は以下を確認する:

> どのツールを作りますか？
> - ツール名（日本語）: 例「BPMメトロノーム」
> - URLスラッグ（英語）: 例「bpm」

### Step 2: 仕様書の確認

`C:\MY SSD\webdev\.secretary\design\` に `[slug]-spec.md` が存在するか確認する。
存在する場合は読み込んで実装の参考にする。

### Step 3: ページファイルの生成

`app/[slug]/page.tsx` を以下のテンプレートで生成する:

```typescript
import type { Metadata } from "next";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";

export const metadata: Metadata = {
  title: "[ツール名]",
  description: "[ツールの説明。仕様書のSEO仕様から取得]",
};

export default function [PascalCaseName]Page() {
  return (
    <ToolLayout title="[ツール名]">
      {/* TODO: ツール本体を実装 */}
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        実装中...
      </div>
    </ToolLayout>
  );
}
```

### Step 4: HamburgerMenu への追加

`components/tool-layout/HamburgerMenu.tsx` の `TOOLS` 配列に追加する:

```typescript
{ name: "[ツール名]", href: "/[slug]", description: "[1行説明]" },
```

### Step 5: 完了報告

生成・変更したファイルを列挙して報告する。
仕様書が見つかった場合は「次のステップ: 仕様書の[セクション名]に従って実装を開始」と案内する。

## 注意事項

- `app/[slug]/` ディレクトリが既に存在する場合は上書きしない（確認を取る）
- HamburgerMenu の TOOLS 配列の順序は仕様書の実装順位に合わせる
- metadata の description は50〜120文字で検索クエリを意識した文章にする
