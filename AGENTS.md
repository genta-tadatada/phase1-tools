<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:model-usage-rules -->
# Model selection policy

Use **Opus** when:
- Starting a new tool (read spec → decide implementation approach)
- A UI/UX decision has multiple valid options and quality matters
- Debugging a non-obvious bug (hypothesis generation)
- Any task where the cost of a wrong decision exceeds the cost of Opus

Use **Sonnet** (default) for everything else:
- Routine implementation following a clear spec
- File edits, refactoring, formatting
- Build/test commands

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

## 自動拒否（説明なしに停止・チャットで報告）
以下は settings.json の deny に入っており実行不可。実行しようとした場合はチャットで理由を報告する:
- `git push --force` / `git reset --hard` ─ 履歴の破壊的書き換え
- `rm -rf /` ─ システム破壊
- `*gentaai*` ─ プロジェクト分離ルール違反
<!-- END:command-execution-policy -->
