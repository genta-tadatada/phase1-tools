"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Download, Shuffle, Type, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { DarkModeToggle } from "@/components/tool-layout/DarkModeToggle";
import {
  type AspectKey,
  type Config,
  ASPECTS,
  SLIDE_COUNTS,
  MAX_SLIDES,
  fontStackOf,
  fontLabelOf,
  drawBackground,
  exportPng,
  exportPptx,
} from "@/lib/slideEngine";
import {
  type CategoryKey,
  type Preset,
  CATEGORIES,
  PRESETS,
  presetsByCategory,
} from "@/lib/slidePresets";

const PREVIEW_W = 1024;
const ACCENT = "#8b5cf6";

export function PresetBgTool() {
  const [categoryKey, setCategoryKey] = useState<CategoryKey>("business");
  const [presetId, setPresetId] = useState<string>(PRESETS[0].id);
  const [aspectKey, setAspectKey] = useState<AspectKey>("16:9");
  const [showText, setShowText] = useState<boolean>(true);
  const [slideCount, setSlideCount] = useState<number>(1);
  const [exporting, setExporting] = useState<"png" | "pptx" | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const preset = useMemo(
    () => PRESETS.find((p) => p.id === presetId) ?? PRESETS[0],
    [presetId]
  );
  const aspect = ASPECTS.find((a) => a.key === aspectKey)!;
  const cfg: Config = { style: preset.style, base: preset.base, c1: preset.c1, c2: preset.c2, intensity: preset.intensity };
  const fontStack = fontStackOf(preset.font);
  const fontLabel = fontLabelOf(preset.font);
  const galleryPresets = useMemo(() => presetsByCategory(categoryKey), [categoryKey]);

  // カテゴリ切替時、そのカテゴリの先頭プリセットを自動選択
  function selectCategory(key: CategoryKey) {
    setCategoryKey(key);
    const first = presetsByCategory(key)[0];
    if (first) setPresetId(first.id);
  }

  // 大プレビュー再描画
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
  }, [aspectKey, preset, aspect.h, aspect.w]);

  // おまかせ：全プリセットからランダム
  const randomize = useCallback(() => {
    const p = PRESETS[Math.floor(Math.random() * PRESETS.length)];
    setCategoryKey(p.category);
    setPresetId(p.id);
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
          slideCount > 1
            ? `PowerPoint（${slideCount}枚）を保存しました`
            : "PowerPointファイルを保存しました"
        )
      )
      .catch(() => toast.error("PowerPointの作成に失敗しました"))
      .finally(() => setExporting(null));
  }, [cfg, aspect, aspectKey, slideCount]);

  const currentCat = CATEGORIES.find((c) => c.key === categoryKey)!;

  return (
    <ToolLayout title="プリセット背景ギャラリー">
      <div className="flex flex-col gap-5">
        {/* ヘッダー行（ダークモード） */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            用途を選ぶだけ。完成済みのプロ品質の背景を、合うフォントごとそのまま保存。
          </p>
          <DarkModeToggle />
        </div>

        {/* ── 大プレビュー（選択中のプリセット） ── */}
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
                    color: preset.dark ? "#ffffff" : "#1f2024",
                    fontSize: "clamp(22px, 6.5vw, 48px)",
                    lineHeight: 1.25,
                    textShadow: preset.dark ? "0 1px 12px rgba(0,0,0,0.25)" : "none",
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
            {/* プリセット名＋推奨フォント */}
            <span
              className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{ background: "rgba(0,0,0,0.42)", color: "#fff", fontFamily: "'M PLUS Rounded 1c', sans-serif" }}
            >
              {preset.name}
              <span className="opacity-70">|</span>
              <span style={{ fontFamily: fontStack }}>Aa {fontLabel}</span>
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
            おまかせで1枚
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

        {/* ── カテゴリタブ ── */}
        <Section label="用途・雰囲気で選ぶ">
          <div className="flex gap-2 overflow-x-auto pb-1.5 -mx-1 px-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => selectCategory(c.key)}
                className="flex-shrink-0 px-3.5 py-2 rounded-xl border-2 transition-colors whitespace-nowrap"
                style={{
                  borderColor: categoryKey === c.key ? ACCENT : "var(--border)",
                  background: categoryKey === c.key ? "rgba(139,92,246,0.08)" : "transparent",
                }}
              >
                <span
                  className="text-[13px] font-bold"
                  style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", color: categoryKey === c.key ? "#7c3aed" : "var(--foreground)" }}
                >
                  {c.label}
                </span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground -mt-0.5">{currentCat.desc}</p>
        </Section>

        {/* ── プリセットギャラリー ── */}
        <div className="grid grid-cols-2 gap-3">
          {galleryPresets.map((p) => (
            <PresetCard
              key={p.id}
              preset={p}
              selected={p.id === presetId}
              onSelect={() => setPresetId(p.id)}
            />
          ))}
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
                  borderColor: aspectKey === a.key ? ACCENT : "var(--border)",
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
                  borderColor: slideCount === n ? ACCENT : "var(--border)",
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
            <li>用途（ビジネス・学校発表・和風…）を選ぶ</li>
            <li>気に入った背景を1枚タップ。<strong className="text-foreground">大プレビューに「合うフォント名」</strong>が表示されます（そのフォントを自分のスライドで使うと統一感が出ます）</li>
            <li>
              <strong className="text-foreground">PowerPoint</strong> を押すと背景設定済みの .pptx が、
              <strong className="text-foreground">PNG画像</strong> なら原寸画像が保存されます
            </li>
          </ol>
          <p className="mt-3 text-xs">
            背景はすべてこのツール内で作られたオリジナルです。商用・私用問わず自由に使えます（クレジット表記も不要）。
            フォントはPowerPoint標準搭載のものだけを推奨しているため、他のPCで開いても崩れません。
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

/** プリセットカード：背景ミニプレビュー＋名前＋推奨フォント */
function PresetCard({ preset, selected, onSelect }: { preset: Preset; selected: boolean; onSelect: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = 320;
    c.height = 180;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    drawBackground(ctx, 320, 180, { style: preset.style, base: preset.base, c1: preset.c1, c2: preset.c2, intensity: preset.intensity });
  }, [preset]);

  const fontStack = fontStackOf(preset.font);
  const fontLabel = fontLabelOf(preset.font);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col rounded-2xl border-2 overflow-hidden transition-all text-left"
      style={{
        borderColor: selected ? ACCENT : "var(--border)",
        boxShadow: selected ? "0 6px 18px -8px rgba(139,92,246,0.55)" : "none",
      }}
    >
      <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
        <canvas ref={ref} className="block w-full h-full" />
        {/* カード内ミニサンプル文字（推奨フォント体感用） */}
        <span
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          style={{
            fontFamily: fontStack,
            fontWeight: 900,
            color: preset.dark ? "#ffffff" : "#1f2024",
            fontSize: "clamp(13px, 4vw, 20px)",
            textShadow: preset.dark ? "0 1px 8px rgba(0,0,0,0.3)" : "none",
          }}
        >
          Aa あ
        </span>
      </div>
      <div className="flex flex-col gap-0.5 px-2.5 py-2 bg-card">
        <span
          className="text-[12px] font-bold leading-tight"
          style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", color: selected ? "#7c3aed" : "var(--foreground)" }}
        >
          {preset.name}
        </span>
        <span className="text-[10px] text-muted-foreground leading-tight" style={{ fontFamily: fontStack }}>
          {fontLabel}
        </span>
      </div>
    </button>
  );
}
