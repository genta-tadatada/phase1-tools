<!-- BEGIN:quality-reference -->
# 品質基準と実装クイックリファレンス

## 品質フロア（これを下回らない）

| 基準 | 参照ファイル | 確認ポイント |
|-----|-----------|------------|
| UI・状態管理・全体品質 | `app/counter/CounterTool.tsx` | 最完成度。新ツールの品質最低ライン |
| アニメーション・ビジュアル | `app/amida/AmidaTool.tsx` | kawaii系アニメのベスト |

**新ツール実装前・実装後に必ず目視確認する。「CounterToolと同じクオリティか？」を自問する。**

## 実装時に参照するファイル（絶対パス）

| 用途 | ファイル |
|-----|---------|
| デザインシステム（色・フォント・余白） | `C:\MY SSD\webdev\.secretary\design\design-system.md` |
| Phase1テーマ・ブランドカラー | `C:\MY SSD\webdev\.secretary\design\phase1-theme.md` |
| 素材カタログ（使える素材の逆引き） | `C:\MY SSD\webdev\.secretary\design\asset-catalog.md` |
| 既存コンポーネント一覧 | `C:\MY SSD\webdev\.secretary\design\phase1-components.md` |
| ツール仕様書 | `C:\MY SSD\webdev\.secretary\design\{tool-slug}-spec.md` |

## 素材の使い方（生成前に在庫確認）

`public/assets/icon-{tool}.png` — 14ツール分のアイコン。新ツールのヒーローに使う。
`public/uploads/kawaii-blob-{pink/lavender/mint/blue}.svg` — ヒーロー背景装飾。`opacity-20`で使う。
`public/uploads/kawaii-dots-*.svg` — サブ背景パターン。
70本超のSVGあり。**画像生成を依頼する前に `asset-catalog.md` を確認する。**

## モバイル確認

実装完了の判定は**375px幅で確認してから**。PCで綺麗でもスマホが崩れていれば未完成。
<!-- END:quality-reference -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:model-usage-rules -->
# Model selection policy

Decide in one question: **"Is there a decision to make, or just work to execute?"**

- **A decision to make** (which approach? is this design good? why is this bug happening?) → **Opus**
- **Work to execute** (a clear spec/instruction already says what to do) → **Sonnet**

### Sonnet is enough for (don't reach for Opus):
- Implementing a tool that already has a `{tool}-spec.md` to follow
- File edits, refactoring, renaming, formatting
- Build / type-check / test commands and fixing the errors they report
- Applying a fix whose cause is already understood
- SEO meta, sitemap, copy tweaks following an existing pattern

### Switch up to Opus when:
- Starting a new tool with no spec, or the spec leaves the approach open
- A UI/UX choice has multiple valid options and quality matters
- Debugging a non-obvious bug (need hypothesis generation)
- The cost of a wrong decision exceeds the cost of Opus

If you started on Sonnet and hit a real decision point, stop and `/model opus` rather than guessing.

Switch with: `/model opus` or `/model sonnet`
<!-- END:model-usage-rules -->

<!-- BEGIN:visual-change-rules -->
# ビジュアル変更ルール

## push前の必須確認

1. **`next build` をローカル実行**（必須。`tsc --noEmit` だけでは不十分）
   - Server Component へのイベントハンドラ等、Next.js固有のエラーは `next build` でしか検出されない
   - Cloudflare は build 失敗時に最後の成功ビルドを維持する → push しても反映されない

2. `tsc --noEmit` で型エラー確認

## デフォルトビジュアル方針

- **新規ページ・コンポーネントはポータル寄りのビジュアルをデフォルトとする**
  - フォント: M PLUS Rounded 1c（見出し）・Quicksand（英数ラベル）
  - カラーパレット: portal.css の変数（ピンク/ラベンダー/ミント系）
  - 例外は依頼時に明示する（例：「シンプルなツールUIで」）
- **ツール本体の機能エリア**（入力・表示・ボタン）は引き続きシンプル・ミニマル
- **ヘッダー・フッター・ナビ・カード**はポータルスタイルで統一

## ブランド保護要素【変更禁止】

コード変更時に以下の要素を絶対に壊さない。
レイアウト・位置の変更作業中であっても、これらを含む HTML は Edit で最小変更にとどめる。

| 要素 | 現在の仕様 |
|------|-----------|
| `タダtools.` のカラー | タダ=`#1f1d2b` / tools=`#0ea5e9`(青) / `.`=`#f9a8d4`(ピンク) |
| サービスカードの色対応 | tools=ミント / 一問一答=ラベンダー / games=ピンク |
| TADATADA ブランドドット | `#f9a8d4`（ピンク丸） |
| TADATADA ロゴ | 現在は仮。将来ロゴ確定後に固定 |

詳細は `.secretary/design/phase1-theme.md` の「ブランド保護要素」セクション参照。
<!-- END:visual-change-rules -->

<!-- BEGIN:command-execution-policy -->
# コマンド実行ポリシー

## 基本方針
commandのプロンプト（ツール許可ダイアログ）は出さない。
リスクがある場合は**チャットで先に説明**してから実行する。

## 自動実行（説明不要・即実行）
- ファイル読み書き・編集・削除（`C:\MY SSD\webdev\` 配下）
- git add / commit / push（通常のmainへのpush）
- npm / npx / node の実行
- ビルド・型チェック・テスト
- PowerShell・Bash 一般操作

## チャットで事前説明が必要（1〜2行で何をするか・なぜリスクかを伝えてから実行）
- `settings.json` / `CLAUDE.md` / `AGENTS.md` の変更
- `package.json` の dependencies 追加・削除・バージョン変更
- 外部APIへのデータ初回送信（エンドポイント設定確認）
- `.env` や APIキーを含むファイルの操作
- `C:\MY SSD\webdev\` 配下**以外**のファイル編集
- `npm run dev` ─ 長時間プロセスのためセッションが詰まる。用途を伝えてから起動

## 自動拒否（説明なしに停止・チャットで報告）
以下は settings.json の deny に入っており実行不可。実行しようとした場合はチャットで理由を報告する:
- `git push --force` / `git reset --hard` ─ 履歴の破壊的書き換え
- `rm -rf /` ─ システム破壊
- `*gentaai*` ─ プロジェクト分離ルール違反
<!-- END:command-execution-policy -->
