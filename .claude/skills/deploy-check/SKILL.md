---
name: deploy-check
description: >
  デプロイ前チェックリストを自動実行する。
  ビルド確認・TypeScript・SEOメタタグ・広告ルールを検査し、
  問題があれば修正箇所を報告する。
trigger: /deploy-check
---

# /deploy-check デプロイ前チェックスキル

## いつ使うか

GitHub へ push してCloudflare に公開する前。ツールが完成したタイミングで実行する。

## 実行手順

### Step 1: ビルド確認

```bash
npm run build
```

- ✅ 成功 → 次のステップへ
- ❌ 失敗 → エラーを表示して停止。修正を促す

### Step 2: TypeScript 型チェック

```bash
npx tsc --noEmit
```

- エラーがあれば行番号・内容を列挙する

### Step 3: ページ一覧とSEOメタタグ確認

`app/` 配下のすべての `page.tsx` を読み込み、以下を確認する:

| 項目 | 基準 |
|-----|------|
| `metadata.title` | 設定されているか |
| `metadata.description` | 50文字以上120文字以下か |
| `metadata.keywords` | 設定されているか（警告のみ） |
| `<ToolLayout title>` | metadata.title と一致するか |

### Step 4: 広告ルール確認

各ページの JSX を確認し、以下の禁止パターンがないか検査する:

- ツール動作中に `adVisible={false}` が渡されているか（BPM等の再生系ツール）
- ボタンの近くに広告要素がないか（`AdBanner` は `ToolLayout` 経由のみ許可）

### Step 5: チェックリスト報告

```
=== デプロイ前チェック結果 ===

✅ ビルド: 成功
✅ TypeScript: エラーなし
⚠️ SEO: /bpm の description が短い（現在: 30文字）
✅ 広告ルール: 問題なし

対応が必要: 1件
└ /bpm/page.tsx の description を50文字以上にする
```

### Step 6: 全項目パスの場合

```
すべてのチェックをパスしました。
git push して Cloudflare の自動ビルドを確認してください。
```

## 注意事項

- `npm run build` はローカルで実行するためNode.js環境が必要
- Lighthouse スコアはブラウザが必要なため自動チェック対象外（手動確認を促す）
- このスキルはチェックのみ。ファイルの自動修正は行わない
