/**
 * preset-bg（プリセット背景ギャラリー）専用データ（3色対応リデザイン版）。
 * style/font は slideEngine の値を流用。各プリセットは base/c1/c2 の3色＋styleで完成済み。
 */

import type { Style } from "./slideEngine";

export type CategoryKey =
  | "business" | "school" | "simple" | "cute" | "stylish"
  | "japanese" | "natural" | "pop" | "elegant" | "tech";

export interface Category {
  key: CategoryKey;
  label: string;
  desc: string;
}

export interface Preset {
  id: string;
  name: string;
  category: CategoryKey;
  style: Style;
  base: string;   // 下地
  c1: string;     // 主役色
  c2: string;     // 差し色・ハイライト
  intensity: number;
  dark: boolean;
  font: string;
}

export const CATEGORIES: Category[] = [
  { key: "business",  label: "ビジネス",       desc: "信頼・落ち着き" },
  { key: "school",    label: "学校・発表",     desc: "親しみ・見やすさ" },
  { key: "simple",    label: "シンプル",       desc: "無駄なし" },
  { key: "cute",      label: "可愛い",         desc: "柔らか・ポップ" },
  { key: "stylish",   label: "スタイリッシュ", desc: "洗練・モダン" },
  { key: "japanese",  label: "和風",           desc: "伝統・静けさ" },
  { key: "natural",   label: "ナチュラル",     desc: "やさしい・素材感" },
  { key: "pop",       label: "ポップ",         desc: "元気・カラフル" },
  { key: "elegant",   label: "エレガント",     desc: "上品・高級感" },
  { key: "tech",      label: "テック",         desc: "先進・クール" },
];

export const PRESETS: Preset[] = [
  // ── business（紺×金・グレー・深紺：信頼と高級感） ──
  { id: "biz-navy-gold",  name: "紺×金",       category: "business", style: "sidebar",  base: "#f7f2e8", c1: "#1f2d4a", c2: "#c9a24a", intensity: 0.85, dark: false, font: "yugo" },
  { id: "biz-slate",      name: "スレートグレー", category: "business", style: "band",   base: "#f2f3f5", c1: "#3a4250", c2: "#9aa6b8", intensity: 0.8,  dark: false, font: "meiryo" },
  { id: "biz-deepnavy",   name: "深紺グラデ",   category: "business", style: "gradient", base: "#16243f", c1: "#2e4a7a", c2: "#7fa8e0", intensity: 0.85, dark: true,  font: "yugo" },

  // ── school（親しみ・差し色で明るく） ──
  { id: "school-blue",    name: "やさしい青",   category: "school", style: "blobs",  base: "#eef4fb", c1: "#4a90d9", c2: "#ffd479", intensity: 0.8,  dark: false, font: "udkyo" },
  { id: "school-green",   name: "みどり",       category: "school", style: "band",   base: "#eef7f2", c1: "#5aa86f", c2: "#ffd86b", intensity: 0.8,  dark: false, font: "bizudpg" },
  { id: "school-orange",  name: "オレンジ",     category: "school", style: "corner", base: "#fff4ea", c1: "#e8893f", c2: "#6fbfd6", intensity: 0.78, dark: false, font: "maru" },

  // ── simple（ミニマル・上質） ──
  { id: "simple-mono",      name: "モノ",       category: "simple", style: "bracket", base: "#f4f4f5", c1: "#2a2c33", c2: "#b9bcc4", intensity: 0.75, dark: false, font: "yugo" },
  { id: "simple-thinframe", name: "白×金細枠",  category: "simple", style: "frame",   base: "#fbfbfb", c1: "#8a909a", c2: "#c9a24a", intensity: 0.7,  dark: false, font: "yugol" },
  { id: "simple-offwhite",  name: "オフホワイト", category: "simple", style: "solid", base: "#f7f5f0", c1: "#c9c0ad", c2: "#e8dfc8", intensity: 0.7,  dark: false, font: "meiryo" },

  // ── cute（もっと可愛く：ハート・ドット・ふんわり） ──
  { id: "cute-ichigo",   name: "いちごミルク", category: "cute", style: "blobs", base: "#fff5f7", c1: "#ff9ec4", c2: "#ffd66b", intensity: 0.85, dark: false, font: "maru" },
  { id: "cute-yumekawa", name: "ゆめかわ",     category: "cute", style: "waves",  base: "#f6f2ff", c1: "#c9a7f0", c2: "#8fe3d0", intensity: 0.8,  dark: false, font: "maru" },
  { id: "cute-sorairo",  name: "そらいろ",     category: "cute", style: "blobs",  base: "#eef7ff", c1: "#7cc6f5", c2: "#ffc1d9", intensity: 0.82, dark: false, font: "pop" },

  // ── stylish（暗・洗練） ──
  { id: "stylish-gold", name: "黒×ゴールド",   category: "stylish", style: "bracket", base: "#1a1a1e", c1: "#c9a24a", c2: "#e7d39a", intensity: 0.8,  dark: true, font: "yumin" },
  { id: "stylish-mesh", name: "ダークグラデ",   category: "stylish", style: "gradient", base: "#14121c", c1: "#9a7fe0", c2: "#4fd1c5", intensity: 0.88, dark: true, font: "yugol" },
  { id: "stylish-mono", name: "モノトーン",    category: "stylish", style: "band",     base: "#1f2024", c1: "#6b7686", c2: "#aeb6c2", intensity: 0.8,  dark: true, font: "meiryo" },

  // ── japanese（和・金差し） ──
  { id: "jp-matcha",  name: "抹茶×金",  category: "japanese", style: "frame",   base: "#f3f1e6", c1: "#6b7d52", c2: "#b9974f", intensity: 0.78, dark: false, font: "yumin" },
  { id: "jp-navygold", name: "紺×金",   category: "japanese", style: "band",    base: "#1c2a3a", c1: "#c2a25a", c2: "#e0c98a", intensity: 0.82, dark: true,  font: "kaisho" },
  { id: "jp-kinari",  name: "生成り×朱", category: "japanese", style: "bracket", base: "#f7f2e9", c1: "#b5503f", c2: "#c9a24a", intensity: 0.78, dark: false, font: "gyosho" },

  // ── natural（素材感・アースカラー） ──
  { id: "nat-beige",      name: "ベージュ",   category: "natural", style: "blobs",  base: "#f5f0e6", c1: "#b09a78", c2: "#8fae8f", intensity: 0.75, dark: false, font: "meiryo" },
  { id: "nat-sage",       name: "セージ波",   category: "natural", style: "waves",  base: "#f5f3ec", c1: "#9cae8f", c2: "#d8c89a", intensity: 0.8,  dark: false, font: "yugo" },
  { id: "nat-terracotta", name: "テラコッタ", category: "natural", style: "corner", base: "#f8efe8", c1: "#c08457", c2: "#7fae9f", intensity: 0.75, dark: false, font: "maru" },

  // ── pop（元気・カラフル） ──
  { id: "pop-sunset",    name: "サンセット",   category: "pop", style: "gradient", base: "#fff7e8", c1: "#f6a55f", c2: "#ec5b8a", intensity: 0.88, dark: false, font: "pop" },
  { id: "pop-pink",      name: "ビビッドピンク", category: "pop", style: "blobs", base: "#fdf1f3", c1: "#ec4899", c2: "#ffd166", intensity: 0.85, dark: false, font: "kakuub" },
  { id: "pop-turquoise", name: "ターコイズ",   category: "pop", style: "blobs",   base: "#eafaf7", c1: "#22b8a6", c2: "#ffb86b", intensity: 0.85, dark: false, font: "pop" },

  // ── elegant（くすみ＋金・上品） ──
  { id: "ele-mauvegold", name: "くすみピンク×金", category: "elegant", style: "frame",   base: "#f6eff0", c1: "#b08a92", c2: "#c9a24a", intensity: 0.75, dark: false, font: "yumin" },
  { id: "ele-champagne", name: "ネイビー×シャンパン", category: "elegant", style: "sidebar", base: "#f3f1ec", c1: "#2c3a5c", c2: "#c9a878", intensity: 0.82, dark: false, font: "yumin" },
  { id: "ele-mauve",     name: "モーヴ",         category: "elegant", style: "gradient", base: "#2a2230", c1: "#b98aa8", c2: "#e0c4d6", intensity: 0.85, dark: true,  font: "yumin" },

  // ── tech（暗・シアン・先進） ──
  { id: "tech-grid",  name: "ダークブルー格子", category: "tech", style: "grid", base: "#0f1a2e", c1: "#3fa9d8", c2: "#6be0c8", intensity: 0.82, dark: true,  font: "yugo" },
  { id: "tech-mesh",  name: "サイバーグラデ",   category: "tech", style: "gradient", base: "#14121c", c1: "#4fd1c5", c2: "#9a7fe0", intensity: 0.88, dark: true,  font: "meiryo" },
  { id: "tech-slate", name: "スレート",         category: "tech", style: "bracket", base: "#eef1f4", c1: "#48566b", c2: "#8fb8d8", intensity: 0.78, dark: false, font: "yugo" },
];

export function presetsByCategory(key: CategoryKey): Preset[] {
  return PRESETS.filter((p) => p.category === key);
}
