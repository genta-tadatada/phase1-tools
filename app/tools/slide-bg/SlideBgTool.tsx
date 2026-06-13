"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Download, Shuffle, Type, Palette as PaletteIcon, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { DarkModeToggle } from "@/components/tool-layout/DarkModeToggle";

// ─── Types ──────────────────────────────────────────────────────────────────

type Style =
  | "gradient" | "blobs" | "corner" | "diagonal" | "sidebar"
  | "dots" | "waves" | "frame" | "grid" | "stripes" | "solid";
type AspectKey = "16:9" | "4:3" | "16:10";

interface Palette {
  key: string;
  name: string;
  base: string;
  accent: string;
  dark: boolean; // true = 文字は白がよい暗い背景
}

interface Config {
  style: Style;
  base: string;
  accent: string;
  intensity: number; // 0.2 - 1
}

// ─── Constants ──────────────────────────────────────────────────────────────

// w/h = PNG書き出しの解像度(px) / inW・inH = PowerPointスライドの寸法(インチ)
const ASPECTS: { key: AspectKey; label: string; sub: string; w: number; h: number; inW: number; inH: number }[] = [
  { key: "16:9",  label: "16:9",  sub: "ワイド",      w: 1920, h: 1080, inW: 13.333, inH: 7.5 },
  { key: "4:3",   label: "4:3",   sub: "スタンダード", w: 1440, h: 1080, inW: 10,     inH: 7.5 },
  { key: "16:10", label: "16:10", sub: "ワイド広め",   w: 1920, h: 1200, inW: 13.333, inH: 8.333 },
];

// 利用頻度が高そうな順（左→右）。無地は「こだわり派向け」なので最後＋ランダム除外。
const STYLES: { key: Style; label: string }[] = [
  { key: "gradient", label: "グラデ" },
  { key: "blobs",    label: "ふんわり" },
  { key: "corner",   label: "コーナー" },
  { key: "diagonal", label: "斜め" },
  { key: "sidebar",  label: "サイド" },
  { key: "dots",     label: "ドット" },
  { key: "waves",    label: "波" },
  { key: "frame",    label: "フレーム" },
  { key: "grid",     label: "方眼" },
  { key: "stripes",  label: "ストライプ" },
  { key: "solid",    label: "無地" },
];

// PowerPoint/Office標準搭載フォントから価値・利用頻度の高い20種を選定（左ほど定番）。
// 他PCで開いてもフォント置換が起きない＝バグ回避。
const FONTS: { key: string; label: string; stack: string }[] = [
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

const SLIDE_COUNTS = [1, 2, 3, 5, 10, 20];
const MAX_SLIDES = 50;

const PALETTES: Palette[] = [
  { key: "sage",      name: "セージ",     base: "#f5f3ec", accent: "#9cae8f", dark: false },
  { key: "lavender",  name: "ラベンダー", base: "#f3f0fa", accent: "#b9a7e6", dark: false },
  { key: "mint",      name: "ミント",     base: "#eef7f2", accent: "#7fc8a0", dark: false },
  { key: "sakura",    name: "サクラ",     base: "#fdf1f3", accent: "#f4a6b8", dark: false },
  { key: "sunset",    name: "サンセット", base: "#fff3ea", accent: "#f6a55f", dark: false },
  { key: "mono",      name: "モノクロ",   base: "#f4f4f5", accent: "#c4c4cc", dark: false },
  { key: "navy",      name: "ネイビー",   base: "#16243f", accent: "#5b8bd4", dark: true  },
  { key: "charcoal",  name: "チャコール", base: "#1f2024", accent: "#7c8696", dark: true  },
  { key: "ocean",     name: "オーシャン", base: "#0f2730", accent: "#3fa9b8", dark: true  },
  { key: "night",     name: "ナイト",     base: "#14121c", accent: "#9a7fe0", dark: true  },
];

const PREVIEW_W = 1024;

// ─── Drawing (decided & deterministic: preview === download) ──────────────────

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** すべての座標を w/h 相対で描く → プレビューも書き出しも完全一致する */
function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, cfg: Config) {
  const { style, base, accent, intensity } = cfg;
  const k = intensity;

  // ベース全面
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  if (style === "solid") {
    // 中央が明るく四隅が締まる、ごく淡いビネット（文字が主役）
    const g = ctx.createRadialGradient(w / 2, h * 0.42, h * 0.1, w / 2, h / 2, w * 0.75);
    g.addColorStop(0, hexToRgba(accent, 0));
    g.addColorStop(1, hexToRgba(accent, 0.1 * k));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else if (style === "gradient") {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, base);
    g.addColorStop(1, hexToRgba(accent, 0.5 + 0.5 * k));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // 右下のやわらかな光
    const glow = ctx.createRadialGradient(w * 0.82, h * 0.82, 0, w * 0.82, h * 0.82, w * 0.5);
    glow.addColorStop(0, hexToRgba(accent, 0.25 * k));
    glow.addColorStop(1, hexToRgba(accent, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  } else if (style === "blobs") {
    const blobs: [number, number, number, number][] = [
      [w * 0.85, h * 0.2, w * 0.42, 0.22],
      [w * 0.12, h * 0.85, w * 0.4, 0.18],
      [w * 0.5, h * 0.45, w * 0.5, 0.1],
    ];
    for (const [cx, cy, r, a] of blobs) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, hexToRgba(accent, a * (0.6 + k)));
      g.addColorStop(1, hexToRgba(accent, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  } else if (style === "dots") {
    const gap = w / 26;
    const r = gap * 0.11 * (0.7 + k);
    ctx.fillStyle = hexToRgba(accent, 0.55 * k);
    for (let y = gap; y < h; y += gap) {
      for (let x = gap; x < w; x += gap) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (style === "grid") {
    const gap = w / 24;
    ctx.strokeStyle = hexToRgba(accent, 0.42 * k);
    ctx.lineWidth = Math.max(1, (w / 1920) * 2);
    ctx.beginPath();
    for (let x = gap; x < w; x += gap) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = gap; y < h; y += gap) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
  } else if (style === "waves") {
    const bands = [
      { base: h * 0.72, amp: h * 0.06, alpha: 0.14 },
      { base: h * 0.8, amp: h * 0.08, alpha: 0.2 },
      { base: h * 0.88, amp: h * 0.05, alpha: 0.28 },
    ];
    bands.forEach((b, i) => {
      ctx.fillStyle = hexToRgba(accent, b.alpha * k);
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, b.base);
      const phase = i * 1.1;
      for (let x = 0; x <= w; x += w / 60) {
        const y = b.base + Math.sin((x / w) * Math.PI * 2 + phase) * b.amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    });
  } else if (style === "corner") {
    // 角の大きな円（テンプレ的）。中央は空けて文字を乗せやすく
    ctx.fillStyle = hexToRgba(accent, 0.5 + 0.45 * k);
    ctx.beginPath();
    ctx.arc(w, h, w * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexToRgba(accent, 0.22 + 0.28 * k);
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.26, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === "diagonal") {
    // 下部の斜めバンド＋細い平行線（タイトルスライド向け）
    ctx.fillStyle = hexToRgba(accent, 0.5 + 0.45 * k);
    ctx.beginPath();
    ctx.moveTo(0, h * 0.62);
    ctx.lineTo(w, h * 0.32);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hexToRgba(accent, 0.3 * k);
    ctx.beginPath();
    ctx.moveTo(0, h * 0.54);
    ctx.lineTo(w, h * 0.24);
    ctx.lineTo(w, h * 0.3);
    ctx.lineTo(0, h * 0.6);
    ctx.closePath();
    ctx.fill();
  } else if (style === "sidebar") {
    // 左の縦アクセント帯（コーポレート資料風）
    const bw = w * 0.14;
    ctx.fillStyle = hexToRgba(accent, 0.5 + 0.45 * k);
    ctx.fillRect(0, 0, bw, h);
    ctx.fillStyle = hexToRgba(accent, 0.3 * k);
    ctx.fillRect(bw + w * 0.014, 0, w * 0.009, h);
  } else if (style === "frame") {
    // 内側に上品な二重枠（タイトル扉向け・中央は完全に空く）
    const inset = w * 0.045;
    ctx.strokeStyle = hexToRgba(accent, 0.5 + 0.4 * k);
    ctx.lineWidth = Math.max(2, (w / 1920) * 7);
    ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
    ctx.strokeStyle = hexToRgba(accent, 0.3 * k);
    ctx.lineWidth = Math.max(1, (w / 1920) * 2);
    ctx.strokeRect(inset * 1.6, inset * 1.6, w - inset * 3.2, h - inset * 3.2);
  } else if (style === "stripes") {
    // 45度の控えめな斜線テクスチャ
    ctx.strokeStyle = hexToRgba(accent, 0.26 * k);
    ctx.lineWidth = Math.max(2, (w / 1920) * 10);
    const gap = w / 14;
    ctx.beginPath();
    for (let x = -h; x < w; x += gap) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x + h, h);
    }
    ctx.stroke();
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SlideBgTool() {
  const [aspectKey, setAspectKey] = useState<AspectKey>("16:9");
  const [style, setStyle] = useState<Style>("blobs");
  const [paletteKey, setPaletteKey] = useState<string>("lavender");
  const [base, setBase] = useState<string>(PALETTES[1].base);
  const [accent, setAccent] = useState<string>(PALETTES[1].accent);
  const [dark, setDark] = useState<boolean>(false);
  const [intensity, setIntensity] = useState<number>(0.7);
  const [showText, setShowText] = useState<boolean>(true);
  const [exporting, setExporting] = useState<"png" | "pptx" | null>(null);
  const [fontKey, setFontKey] = useState<string>("yugo");
  const [slideCount, setSlideCount] = useState<number>(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aspect = ASPECTS.find((a) => a.key === aspectKey)!;
  const fontStack = FONTS.find((f) => f.key === fontKey)?.stack ?? FONTS[0].stack;
  const cfg: Config = { style, base, accent, intensity };

  function applyPalette(p: Palette) {
    setPaletteKey(p.key);
    setBase(p.base);
    setAccent(p.accent);
    setDark(p.dark);
  }

  // プレビュー再描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pw = PREVIEW_W;
    const ph = Math.round((pw * aspect.h) / aspect.w);
    canvas.width = pw;
    canvas.height = ph;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawBackground(ctx, pw, ph, cfg);
  }, [aspectKey, style, base, accent, intensity, aspect.h, aspect.w]);

  const randomize = useCallback(() => {
    const p = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    // 無地はランダム対象外（こだわり派向けのため）
    const pickable = STYLES.filter((s) => s.key !== "solid");
    const s = pickable[Math.floor(Math.random() * pickable.length)].key;
    const i = 0.5 + Math.random() * 0.45;
    applyPalette(p);
    setStyle(s);
    setIntensity(Math.round(i * 100) / 100);
  }, []);

  // 書き出し用に原寸canvasを描画（プレビューと同一のdrawBackgroundを使う＝見た目一致）
  const renderFull = useCallback((): HTMLCanvasElement => {
    const off = document.createElement("canvas");
    off.width = aspect.w;
    off.height = aspect.h;
    const ctx = off.getContext("2d");
    if (ctx) drawBackground(ctx, aspect.w, aspect.h, cfg);
    return off;
  }, [aspect.w, aspect.h, cfg]);

  const downloadPng = useCallback(() => {
    setExporting("png");
    try {
      renderFull().toBlob((blob) => {
        if (!blob) {
          setExporting(null);
          toast.error("画像の作成に失敗しました");
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ただただ-背景-${aspectKey.replace(":", "x")}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setExporting(null);
        toast.success(`PNG画像を保存しました（${aspect.w}×${aspect.h}）`);
      }, "image/png");
    } catch {
      setExporting(null);
      toast.error("画像の作成に失敗しました");
    }
  }, [renderFull, aspectKey, aspect.w, aspect.h]);

  // PowerPointファイル（.pptx）として書き出し。背景をスライド全面に敷いた1枚を生成
  const downloadPptx = useCallback(async () => {
    setExporting("pptx");
    try {
      const dataUrl = renderFull().toDataURL("image/png");
      // pptxgenjsは "image/png;base64,..." 形式を要求（"data:" 接頭辞は外す）
      const imgData = dataUrl.replace(/^data:/, "");
      const PptxGenJS = (await import("pptxgenjs")).default;
      const pptx = new PptxGenJS();
      pptx.defineLayout({ name: "tadatada", width: aspect.inW, height: aspect.inH });
      pptx.layout = "tadatada";
      for (let i = 0; i < slideCount; i++) {
        const slide = pptx.addSlide();
        slide.background = { data: imgData };
      }
      await pptx.writeFile({ fileName: `ただただ-スライド-${aspectKey.replace(":", "x")}.pptx` });
      setExporting(null);
      toast.success(
        slideCount > 1
          ? `PowerPoint（${slideCount}枚）を保存しました`
          : "PowerPointファイルを保存しました"
      );
    } catch {
      setExporting(null);
      toast.error("PowerPointの作成に失敗しました");
    }
  }, [renderFull, aspectKey, aspect.inW, aspect.inH, slideCount]);

  return (
    <ToolLayout title="プレゼン背景メーカー">
      <div className="flex flex-col gap-5">
        {/* ヘッダー行（ダークモード） */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground leading-relaxed">
            スライドに敷ける背景画像を、原寸でつくって保存。
          </p>
          <DarkModeToggle />
        </div>

        {/* ── プレビュー ── */}
        <div>
          <div
            className="relative w-full rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/10"
            style={{ aspectRatio: `${aspect.w} / ${aspect.h}` }}
          >
            <canvas ref={canvasRef} className="block w-full h-full" />
            {showText && (
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center pointer-events-none select-none">
                <span
                  style={{
                    fontFamily: fontStack,
                    fontWeight: 900,
                    color: dark ? "#ffffff" : "#1f2024",
                    fontSize: "clamp(22px, 6.5vw, 48px)",
                    lineHeight: 1.25,
                    textShadow: dark ? "0 1px 12px rgba(0,0,0,0.25)" : "none",
                  }}
                >
                  プレゼンタイトル
                </span>
              </div>
            )}
            {/* 寸法バッジ */}
            <span
              className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
              style={{ background: "rgba(0,0,0,0.42)", color: "#fff", fontFamily: "Quicksand, sans-serif" }}
            >
              {aspect.w} × {aspect.h}px
            </span>
          </div>
        </div>

        {/* ── 主操作（おまかせ / 保存） ── */}
        <div className="flex flex-col gap-2.5">
          <Button
            variant="outline"
            onClick={randomize}
            disabled={exporting !== null}
            className="w-full h-11 gap-2 rounded-xl font-bold"
          >
            <Shuffle className="w-4 h-4" />
            おまかせ
          </Button>
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              onClick={downloadPng}
              disabled={exporting !== null}
              className="flex-1 h-12 gap-2 rounded-xl font-bold"
            >
              <Download className="w-4 h-4" />
              {exporting === "png" ? "保存中…" : "PNG画像"}
            </Button>
            <Button
              onClick={downloadPptx}
              disabled={exporting !== null}
              className="flex-1 h-12 gap-2 rounded-xl font-bold"
            >
              <Presentation className="w-4 h-4" />
              {exporting === "pptx" ? "作成中…" : "PowerPoint"}
            </Button>
          </div>
        </div>

        {/* ── アスペクト比 ── */}
        <Section label="サイズ（スライドの比率）">
          <div className="grid grid-cols-3 gap-2">
            {ASPECTS.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => setAspectKey(a.key)}
                className="flex flex-col items-center justify-center py-2.5 rounded-xl border-2 transition-colors"
                style={{
                  borderColor: aspectKey === a.key ? "#8b5cf6" : "var(--border)",
                  background: aspectKey === a.key ? "rgba(139,92,246,0.08)" : "transparent",
                }}
              >
                <span className="font-black text-sm" style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", color: aspectKey === a.key ? "#7c3aed" : "var(--foreground)" }}>
                  {a.label}
                </span>
                <span className="text-[10px] text-muted-foreground">{a.sub}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* ── スタイル ── */}
        <Section label="スタイル">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {STYLES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStyle(s.key)}
                className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border-2 transition-colors"
                style={{
                  borderColor: style === s.key ? "#8b5cf6" : "var(--border)",
                  background: style === s.key ? "rgba(139,92,246,0.08)" : "transparent",
                }}
              >
                <StylePreview styleKey={s.key} base={base} accent={accent} />
                <span className="text-[11px] font-bold" style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", color: style === s.key ? "#7c3aed" : "var(--muted-foreground)" }}>
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </Section>

        {/* ── 配色 ── */}
        <Section label="配色">
          <div className="flex gap-2 overflow-x-auto pb-1.5 -mx-1 px-1">
            {PALETTES.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPalette(p)}
                className="flex-shrink-0 flex flex-col items-center gap-1 rounded-xl p-1.5 border-2 transition-colors"
                style={{ borderColor: paletteKey === p.key ? "#8b5cf6" : "transparent" }}
              >
                <span className="flex rounded-lg overflow-hidden ring-1 ring-black/5" style={{ width: 46, height: 32 }}>
                  <span style={{ flex: 2, background: p.base }} />
                  <span style={{ flex: 1, background: p.accent }} />
                </span>
                <span className="text-[10px] font-bold whitespace-nowrap" style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", color: paletteKey === p.key ? "#7c3aed" : "var(--muted-foreground)" }}>
                  {p.name}
                </span>
              </button>
            ))}
          </div>

          {/* カスタムカラー */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <PaletteIcon className="w-3.5 h-3.5" />
              カスタム
            </span>
            <label className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">下地</span>
              <input
                type="color"
                value={base}
                onChange={(e) => { setBase(e.target.value); setPaletteKey("custom"); }}
                className="w-8 h-8 rounded-md border border-border cursor-pointer bg-transparent p-0"
                aria-label="下地の色"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">差し色</span>
              <input
                type="color"
                value={accent}
                onChange={(e) => { setAccent(e.target.value); setPaletteKey("custom"); }}
                className="w-8 h-8 rounded-md border border-border cursor-pointer bg-transparent p-0"
                aria-label="差し色"
              />
            </label>
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="ml-auto text-xs font-bold px-3 py-1.5 rounded-full border border-border transition-colors hover:bg-muted"
            >
              文字は{dark ? "白" : "黒"}向き
            </button>
          </div>
        </Section>

        {/* ── 濃さ ── */}
        <Section label={`装飾の濃さ　${Math.round(intensity * 100)}%`}>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.01}
            value={intensity}
            onChange={(e) => setIntensity(parseFloat(e.target.value))}
            className="w-full accent-violet-500"
            aria-label="装飾の濃さ"
          />
        </Section>

        {/* ── プレビューのフォント ── */}
        <Section label="プレビューのフォント（PowerPoint標準・左ほど定番）">
          <div className="flex gap-2 overflow-x-auto pb-1.5 -mx-1 px-1">
            {FONTS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFontKey(f.key)}
                className="flex-shrink-0 px-3.5 py-2.5 rounded-xl border-2 transition-colors whitespace-nowrap"
                style={{
                  borderColor: fontKey === f.key ? "#8b5cf6" : "var(--border)",
                  background: fontKey === f.key ? "rgba(139,92,246,0.08)" : "transparent",
                  fontFamily: f.stack,
                  color: fontKey === f.key ? "#7c3aed" : "var(--foreground)",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Section>

        {/* ── スライド枚数（PowerPoint） ── */}
        <Section label="PowerPointのスライド枚数">
          <div className="flex gap-2 flex-wrap items-center">
            {SLIDE_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSlideCount(n)}
                className="px-4 py-2 rounded-xl border-2 transition-colors font-bold text-sm"
                style={{
                  borderColor: slideCount === n ? "#8b5cf6" : "var(--border)",
                  background: slideCount === n ? "rgba(139,92,246,0.08)" : "transparent",
                  color: slideCount === n ? "#7c3aed" : "var(--foreground)",
                  fontFamily: "'M PLUS Rounded 1c', sans-serif",
                }}
              >
                {n}枚
              </button>
            ))}
            <span className="text-xs text-muted-foreground ml-1">または</span>
            <input
              type="number"
              min={1}
              max={MAX_SLIDES}
              value={slideCount}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setSlideCount(Number.isNaN(v) ? 1 : Math.min(MAX_SLIDES, Math.max(1, v)));
              }}
              className="w-16 h-9 rounded-lg border-2 px-2 text-sm text-center bg-transparent"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              aria-label="スライド枚数を入力"
            />
            <span className="text-xs text-muted-foreground">枚（最大{MAX_SLIDES}）</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            PNG画像は常に1枚。PowerPointは指定枚数ぶん、同じ背景のスライドを作成します。
          </p>
        </Section>

        {/* ── 文字プレビュー ── */}
        <button
          type="button"
          onClick={() => setShowText((v) => !v)}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground self-start"
        >
          <Type className="w-4 h-4" />
          文字プレビュー：{showText ? "ON" : "OFF"}
        </button>

        {/* ── 使い方（テキストコンテンツ＝SEO/可読性） ── */}
        <div className="mt-2 rounded-2xl bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
          <p className="font-bold text-foreground mb-2">使い方</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>スライドの比率（16:9 / 4:3）とスタイル・配色を選ぶ</li>
            <li>
              <strong className="text-foreground">PowerPoint</strong> を押すと、背景を設定済みの .pptx ファイルが保存される
              → ファイルを開いてそのまま編集できます（設定作業ゼロ）
            </li>
            <li>
              画像で欲しいときは <strong className="text-foreground">PNG画像</strong>。
              Googleスライドなら〔背景 → 画像を選択〕、Keynoteなら背景にドラッグで使えます
            </li>
          </ol>
          <p className="mt-3 text-xs">
            生成した背景はすべてこのツール内で作られたオリジナルです。商用・私用問わず自由に使えます（クレジット表記も不要）。
          </p>
        </div>
      </div>
    </ToolLayout>
  );
}

// ─── Sub components ───────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-black tracking-wide text-muted-foreground" style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif" }}>
        {label}
      </span>
      {children}
    </div>
  );
}

/** スタイルボタン用のミニプレビュー（24x24相当のcanvas） */
function StylePreview({ styleKey, base, accent }: { styleKey: Style; base: string; accent: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = 56;
    c.height = 36;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    drawBackground(ctx, 56, 36, { style: styleKey, base, accent, intensity: 0.9 });
  }, [styleKey, base, accent]);
  return <canvas ref={ref} className="rounded-md ring-1 ring-black/5" style={{ width: 40, height: 26 }} />;
}
