"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Check } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { Button } from "@/components/ui/button";
import { decodeState, generateShareUrl } from "@/lib/share";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SharePayload {
  min: number;
  max: number;
  count: number;
  dups: boolean;
}

interface HistoryEntry {
  values: number[];
  timestamp: number;
}

interface RandomState {
  min: number;
  max: number;
  count: number;
  allowDuplicates: boolean;
  history: HistoryEntry[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "phase1-random-state";
const MAX_HISTORY = 10;

// Fisher-Yates shuffle for no-duplicates
function sampleNoDuplicates(min: number, max: number, count: number): number[] {
  const pool: number[] = [];
  for (let i = min; i <= max; i++) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function sampleWithDuplicates(min: number, max: number, count: number): number[] {
  return Array.from({ length: count }, () =>
    Math.floor(Math.random() * (max - min + 1)) + min
  );
}

function getFontSize(count: number): string {
  if (count === 1) return "text-9xl";
  if (count <= 2) return "text-7xl";
  if (count <= 3) return "text-6xl";
  if (count <= 5) return "text-5xl";
  return "text-3xl";
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RandomNumberTool() {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(1);
  const [allowDuplicates, setAllowDuplicates] = useState(true);
  const [results, setResults] = useState<number[]>([]);
  const [displayResults, setDisplayResults] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [resultKey, setResultKey] = useState(0);
  const [sortOrder, setSortOrder] = useState<"none" | "asc" | "desc">("none");

  const rollingRef = useRef(false);

  // Load from URL or localStorage
  useEffect(() => {
    setMounted(true);
    // Try URL params first
    const param = new URLSearchParams(window.location.search).get("c");
    if (param) {
      const payload = decodeState<SharePayload>(param);
      if (payload) {
        setMin(payload.min ?? 1);
        setMax(payload.max ?? 100);
        setCount(Math.min(10, Math.max(1, payload.count ?? 1)));
        setAllowDuplicates(payload.dups ?? true);
        return;
      }
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state: RandomState = JSON.parse(saved);
        setMin(state.min ?? 1);
        setMax(state.max ?? 100);
        setCount(Math.min(10, Math.max(1, state.count ?? 1)));
        setAllowDuplicates(state.allowDuplicates ?? true);
        setHistory(state.history ?? []);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      const state: RandomState = { min, max, count, allowDuplicates, history };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [mounted, min, max, count, allowDuplicates, history]);

  // Validate
  const validate = useCallback((): string => {
    if (min > max) return "最小値は最大値より小さく設定してください";
    const range = max - min + 1;
    if (!allowDuplicates && count > range)
      return `この範囲では${range}個までしか生成できません（重複なし）`;
    return "";
  }, [min, max, count, allowDuplicates]);

  // Generate with rolling animation
  const generate = useCallback(() => {
    const errMsg = validate();
    if (errMsg) {
      setError(errMsg);
      return;
    }
    setError("");

    const finalValues = allowDuplicates
      ? sampleWithDuplicates(min, max, count)
      : sampleNoDuplicates(min, max, count);

    setRolling(true);
    rollingRef.current = true;

    // Rolling animation: decrease interval over ~1200ms
    const steps = 20;
    const intervals = Array.from({ length: steps }, (_, i) =>
      Math.round(50 + (i / steps) ** 2 * 150)
    );

    let step = 0;
    const runStep = () => {
      if (!rollingRef.current) return;
      if (step < steps) {
        setDisplayResults(
          allowDuplicates
            ? sampleWithDuplicates(min, max, count)
            : Array.from({ length: count }, () =>
                Math.floor(Math.random() * (max - min + 1)) + min
              )
        );
        setTimeout(runStep, intervals[step]);
        step++;
      } else {
        setDisplayResults(finalValues);
        setResults(finalValues);
        setRolling(false);
        rollingRef.current = false;
        setResultKey((k) => k + 1);
        setSortOrder("none");
        setHistory((prev) => [
          { values: finalValues, timestamp: Date.now() },
          ...prev.slice(0, MAX_HISTORY - 1),
        ]);
      }
    };
    runStep();
  }, [min, max, count, allowDuplicates, validate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Enter" || e.code === "KeyR") {
        e.preventDefault();
        generate();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      rollingRef.current = false;
    };
  }, [generate]);

  const handleShare = async () => {
    const payload: SharePayload = { min, max, count, dups: allowDuplicates };
    const url = generateShareUrl(payload);
    await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 1500);
  };

  const handleCopy = async () => {
    if (results.length === 0) return;
    await navigator.clipboard.writeText(results.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const applyPreset = (newMin: number, newMax: number) => {
    setMin(newMin);
    setMax(newMax);
    setCount(1);
  };

  const sortedResults = useMemo(() => {
    if (rolling || results.length === 0) return displayResults;
    if (sortOrder === "asc") return [...results].sort((a, b) => a - b);
    if (sortOrder === "desc") return [...results].sort((a, b) => b - a);
    return results;
  }, [rolling, results, displayResults, sortOrder]);

  if (!mounted) return null;

  const errMsg = validate();

  return (
    <ToolLayout title="ランダム数字" adVisible={!rolling}>
      <div className="flex flex-col gap-6">
        {/* Settings */}
        <div className="rounded-xl border border-border bg-card shadow-sm p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">最小値</span>
              <input
                type="number"
                value={min}
                onChange={(e) => setMin(Number(e.target.value))}
                className="h-9 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 tabular-nums"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">最大値</span>
              <input
                type="number"
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
                className="h-9 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 tabular-nums"
              />
            </label>
          </div>

          {/* Count */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-12">個数</span>
            <button
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              className="w-8 h-8 rounded-md border border-border bg-card flex items-center justify-center text-sm hover:bg-muted transition-colors"
            >
              −
            </button>
            <span className="w-6 text-center font-medium tabular-nums">{count}</span>
            <button
              onClick={() => setCount((c) => Math.min(10, c + 1))}
              className="w-8 h-8 rounded-md border border-border bg-card flex items-center justify-center text-sm hover:bg-muted transition-colors"
            >
              ＋
            </button>
          </div>

          {/* Duplicates toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-12">重複</span>
            <button
              onClick={() => setAllowDuplicates(!allowDuplicates)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                allowDuplicates
                  ? "bg-accent"
                  : "bg-muted border border-border"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                  allowDuplicates ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm text-muted-foreground">
              {allowDuplicates ? "あり" : "なし"}
            </span>
          </div>

          {/* Presets */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => applyPreset(1, 6)}
              className="h-8 px-3 rounded-md border border-border text-xs hover:bg-muted transition-colors"
            >
              1〜6（サイコロ）
            </button>
            <button
              onClick={() => applyPreset(1, 10)}
              className="h-8 px-3 rounded-md border border-border text-xs hover:bg-muted transition-colors"
            >
              1〜10
            </button>
            <button
              onClick={() => applyPreset(1, 100)}
              className="h-8 px-3 rounded-md border border-border text-xs hover:bg-muted transition-colors"
            >
              1〜100
            </button>
          </div>

          {/* Error */}
          {errMsg && (
            <p className="text-sm text-destructive">{errMsg}</p>
          )}
        </div>

        {/* Generate button */}
        <div className="flex gap-2">
          <button
            onClick={generate}
            disabled={!!errMsg || rolling}
            className="flex-1 h-14 rounded-xl text-xl font-bold transition-colors disabled:opacity-50"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--accent-foreground)",
            }}
          >
            {rolling ? "生成中..." : "生成する"}
          </button>
          <button
            onClick={handleShare}
            className="h-14 px-4 rounded-xl border border-border bg-card hover:bg-muted transition-colors flex items-center gap-1.5 text-sm text-muted-foreground"
            aria-label="設定をURLでシェア"
          >
            {shared ? <Check className="size-4 text-green-500" /> : <Share2 className="size-4" />}
          </button>
        </div>

        {/* Result display */}
        <div className="min-h-[200px] flex flex-col items-center justify-center rounded-xl bg-muted relative">
          {displayResults.length > 0 ? (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={rolling ? "rolling" : `result-${resultKey}`}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={
                    rolling
                      ? { duration: 0.05 }
                      : { type: "spring", stiffness: 300, damping: 20 }
                  }
                  className={`font-bold tabular-nums text-center px-4 ${getFontSize(sortedResults.length)} font-[var(--font-inter)]`}
                >
                  {sortedResults.join(", ")}
                </motion.div>
              </AnimatePresence>
              {!rolling && results.length > 0 && (
                <button
                  onClick={handleCopy}
                  className="absolute bottom-3 right-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? "✓ コピー済み" : "コピー"}
                </button>
              )}
              {!rolling && results.length > 1 && (
                <div className="absolute top-2 left-2 flex gap-1">
                  {(["none", "asc", "desc"] as const).map((order) => (
                    <button
                      key={order}
                      onClick={() => setSortOrder(order)}
                      className={`text-xs px-2 py-0.5 rounded-md border transition-colors ${
                        sortOrder === order
                          ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {order === "none" ? "生成順" : order === "asc" ? "昇順" : "降順"}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              「生成する」を押してください
            </p>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
            >
              <span>履歴（{history.length}件）</span>
              <span className="text-muted-foreground">{historyOpen ? "▲" : "▼"}</span>
            </button>
            {historyOpen && (
              <div className="divide-y divide-border">
                {history.map((entry, i) => (
                  <div
                    key={i}
                    className="px-4 py-2 flex items-center justify-between text-sm"
                  >
                    <span className="tabular-nums font-medium">
                      {entry.values.join(", ")}
                    </span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="relative flex justify-center">
          {showShortcuts && (
            <div className="absolute bottom-full mb-2 w-64 rounded-lg border border-border bg-background shadow-lg p-3 z-50 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-2">キーボードショートカット</p>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Enter / R</span><span>生成する</span></div>
              </div>
            </div>
          )}
          <button
            onClick={() => setShowShortcuts(v => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-border bg-card text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
            aria-label="キーボードショートカット"
          >?</button>
        </div>
      </div>
    </ToolLayout>
  );
}
