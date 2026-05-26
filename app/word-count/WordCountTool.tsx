"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { Button } from "@/components/ui/button";

// ---- SNS プリセット定義 ----
interface SnsPreset {
  id: string;
  name: string;
  limit: number | null;
  description?: string;
}

const SNS_PRESETS: SnsPreset[] = [
  { id: "none", name: "制限なし", limit: null },
  { id: "x-140", name: "X（140文字）", limit: 140, description: "日本語は2文字換算" },
  { id: "x-280", name: "X（280文字）", limit: 280 },
  { id: "instagram", name: "Instagram", limit: 2200 },
  { id: "youtube", name: "YouTube概要欄", limit: 5000 },
  { id: "custom", name: "カスタム", limit: null },
];

const STORAGE_KEY = "phase1-word-count-state";

// ---- カウント計算 ----
interface CountResult {
  total: number;
  noSpace: number;
  noNewline: number;
  lines: number;
  words: number;
  paragraphs: number;
  bytes: number;
}

function calcCount(text: string): CountResult {
  const total = text.length;
  const noSpace = text.replace(/[\s　]/g, "").length;
  const noNewline = text.replace(/\n/g, "").length;
  const lines = text === "" ? 0 : text.split("\n").length;
  const words =
    text.trim() === "" ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
  const paragraphs =
    text === "" ? 0 : text.split(/\n\s*\n/).filter((s) => s.trim()).length;
  const bytes = new TextEncoder().encode(text).length;
  return { total, noSpace, noNewline, lines, words, paragraphs, bytes };
}

// ---- プログレスバーカラー ----
function getBarColor(pct: number): string {
  if (pct > 100) return "bg-red-500";
  if (pct > 80) return "bg-amber-400";
  return "bg-[#0ea5e9]";
}

// ---- メインコンポーネント ----
export function WordCountTool() {
  const [text, setText] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState("none");
  const [customLimit, setCustomLimit] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // SSR対策：マウント後にlocalStorageから復元
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.text !== undefined) setText(parsed.text);
        if (parsed.selectedPresetId) setSelectedPresetId(parsed.selectedPresetId);
        if (parsed.customLimit !== undefined) setCustomLimit(parsed.customLimit);
      }
    } catch {
      // ignore
    }
  }, []);

  // テキスト変更時はdebounce保存
  const handleTextChange = useCallback((val: string) => {
    setText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const base = saved ? JSON.parse(saved) : {};
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...base, text: val })
        );
      } catch {
        // ignore
      }
    }, 300);
  }, []);

  // preset・customLimit 変更時は即時保存
  useEffect(() => {
    if (!mounted) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const base = saved ? JSON.parse(saved) : {};
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...base, selectedPresetId, customLimit })
      );
    } catch {
      // ignore
    }
  }, [selectedPresetId, customLimit, mounted]);

  const count = useMemo(() => calcCount(text), [text]);

  const effectiveLimit = useMemo<number | null>(() => {
    if (selectedPresetId === "custom") return customLimit;
    const preset = SNS_PRESETS.find((p) => p.id === selectedPresetId);
    return preset?.limit ?? null;
  }, [selectedPresetId, customLimit]);

  const pct = effectiveLimit ? Math.round((count.total / effectiveLimit) * 100) : 0;
  const remaining = effectiveLimit ? effectiveLimit - count.total : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("コピーしました");
    } catch {
      toast.error("コピーに失敗しました");
    }
  };

  const handleClear = () => {
    if (text === "") return;
    setText("");
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const base = saved ? JSON.parse(saved) : {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...base, text: "" }));
    } catch {
      // ignore
    }
  };

  const countRows: { label: string; value: number; key: keyof CountResult }[] = [
    { label: "総文字数", value: count.total, key: "total" },
    { label: "スペース除き", value: count.noSpace, key: "noSpace" },
    { label: "改行除き", value: count.noNewline, key: "noNewline" },
    { label: "行数", value: count.lines, key: "lines" },
    { label: "単語数（英語）", value: count.words, key: "words" },
    { label: "段落数", value: count.paragraphs, key: "paragraphs" },
    { label: "バイト数（UTF-8）", value: count.bytes, key: "bytes" },
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
            className="w-full min-h-[40vh] md:min-h-[50vh] resize-y rounded-xl border border-border bg-card p-4 text-base font-sans focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 placeholder:text-muted-foreground"
            style={{ fontSize: "16px" }}
            placeholder="ここにテキストを貼り付けてください..."
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              <Copy className="size-3.5" />
              コピー
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
              クリア
            </Button>
          </div>
        </div>

        {/* 右カラム：カウント結果 */}
        <div className="mt-4 md:mt-0 md:sticky md:top-16 self-start flex flex-col gap-4">
          {/* SNS制限選択 */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">SNS文字数制限</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50"
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
              >
                {SNS_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {selectedPresetId === "custom" && (
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50"
                  placeholder="文字数を入力"
                  value={customLimit ?? ""}
                  onChange={(e) =>
                    setCustomLimit(e.target.value ? Number(e.target.value) : null)
                  }
                />
              )}
            </div>

            {effectiveLimit !== null && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span className={remaining !== null && remaining < 0 ? "text-red-500 font-medium" : "text-muted-foreground"}>
                    {remaining !== null && remaining < 0
                      ? `${Math.abs(remaining)}文字超過`
                      : `残り ${remaining} 文字`}
                  </span>
                  <span className="tabular-nums font-medium">
                    {count.total}/{effectiveLimit}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={count.total}
                  aria-valuemax={effectiveLimit}
                  aria-label="文字数制限バー"
                  className="h-2 w-full rounded-full bg-muted overflow-hidden"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-200 ease-out ${getBarColor(pct)}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* カウント結果 */}
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {countRows.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span
                  className={`text-xl font-bold tabular-nums ${
                    value === 0 ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {value.toLocaleString("ja-JP")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </ToolLayout>
  );
}
