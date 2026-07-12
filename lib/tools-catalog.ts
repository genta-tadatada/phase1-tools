/**
 * ツールカタログ（公開ツールの単一情報源）
 *
 * slug / 表示名 / パス / アイコン / 1〜2文要約 / カテゴリ をここで一元管理する。
 * 参照元:
 *   - /tools ハブ（カード一覧・ツールガイド）: app/tools/page.tsx, app/tools/ToolsGuide.tsx
 *   - グローバルメニュー: components/shared/GlobalMenu.tsx
 *   - 構造化データ: components/tool-layout/ToolJsonLd.tsx
 *   - サイトマップ: app/sitemap.ts
 *
 * 新ツール公開時はここに1件追加する。
 * ※ "preset-bg"（一旦非公開・リダイレクト）と "pomodoro"（リダイレクト専用）は載せない。
 */

export type ToolCategoryId = "design" | "calc" | "text" | "play";

export interface ToolCategory {
  id: ToolCategoryId;
  name: string;
  anchor: string;
}

export interface CatalogTool {
  slug: string;
  name: string;
  path: string;
  icon: string;
  /** ハブページ・構造化データで使う1〜2文の要約（meta descriptionと矛盾させない） */
  summary: string;
  category: ToolCategoryId;
}

/** カテゴリ（/tools フィルタタブ・ツールガイド共通。名前も順序もフィルタタブに合わせる） */
export const TOOL_CATEGORIES: ToolCategory[] = [
  { id: "design", name: "デザイン",   anchor: "guide-design" },
  { id: "calc",   name: "計算・計測", anchor: "guide-calc" },
  { id: "text",   name: "テキスト",   anchor: "guide-text" },
  { id: "play",   name: "抽選",       anchor: "guide-play" },
];

/** 表示順 = /tools カード一覧・グローバルメニューの掲載順 */
export const TOOL_CATALOG: CatalogTool[] = [
  {
    slug: "slide-bg",
    name: "プレゼン背景メーカー",
    path: "/tools/slide-bg",
    icon: "/assets/icon-slide-bg.svg",
    summary:
      "プレゼン用の背景画像を原寸サイズで作れるメーカー。シンプル・かわいい・高級感の3テイストから選べます。",
    category: "design",
  },
  {
    slug: "counter",
    name: "マルチカウンター",
    path: "/tools/counter",
    icon: "/assets/icon-counter.png",
    summary:
      "複数のカウンターを並べて同時に数えられるweb数取り器。在庫数えや入場者カウントなど「数える作業」全般で使えます。",
    category: "calc",
  },
  {
    slug: "stopwatch",
    name: "多列ストップウォッチ",
    path: "/tools/stopwatch",
    icon: "/assets/icon-stopwatch.png",
    summary:
      "複数のタイムを同時に計測できるストップウォッチ。ラップ記録に対応し、部活のタイム測定や実験の記録に向いています。",
    category: "calc",
  },
  {
    slug: "timer",
    name: "タイマー",
    path: "/tools/timer",
    icon: "/assets/icon-timer.png",
    summary:
      "時間を指定してカウントダウンし、終了をアラームで知らせるタイマー。ポモドーロや全画面表示にも対応しています。",
    category: "calc",
  },
  {
    slug: "bpm",
    name: "BPMメトロノーム",
    path: "/tools/bpm",
    icon: "/assets/icon-bpm.png",
    summary:
      "テンポと拍子を設定してリズムを刻むメトロノーム。画面をタップして曲のBPMを計測することもできます。",
    category: "calc",
  },
  {
    slug: "calculator",
    name: "履歴付き電卓",
    path: "/tools/calculator",
    icon: "/assets/icon-calculator.png",
    summary:
      "計算履歴が残るweb電卓。税込・割引の計算や関数にも対応し、あとから式を見直せます。",
    category: "calc",
  },
  {
    slug: "word-count",
    name: "文字数カウント",
    path: "/tools/word-count",
    icon: "/assets/icon-word-count.png",
    summary:
      "文章の文字数・行数をその場で集計。字数制限までの残りがバーで見え、原稿用紙換算にも対応しています。",
    category: "text",
  },
  {
    slug: "random-number",
    name: "ランダム数字",
    path: "/tools/random-number",
    icon: "/assets/icon-random-number.png",
    summary:
      "範囲と個数を指定してランダムな数字を生成。重複なしの設定ができ、ビンゴや抽選で使えます。",
    category: "play",
  },
  {
    slug: "dice",
    name: "サイコロ",
    path: "/tools/dice",
    icon: "/assets/icon-dice.png",
    summary:
      "最大10個まで同時に振れるサイコロ。多面ダイスにも対応し、ボードゲームやTRPGで活躍します。",
    category: "play",
  },
  {
    slug: "roulette",
    name: "ルーレット",
    path: "/tools/roulette",
    icon: "/assets/icon-roulette.png",
    summary:
      "好きな項目を入れて回すだけの抽選ルーレット。ランチ決めや順番決めがその場で盛り上がります。",
    category: "play",
  },
  {
    slug: "janken",
    name: "じゃんけん",
    path: "/tools/janken",
    icon: "/assets/icon-janken.png",
    summary:
      "CPU相手のひとり勝負から、大人数でまとめて勝敗を決めるモードまで備えたじゃんけん。順番決めや担当決めにどうぞ。",
    category: "play",
  },
  {
    slug: "lot",
    name: "くじ引き",
    path: "/tools/lot",
    icon: "/assets/icon-lot.png",
    summary:
      "あたりの本数を設定して引けるくじ引き。当番決めやイベントの抽選を公平に行えます。",
    category: "play",
  },
  {
    slug: "group",
    name: "グループ分け",
    path: "/tools/group",
    icon: "/assets/icon-group.png",
    summary:
      "名前を入れるとランダムに班分けするツール。グループ数でも、1グループあたりの人数でも指定できます。",
    category: "play",
  },
  {
    slug: "amida",
    name: "あみだくじ",
    path: "/tools/amida",
    icon: "/assets/icon-amida.png",
    summary:
      "名前を入れるだけで自動生成されるあみだくじ。線をたどる演出付きで、1人ずつ結果を発表できます。",
    category: "play",
  },
  {
    slug: "tournament",
    name: "トーナメント表",
    path: "/tools/tournament",
    icon: "/assets/icon-tournament.png",
    summary:
      "参加者を入力するとトーナメント表を自動作成。勝者を選んで対戦を進められ、3位決定戦にも対応しています。",
    category: "play",
  },
];

export function getToolBySlug(slug: string): CatalogTool | undefined {
  return TOOL_CATALOG.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: ToolCategoryId): CatalogTool[] {
  return TOOL_CATALOG.filter((t) => t.category === category);
}
