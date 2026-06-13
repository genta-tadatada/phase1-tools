"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Download, Shuffle, Type, Palette as PaletteIcon, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { DarkModeToggle } from "@/components/tool-layout/DarkModeToggle";
import {
  type Style,
  type AspectKey,
  type Config,
  type Palette,
  ASPECTS,
  STYLES,
  STYLE_ADJUST,
  FONTS,
  PALETTES,
  SLIDE_COUNTS,
  MAX_SLIDES,
  sortPalettesForStyle,
  fontStackOf,
  drawBackground,
  exportPng,
  exportPptx,
} from "@/lib/slideEngine";

const PREVIEW_W = 1024;

export function SlideBgTool() {
  const [aspectKey, setAspectKey] = useState<AspectKey>("16:9");
  const [style, setStyle] = useState<Style>("blobs");
  const [paletteKey, setPaletteKey] = useState<string>(PALETTES[0].key);
  const [base, setBase] = useState<string>(PALETTES[0].base);
  const [c1, setC1] = useState<string>(PALETTES[0].c1);
  const [c2, setC2] = useState<string>(PALETTES[0].c2);
  const [dark, setDark] = useState<boolean>(false);
  const [intensity, setIntensity] = useState<number>(0.5);
  const [showText, setShowText] = useState<boolean>(true);
  const [exporting, setExporting] = useState<"png" | "pptx" | null>(null);
  const [fontKey, setFontKey] = useState<string>("meiryo");
  const [slideCount, setSlideCount] = useState<number>(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aspect = ASPECTS.find((a) => a.key === aspectKey)!;
  const fontStack = fontStackOf(fontKey);
  const cfg: Config = { style, base, c1, c2, intensity };
  // 選択スタイルの雰囲気(cute/premium)に合わせて配色の並び順を変える
  const palettes = sortPalettesForStyle(style);

  function applyPalette(p: Palette) {
    setPaletteKey(p.key);
    setBase(p.base);
    setC1(p.c1);
    setC2(p.c2);
    setDark(p.dark);
  }

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
  }, [aspectKey, style, base, c1, c2, intensity, aspect.h, aspect.w]);

  const randomize = useCallback(() => {
    const p = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    const pickable = STYLES.filter((s) => s.key !== "solid");
    const s = pickable[Math.floor(Math.random() * pickable.length)].key;
    applyPalette(p);
    setStyle(s);
    setIntensity(0.5); // スライダーはランダムにせず初期中央に戻す
  }, []);

  const downloadPng = useCallback(() => {
    setExporting("png");
    exportPng(cfg, aspect, `ただただ-背景-${aspectKey.replace(":", "x")}.png`)
      .then(() => toast.success(`PNG画像を保存しました（${aspect.w}×${aspect.h}）`))
      .catch(() => toast.error("画像の作成に失敗しました"))
      .finally(() => setExporting(null));
  }, [cfg, aspect, aspectKey]);

  const downloadPptx = useCallback(() => {
    setExporting("pptx");
    exportPptx(cfg, aspect, slideCount, `ただただ-スライド-${aspectKey.replace(":", "x")}.pptx`)
      .then(() =>
        toast.success(
          slideCount > 1 ? `PowerPoint（${slideCount}枚）を保存しました` : "PowerPointファイルを保存しました"
        )
      )
      .catch(() => toast.error("PowerPointの作成に失敗しました"))
      .finally(() => setExporting(null));
  }, [cfg, aspect, aspectKey, slideCount]);

  return (
    <ToolLayout title="プレゼン背景メーカー">
      <div className="flex flex-col gap-5">
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
            <span
              className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
              style={{ background: "rgba(0,0,0,0.42)", color: "#fff", fontFamily: "Quicksand, sans-serif" }}
            >
              {aspect.w} × {aspect.h}px
            </span>
          </div>
        </div>

        {/* ── 主操作 ── */}
        <div className="flex flex-col gap-2.5">
          <Button variant="outline" onClick={randomize} disabled={exporting !== null} className="w-full h-11 gap-2 rounded-xl font-bold">
            <Shuffle className="w-4 h-4" />
            おまかせ
          </Button>
          <div className="flex gap-2.5">
            <Button variant="outline" onClick={downloadPng} disabled={exporting !== null} className="flex-1 h-12 gap-2 rounded-xl font-bold">
              <Download className="w-4 h-4" />
              {exporting === "png" ? "保存中…" : "PNG画像"}
            </Button>
            <Button onClick={downloadPptx} disabled={exporting !== null} className="flex-1 h-12 gap-2 rounded-xl font-bold">
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

        {/* ── スタイル（折り返しグリッド・全部見える） ── */}
        <Section label="スタイル">
          <div className="grid grid-cols-5 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStyle(s.key)}
                className="flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-colors"
                style={{
                  borderColor: style === s.key ? "#8b5cf6" : "var(--border)",
                  background: style === s.key ? "rgba(139,92,246,0.08)" : "transparent",
                }}
              >
                <StylePreview styleKey={s.key} base={base} c1={c1} c2={c2} />
                <span className="text-[11px] font-bold" style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", color: style === s.key ? "#7c3aed" : "var(--muted-foreground)" }}>
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </Section>

        {/* ── 配色（スタイルの系統に合わせて並び替わる・折り返しグリッド） ── */}
        <Section label="配色">
          <div className="grid grid-cols-3 gap-2">
            {palettes.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPalette(p)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 border-2 transition-colors"
                style={{
                  borderColor: paletteKey === p.key ? "#8b5cf6" : "var(--border)",
                  background: paletteKey === p.key ? "rgba(139,92,246,0.08)" : "transparent",
                }}
              >
                <span className="flex rounded-md overflow-hidden ring-1 ring-black/5 flex-shrink-0" style={{ width: 36, height: 24 }}>
                  <span style={{ flex: 3, background: p.base }} />
                  <span style={{ flex: 2, background: p.c1 }} />
                  <span style={{ flex: 2, background: p.c2 }} />
                </span>
                <span className="text-[11px] font-bold whitespace-nowrap" style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", color: paletteKey === p.key ? "#7c3aed" : "var(--muted-foreground)" }}>
                  {p.name}
                </span>
              </button>
            ))}
          </div>

          {/* カスタムカラー（3色） */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <PaletteIcon className="w-3.5 h-3.5" />
              カスタム
            </span>
            <ColorInput label="下地" value={base} onChange={(v) => { setBase(v); setPaletteKey("custom"); }} />
            <ColorInput label="主役" value={c1} onChange={(v) => { setC1(v); setPaletteKey("custom"); }} />
            <ColorInput label="差し色" value={c2} onChange={(v) => { setC2(v); setPaletteKey("custom"); }} />
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="ml-auto text-xs font-bold px-3 py-1.5 rounded-full border border-border transition-colors hover:bg-muted"
            >
              文字は{dark ? "白" : "黒"}向き
            </button>
          </div>
        </Section>

        {/* ── スタイル別の調整スライダー（選んだスタイルで対象が変わる） ── */}
        <Section label={STYLE_ADJUST[style]}>
          <input type="range" min={0} max={1} step={0.01} value={intensity} onChange={(e) => setIntensity(parseFloat(e.target.value))} className="w-full accent-violet-500" aria-label={STYLE_ADJUST[style]} />
        </Section>

        {/* ── プレビューのフォント ── */}
        <Section label="プレビューのフォント">
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
                  fontFamily: f.stack, color: fontKey === f.key ? "#7c3aed" : "var(--foreground)", fontWeight: 700, fontSize: 15,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Section>

        {/* ── スライド枚数 ── */}
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
                  color: slideCount === n ? "#7c3aed" : "var(--foreground)", fontFamily: "'M PLUS Rounded 1c', sans-serif",
                }}
              >
                {n}枚
              </button>
            ))}
            <span className="text-xs text-muted-foreground ml-1">または</span>
            <input
              type="number" min={1} max={MAX_SLIDES} value={slideCount}
              onChange={(e) => { const v = parseInt(e.target.value, 10); setSlideCount(Number.isNaN(v) ? 1 : Math.min(MAX_SLIDES, Math.max(1, v))); }}
              className="w-16 h-9 rounded-lg border-2 px-2 text-sm text-center bg-transparent"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }} aria-label="スライド枚数を入力"
            />
            <span className="text-xs text-muted-foreground">枚（最大{MAX_SLIDES}）</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            PNG画像は常に1枚。PowerPointは指定枚数ぶん、同じ背景のスライドを作成します。
          </p>
        </Section>

        {/* ── 文字プレビュー（スイッチ） ── */}
        <div className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
            <Type className="w-4 h-4" />
            文字プレビュー
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={showText}
            aria-label="文字プレビューの表示切り替え"
            onClick={() => setShowText((v) => !v)}
            className="relative inline-flex items-center rounded-full transition-colors flex-shrink-0"
            style={{ width: 50, height: 28, background: showText ? "#8b5cf6" : "var(--border)" }}
          >
            <span
              className="absolute rounded-full bg-white shadow-sm transition-transform"
              style={{ width: 22, height: 22, top: 3, left: 3, transform: showText ? "translateX(22px)" : "translateX(0)" }}
            />
          </button>
        </div>

        {/* ── 使い方 ── */}
        <div className="mt-2 rounded-2xl bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
          <p className="font-bold text-foreground mb-2">使い方</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>スライドの比率（16:9 / 4:3）とスタイル・配色を選ぶ</li>
            <li><strong className="text-foreground">PowerPoint</strong> を押すと、背景を設定済みの .pptx ファイルが保存される → ファイルを開いてそのまま編集できます（設定作業ゼロ）</li>
            <li>画像で欲しいときは <strong className="text-foreground">PNG画像</strong>。Googleスライドなら〔背景 → 画像を選択〕、Keynoteなら背景にドラッグで使えます</li>
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

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded-md border border-border cursor-pointer bg-transparent p-0"
        aria-label={label}
      />
    </label>
  );
}

/** スタイルボタン用のミニプレビュー */
function StylePreview({ styleKey, base, c1, c2 }: { styleKey: Style; base: string; c1: string; c2: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = 56; c.height = 36;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    drawBackground(ctx, 56, 36, { style: styleKey, base, c1, c2, intensity: 0.5 });
  }, [styleKey, base, c1, c2]);
  return <canvas ref={ref} className="rounded-md ring-1 ring-black/5" style={{ width: 40, height: 26 }} />;
}
