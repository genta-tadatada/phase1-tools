"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Trash2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "phase1-word-count-v2";

// ---- 絵文字カウント ----
function countEmoji(text: string): number {
  return (text.match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu) ?? []).length;
}

// ---- コードポイント単位の文字数（絵文字=1文字） ----
function cpLength(text: string): number {
  return [...text].length;
}

// ---- CJK 判定 ----
function isHeavyChar(code: number): boolean {
  return (
    (code >= 0x1100 && code <= 0x115F) ||
    (code >= 0x2E80 && code <= 0x303F) ||
    (code >= 0x3000 && code <= 0x303F) ||
    (code >= 0x3040 && code <= 0x33FF) ||
    (code >= 0x3400 && code <= 0x4DBF) ||
    (code >= 0x4E00 && code <= 0x9FFF) ||
    (code >= 0xA960 && code <= 0xA97F) ||
    (code >= 0xAC00 && code <= 0xD7FF) ||
    (code >= 0xF900 && code <= 0xFAFF) ||
    (code >= 0xFE10 && code <= 0xFE1F) ||
    (code >= 0xFE30 && code <= 0xFE4F) ||
    (code >= 0xFF01 && code <= 0xFF60) ||
    (code >= 0x1B000 && code <= 0x1B0FF) ||
    (code >= 0x20000 && code <= 0x2A6DF) ||
    (code >= 0x2600  && code <= 0x27BF)  || // 記号・絵文字（全角扱い）
    (code >= 0x1F000 && code <= 0x1FFFF)    // 絵文字ブロック（全角扱い）
  );
}

function calcXWeighted(text: string): number {
  let n = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    n += isHeavyChar(code) ? 2 : 1;
  }
  return n;
}

// ---- カウント計算 ----
interface CountResult {
  total: number;
  noSpace: number;
  noNewline: number;
  lines: number;
  paragraphs: number;
  bytes: number;
  xWeighted: number;
  emoji: number;
}

function calcCount(text: string): CountResult {
  return {
    total:      cpLength(text),
    noSpace:    text.replace(/[\s　]/g, "").length,
    noNewline:  text.replace(/\n/g, "").length,
    lines:      text === "" ? 0 : text.split("\n").length,
    paragraphs: text === "" ? 0 : text.split(/\n\s*\n/).filter((s) => s.trim()).length,
    bytes:      new TextEncoder().encode(text).length,
    xWeighted:  calcXWeighted(text),
    emoji:      countEmoji(text),
  };
}

// ---- プリセット定義 ----
const PRESETS = [
  { label: "X（140字）",     value: "140",  weighted: true  },
  { label: "Instagram",      value: "2200", weighted: false },
  { label: "YouTube概要欄",  value: "5000", weighted: false },
  { label: "1000字",         value: "1000", weighted: false },
  { label: "1600字",         value: "1600", weighted: false },
  { label: "2000字",         value: "2000", weighted: false },
] as const;

// ---- プログレスバーカラー ----
function barColor(pct: number) {
  if (pct > 100) return "bg-red-500";
  if (pct > 80)  return "bg-amber-400";
  return "bg-[var(--accent)]";
}

// ---- メインコンポーネント ----
export function WordCountTool() {
  const [text, setText]             = useState("");
  const [limitInput, setLimitInput] = useState(""); // 空 = 制限なし
  const [isWeighted, setIsWeighted] = useState(false);
  const [mounted, setMounted]       = useState(false);
  const [shared, setShared]         = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.text !== undefined)       setText(s.text);
        if (s.limitInput !== undefined) setLimitInput(s.limitInput);
        if (s.isWeighted !== undefined) setIsWeighted(s.isWeighted);
      }
    } catch { /* ignore */ }
  }, []);

  const save = useCallback((patch: object) => {
    try {
      const base = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...base, ...patch }));
    } catch { /* ignore */ }
  }, []);

  const handleTextChange = useCallback((val: string) => {
    setText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save({ text: val }), 300);
  }, [save]);

  const handleLimitChange = (val: string, weighted = false) => {
    // 数字のみ許可
    const clean = val.replace(/[^\d]/g, "");
    setLimitInput(clean);
    setIsWeighted(weighted);
    if (mounted) save({ limitInput: clean, isWeighted: weighted });
  };

  const count = useMemo(() => calcCount(text), [text]);

  const effectiveLimit   = limitInput ? parseInt(limitInput) || null : null;
  // weighted: 全角=1, 半角=0.5（xWeighted÷2）/ 通常: 全文字=1
  const effectiveCount   = isWeighted ? count.xWeighted / 2 : count.total;
  const pct              = effectiveLimit ? Math.round((effectiveCount / effectiveLimit) * 100) : 0;
  const remaining        = effectiveLimit !== null ? effectiveLimit - effectiveCount : null;
  const isOver           = remaining !== null && remaining < 0;
  const fmtCount = (v: number) => Number.isInteger(v) ? v.toLocaleString("ja-JP") : v.toFixed(1);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); toast.success("コピーしました"); }
    catch { toast.error("コピーに失敗しました"); }
  };

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 1500);
      toast("共有URLをコピーしました");
    } catch { toast.error("コピーに失敗しました"); }
  }, []);

  const handleClear = () => {
    if (text === "") return;
    setText("");
    save({ text: "" });
  };

  interface CountRow { label: string; value: number; format?: (v: number) => string; }
  const countRows: CountRow[] = [
    { label: "総文字数",            value: count.total },
    { label: "スペース除き",        value: count.noSpace },
    { label: "改行除き",            value: count.noNewline },
    { label: "行数",                value: count.lines },
    { label: "原稿用紙（400字）",   value: count.total / 400, format: (v) => v === 0 ? "0 枚" : v.toFixed(1) + " 枚" },
    { label: "半角0.5換算",         value: count.xWeighted / 2, format: fmtCount },
    { label: "絵文字",              value: count.emoji },
    { label: "段落数",              value: count.paragraphs },
    { label: "バイト数（UTF-8）",   value: count.bytes },
  ];

  return (
    <ToolLayout title="文字数カウンター">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="md:grid md:grid-cols-[1fr_280px] md:gap-6"
      >
        {/* 左カラム：テキストエリア */}
        <div className="flex flex-col gap-3">
          <textarea
            aria-label="テキスト入力エリア"
            className={`w-full min-h-[40vh] md:min-h-[50vh] resize-y rounded-xl border-2 bg-card p-4 text-base font-sans focus:outline-none focus:ring-2 placeholder:text-muted-foreground transition-colors duration-200 ${
              isOver
                ? "border-red-500 focus:ring-red-500/50"
                : "border-border focus:ring-accent/50"
            }`}
            style={{ fontSize: "16px" }}
            placeholder="ここにテキストを貼り付けてください..."
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              <Copy className="size-3.5" /> コピー
            </Button>
            <Button
              variant="ghost" size="sm" onClick={handleClear}
              className="gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" /> クリア
            </Button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted ml-auto"
            >
              <Link2 className="size-3" />
              {shared ? "コピー済" : "共有"}
            </button>
          </div>
        </div>

        {/* 右カラム */}
        <div className="mt-4 md:mt-0 md:sticky md:top-16 self-start flex flex-col gap-4">

          {/* 文字数制限カード（常に同じUI） */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">

            {/* 制限入力 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">文字数制限</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="制限なし"
                value={limitInput}
                onChange={(e) => handleLimitChange(e.target.value, isWeighted)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>

            {/* クイック選択チップ */}
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => {
                const active = limitInput === p.value && isWeighted === p.weighted;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleLimitChange(p.value, p.weighted)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors duration-150 ${
                      active
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground border-border hover:border-accent"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
              {limitInput && (
                <button
                  type="button"
                  onClick={() => handleLimitChange("", false)}
                  className="px-2.5 py-1 rounded-full text-xs font-bold border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors duration-150"
                >
                  クリア
                </button>
              )}
            </div>

            {/* プログレスバー（常に表示） */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                {effectiveLimit !== null ? (
                  <>
                    <span className={isOver ? "text-red-500 font-medium" : "text-muted-foreground"}>
                      {isOver
                        ? `${fmtCount(Math.abs(remaining!))} 文字超過`
                        : `残り ${fmtCount(remaining!)} 文字`}
                    </span>
                    <span className="tabular-nums font-medium">{effectiveCount}/{effectiveLimit}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground text-xs">制限を入力するとカウントされます</span>
                )}
              </div>
              <div
                role="progressbar"
                aria-valuenow={effectiveCount}
                aria-valuemax={effectiveLimit ?? 100}
                aria-label="文字数制限バー"
                className="h-2 w-full rounded-full bg-muted overflow-hidden"
              >
                {effectiveLimit !== null && (
                  <div
                    className={`h-full rounded-full transition-all duration-200 ease-out ${barColor(pct)}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* カウント結果 */}
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {countRows.map(({ label, value, format }) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className={`text-xl font-bold tabular-nums ${value === 0 ? "text-muted-foreground" : "text-foreground"}`}>
                  {format ? format(value) : value.toLocaleString("ja-JP")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </ToolLayout>
  );
}
