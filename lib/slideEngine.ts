/**
 * スライド背景の共有エンジン（すっきり・背景は脇役 リデザイン版）。
 * slide-bg / preset-bg で共用。描画は完全に決定的（プレビュー === 書き出し）。
 *
 * 共通原則: すべて「すっきり・主役は文字/中身」。装飾は控えめ・低コントラスト・中央〜本文域は空ける。
 * 配色: base（下地）/ c1（主役色）/ c2（差し色）。スタイルが必要な分だけ（1〜2色）使う。
 * 系統(mood): cute（かわいい）/ simple（シンプル）/ universal（汎用）。
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type Style =
  | "blobs" | "gradient" | "waves" | "band" | "sidebar"
  | "frame" | "bracket" | "corner" | "grid" | "solid";

export type Mood = "cute" | "simple" | "universal";
export type AspectKey = "16:9" | "4:3" | "16:10";

export interface Config {
  style: Style;
  base: string;
  c1: string;
  c2: string;
  intensity: number; // 0.2 - 1
}

export interface Aspect {
  key: AspectKey; label: string; sub: string;
  w: number; h: number; inW: number; inH: number;
}

export interface Palette {
  key: string; name: string;
  base: string; c1: string; c2: string;
  dark: boolean; mood: Mood;
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const ASPECTS: Aspect[] = [
  { key: "16:9",  label: "16:9",  sub: "ワイド",      w: 1920, h: 1080, inW: 13.333, inH: 7.5 },
  { key: "4:3",   label: "4:3",   sub: "スタンダード", w: 1440, h: 1080, inW: 10,     inH: 7.5 },
  { key: "16:10", label: "16:10", sub: "ワイド広め",   w: 1920, h: 1200, inW: 13.333, inH: 8.333 },
];

// 系統で配色の並び順が変わる
export const STYLES: { key: Style; label: string; mood: Mood }[] = [
  { key: "blobs",    label: "ふんわり",   mood: "cute" },
  { key: "corner",   label: "コーナー",   mood: "cute" },
  { key: "bracket",  label: "角線",       mood: "cute" },
  { key: "frame",    label: "フレーム",   mood: "simple" },
  { key: "band",     label: "帯",         mood: "simple" },
  { key: "sidebar",  label: "サイド",     mood: "simple" },
  { key: "gradient", label: "グラデ",     mood: "universal" },
  { key: "waves",    label: "波",         mood: "universal" },
  { key: "grid",     label: "グリッド",   mood: "universal" },
  { key: "solid",    label: "無地",       mood: "universal" },
];

export function styleMood(key: Style): Mood {
  return STYLES.find((s) => s.key === key)?.mood ?? "universal";
}

// スタイルごとに intensity スライダーが調整する対象（UIのラベル）
export const STYLE_ADJUST: Record<Style, string> = {
  blobs:    "色の広がり",
  gradient: "色の強さ",
  waves:    "波の大きさ",
  band:     "帯の広さ",
  sidebar:  "サイドの広さ",
  frame:    "枠の位置",
  bracket:  "線の長さ",
  corner:   "丸の大きさ",
  grid:     "マスの大きさ",
  solid:    "色の濃さ",
};

// 配色（系統別に厳選）。slide-bg のビルダーで使用。
export const PALETTES: Palette[] = [
  // ── かわいい（パステル2色） ──
  { key: "sakura",   name: "さくら",     base: "#fff5f7", c1: "#ff9ec4", c2: "#ffd98a", dark: false, mood: "cute" },
  { key: "mint",     name: "ミント",     base: "#eefbf5", c1: "#7fd6bd", c2: "#ffc2d8", dark: false, mood: "cute" },
  { key: "lavender", name: "ラベンダー", base: "#f5f2ff", c1: "#c2a8ef", c2: "#a8e6d8", dark: false, mood: "cute" },
  // ── シンプル（1色＋白黒） ──
  { key: "mono",     name: "モノクロ",   base: "#f4f4f5", c1: "#2c2e33", c2: "#aeb2b8", dark: false, mood: "simple" },
  { key: "navy",     name: "ネイビー",   base: "#f2f4f7", c1: "#2a3a5c", c2: "#c3ccd9", dark: false, mood: "simple" },
  { key: "charcoal", name: "チャコール", base: "#eef0f2", c1: "#41464f", c2: "#c7ccd3", dark: false, mood: "simple" },
  { key: "darknavy", name: "ダーク紺",   base: "#16213a", c1: "#4a6aa8", c2: "#c9d4e8", dark: true,  mood: "simple" },
  // ── 汎用 ──
  { key: "gray",     name: "グレー",     base: "#f3f3f4", c1: "#8a8f98", c2: "#c8ccd2", dark: false, mood: "universal" },
  { key: "beige",    name: "ベージュ",   base: "#f6f1e8", c1: "#c2ad88", c2: "#e3d8c2", dark: false, mood: "universal" },
];

// 選択スタイルの mood に合わせて同系統の配色を先頭へ（安定ソート）
export function sortPalettesForStyle(styleKey: Style): Palette[] {
  const m = styleMood(styleKey);
  return [...PALETTES].sort((a, b) => (a.mood === m ? 0 : 1) - (b.mood === m ? 0 : 1));
}

// PowerPoint/Office標準フォント（左ほど定番）。他PCで置換されない＝バグ回避。
export const FONTS: { key: string; label: string; stack: string }[] = [
  { key: "yugo",     label: "游ゴシック",        stack: "'Yu Gothic','游ゴシック',sans-serif" },
  { key: "meiryo",   label: "メイリオ",          stack: "'Meiryo','メイリオ',sans-serif" },
  { key: "yumin",    label: "游明朝",            stack: "'Yu Mincho','游明朝',serif" },
  { key: "kakuub",   label: "創英角ゴシックUB",   stack: "'HG創英角ゴシックUB','HGSoeiKakugothicUB',sans-serif" },
  { key: "pop",      label: "創英角ポップ体",     stack: "'HG創英角ポップ体','HGSoeiKakupoptai',sans-serif" },
  { key: "bizudpg",  label: "BIZ UDPゴシック",    stack: "'BIZ UDPGothic','BIZ UDPゴシック',sans-serif" },
  { key: "udkyo",    label: "UDデジタル教科書体", stack: "'UD デジタル 教科書体 NP-R','UDDigiKyokashoNP-R','Yu Gothic',sans-serif" },
  { key: "maru",     label: "丸ゴシック",         stack: "'HG丸ゴシックM-PRO','HGMaruGothicMPRO','Yu Gothic',sans-serif" },
  { key: "bizudpm",  label: "BIZ UDP明朝",       stack: "'BIZ UDPMincho','BIZ UDP明朝',serif" },
  { key: "msgo",     label: "MS Pゴシック",       stack: "'MS PGothic','ＭＳ Ｐゴシック',sans-serif" },
  { key: "gyosho",   label: "行書体",            stack: "'HG行書体','HGGyoshotai',serif" },
  { key: "kaisho",   label: "正楷書体",          stack: "'HG正楷書体-PRO','HGSeikaishotaiPRO',serif" },
  { key: "gothice",  label: "HGゴシックE",        stack: "'HGゴシックE','HGGothicE',sans-serif" },
  { key: "minchoe",  label: "HG明朝E",           stack: "'HG明朝E','HGMinchoE',serif" },
  { key: "presence", label: "創英プレゼンスEB",   stack: "'HGS創英プレゼンスEB','HGSSoeiPresenceEB',sans-serif" },
  { key: "msmin",    label: "MS P明朝",          stack: "'MS PMincho','ＭＳ Ｐ明朝',serif" },
  { key: "yugol",    label: "游ゴシック Light",   stack: "'Yu Gothic Light','Yu Gothic',sans-serif" },
  { key: "bizudg",   label: "BIZ UDゴシック",     stack: "'BIZ UDGothic','BIZ UDゴシック',sans-serif" },
  { key: "msgothic", label: "MSゴシック",         stack: "'MS Gothic','ＭＳ ゴシック',monospace" },
  { key: "yumindb",  label: "游明朝 Demibold",   stack: "'Yu Mincho Demibold','Yu Mincho',serif" },
];

export const SLIDE_COUNTS = [1, 2, 3, 5, 10, 20];
export const MAX_SLIDES = 50;

export function fontStackOf(key: string): string {
  return FONTS.find((f) => f.key === key)?.stack ?? FONTS[0].stack;
}
export function fontLabelOf(key: string): string {
  return FONTS.find((f) => f.key === key)?.label ?? FONTS[0].label;
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function hx(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
}
export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hx(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
const rgba = hexToRgba;
function softBlob(ctx: CanvasRenderingContext2D, w: number, h: number, cx: number, cy: number, r: number, hex: string, a: number) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, rgba(hex, a));
  g.addColorStop(1, rgba(hex, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
// 文字が乗る中央域を base で淡く持ち上げ、前面テキストの可読性を確保（汎用の塗り面用）
function clearCenter(ctx: CanvasRenderingContext2D, w: number, h: number, base: string, strength: number) {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.06, w * 0.5, h * 0.5, w * 0.58);
  g.addColorStop(0, rgba(base, strength));
  g.addColorStop(0.6, rgba(base, strength * 0.4));
  g.addColorStop(1, rgba(base, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// ─── Drawing ──────────────────────────────────────────────────────────────────

/** すべての座標を w/h 相対で描く → プレビューも書き出しも完全一致。すっきり・脇役・中央域は空ける。 */
export function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, cfg: Config) {
  const { style, base, c1, c2, intensity: k } = cfg;
  const U = w / 1920;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // k = intensity スライダー(0..1)。各スタイルで「1つの専用パラメータ」を動かす（STYLE_ADJUST参照）
  if (style === "blobs") {
    // かわいい: 丸い玉2つ。スライダー＝色の広がり（半径）
    const r1 = w * (0.26 + 0.28 * k), r2 = w * (0.22 + 0.26 * k);
    softBlob(ctx, w, h, w * 0.87, h * 0.15, r1, c1, 0.42);
    softBlob(ctx, w, h, w * 0.11, h * 0.88, r2, c2, 0.4);
    softBlob(ctx, w, h, w * 0.86, h * 0.16, r1 * 0.5, "#ffffff", 0.2);
    clearCenter(ctx, w, h, base, 0.28);
  } else if (style === "gradient") {
    // 汎用: base→c1 グラデ。スライダー＝色の強さ
    const g = ctx.createLinearGradient(0, 0, w * 0.9, h);
    g.addColorStop(0, rgba(c1, 0));
    g.addColorStop(1, rgba(c1, 0.06 + 0.42 * k));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    clearCenter(ctx, w, h, base, 0.22);
  } else if (style === "waves") {
    // 汎用: 上下モノトーン波・全幅。スライダー＝波の大きさ（高さ・振幅）
    const grow = 0.55 + 1.1 * k;          // 振幅倍率
    const reach = h * (0.09 + 0.11 * k);  // 端から中央へ伸びる量
    const layers: [number, number, number][] = [
      [0, h * 0.03, 0.14], [h * 0.045, h * 0.04, 0.24], [h * 0.085, h * 0.028, 0.4],
    ];
    layers.forEach(([off, amp, a], i) => {
      const by = h - reach + off * grow;
      ctx.fillStyle = rgba(c1, a);
      ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, by);
      for (let x = 0; x <= w; x += w / 80) ctx.lineTo(x, by + Math.sin((x / w) * 6.28 + i * 1.1) * amp * grow);
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    });
    layers.forEach(([off, amp, a], i) => {
      const by = reach - off * grow;
      ctx.fillStyle = rgba(c1, a);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, by);
      for (let x = 0; x <= w; x += w / 80) ctx.lineTo(x, by - Math.sin((x / w) * 6.28 + i * 1.1) * amp * grow);
      ctx.lineTo(w, 0); ctx.closePath(); ctx.fill();
    });
  } else if (style === "band") {
    // シンプル: 上下帯＋境界線。スライダー＝帯の広さ
    const bh = h * (0.05 + 0.16 * k);
    const lw = Math.max(2, h * 0.007);
    ctx.fillStyle = rgba(c1, 0.92);
    ctx.fillRect(0, 0, w, bh); ctx.fillRect(0, h - bh, w, bh);
    ctx.fillStyle = rgba(c2, 0.95);
    ctx.fillRect(0, bh, w, lw); ctx.fillRect(0, h - bh - lw, w, lw);
  } else if (style === "sidebar") {
    // シンプル: 左縦帯＋境界線。スライダー＝サイドの広さ（最大で色が反転するほど広く）
    const bw = w * (0.06 + 0.82 * k * k);
    const lw = Math.max(2, w * 0.005);
    ctx.fillStyle = rgba(c1, 0.9);
    ctx.fillRect(0, 0, bw, h);
    ctx.fillStyle = rgba(c2, 0.95);
    ctx.fillRect(bw, 0, lw, h);
  } else if (style === "frame") {
    // シンプル: 枠＋四隅の点。スライダー＝枠の位置（内外）
    const ins = w * (0.02 + 0.07 * k);
    ctx.strokeStyle = rgba(c1, 0.85); ctx.lineWidth = Math.max(2.5, U * 5);
    ctx.strokeRect(ins, ins, w - ins * 2, h - ins * 2);
    ctx.fillStyle = rgba(c2, 0.95);
    for (const [x, y] of [[ins, ins], [w - ins, ins], [ins, h - ins], [w - ins, h - ins]]) {
      ctx.beginPath(); ctx.arc(x, y, Math.max(4, U * 6), 0, 7); ctx.fill();
    }
  } else if (style === "bracket") {
    // シンプル(かわいい寄り): 対角L字＋点。スライダー＝線の長さ
    const m = w * 0.04, len = w * (0.06 + 0.16 * k), lw = Math.max(3, U * 7);
    ctx.strokeStyle = rgba(c1, 0.9); ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(m, m + len); ctx.lineTo(m, m); ctx.lineTo(m + len, m); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w - m, h - m - len); ctx.lineTo(w - m, h - m); ctx.lineTo(w - m - len, h - m); ctx.stroke();
    ctx.lineCap = "butt"; ctx.fillStyle = rgba(c2, 0.95);
    ctx.beginPath(); ctx.arc(w - m, m, lw * 0.85, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(m, h - m, lw * 0.85, 0, 7); ctx.fill();
  } else if (style === "corner") {
    // かわいい: くっきりした2色の丸（角アンカー）。スライダー＝丸の大きさ
    const r = w * (0.06 + 0.13 * k);
    ctx.fillStyle = rgba(c1, 0.9);
    ctx.beginPath(); ctx.arc(w - r * 0.4, h - r * 0.4, r, 0, 7); ctx.fill();
    ctx.fillStyle = rgba(c2, 0.9);
    ctx.beginPath(); ctx.arc(w - r * 1.5, h - r * 0.15, r * 0.55, 0, 7); ctx.fill();
    // 左上：角にアンカーした小さな丸（角から覗く形）
    const rs = r * 0.6;
    ctx.fillStyle = rgba(c2, 0.85);
    ctx.beginPath(); ctx.arc(rs * 0.35, rs * 0.35, rs, 0, 7); ctx.fill();
  } else if (style === "grid") {
    // 汎用: 細グリッド。スライダー＝マスの大きさ
    const cols = Math.round(26 - 17 * k);  // k大=マス大（線少）
    const gap = w / cols;
    ctx.strokeStyle = rgba(c1, 0.2); ctx.lineWidth = Math.max(1.2, U * 2);
    ctx.beginPath();
    for (let x = gap; x < w; x += gap) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = gap; y < h; y += gap) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    clearCenter(ctx, w, h, base, 0.3);
  } else {
    // 無地: 淡い2色ビネット。スライダー＝色の濃さ
    const g = ctx.createRadialGradient(w * 0.5, h * 0.4, h * 0.1, w * 0.5, h * 0.5, w * 0.8);
    g.addColorStop(0, rgba(c2, 0.04)); g.addColorStop(1, rgba(c1, 0.04 + 0.22 * k));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
}

// ─── 出力（PNG / PPTX）── 両ツール共通 ────────────────────────────────────────

export function renderFull(cfg: Config, w: number, h: number): HTMLCanvasElement {
  const off = document.createElement("canvas");
  off.width = w; off.height = h;
  const ctx = off.getContext("2d");
  if (ctx) drawBackground(ctx, w, h, cfg);
  return off;
}

export function exportPng(cfg: Config, aspect: Aspect, fileName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      renderFull(cfg, aspect.w, aspect.h).toBlob((blob) => {
        if (!blob) { reject(new Error("blob is null")); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url); resolve();
      }, "image/png");
    } catch (e) { reject(e); }
  });
}

export async function exportPptx(cfg: Config, aspect: Aspect, slideCount: number, fileName: string): Promise<void> {
  const dataUrl = renderFull(cfg, aspect.w, aspect.h).toDataURL("image/png");
  const imgData = dataUrl.replace(/^data:/, "");
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "tadatada", width: aspect.inW, height: aspect.inH });
  pptx.layout = "tadatada";
  for (let i = 0; i < slideCount; i++) {
    const slide = pptx.addSlide();
    slide.background = { data: imgData };
  }
  await pptx.writeFile({ fileName });
}
