"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Check } from "lucide-react";
import { toast } from "sonner";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { decodeState, generateShareUrl } from "@/lib/share";

// ─── Types ───────────────────────────────────────────────────────────────────

type DupMode = "allow" | "once" | "pool";

interface SharePayload {
  min: number;
  max: number;
  count: number;
  dups: DupMode | boolean;
}

interface HistoryEntry {
  values: number[];
  timestamp: number;
}

interface RandomState {
  min: number;
  max: number;
  count: number;
  dupMode?: DupMode;
  allowDuplicates?: boolean; // legacy
  history: HistoryEntry[];
  poolRemaining?: number[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "phase1-random-state";
const MAX_HISTORY = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildPool(min: number, max: number): number[] {
  const pool: number[] = [];
  for (let i = min; i <= max; i++) pool.push(i);
  return pool;
}

function sampleWithDuplicates(min: number, max: number, count: number): number[] {
  return Array.from({ length: count }, () =>
    Math.floor(Math.random() * (max - min + 1)) + min
  );
}

function parseDupMode(raw: DupMode | boolean | undefined): DupMode {
  if (raw === true)  return "allow";
  if (raw === false) return "once";
  if (raw === "allow" || raw === "once" || raw === "pool") return raw;
  return "allow";
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
  const [min, setMinState] = useState(1);
  const [max, setMaxState] = useState(100);
  const [count, setCount] = useState(1);
  const [dupMode, setDupModeState] = useState<DupMode>("once");
  const [poolRemaining, setPoolRemaining] = useState<number[]>([]);
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

  // プール付きのセッター（min/maxが変わったらプールをリセット）
  const setMin = useCallback((val: number) => {
    setMinState(val);
    setDupModeState((mode) => {
      if (mode === "pool") setPoolRemaining(buildPool(val, max));
      return mode;
    });
  }, [max]);

  const setMax = useCallback((val: number) => {
    setMaxState(val);
    setDupModeState((mode) => {
      if (mode === "pool") setPoolRemaining(buildPool(min, val));
      return mode;
    });
  }, [min]);

  const setDupMode = useCallback((mode: DupMode) => {
    setDupModeState(mode);
    if (mode === "pool") {
      setMinState((mn) => {
        setMaxState((mx) => {
          setPoolRemaining(buildPool(mn, mx));
          return mx;
        });
        return mn;
      });
    }
  }, []);

  // Load from URL or localStorage
  useEffect(() => {
    setMounted(true);
    const param = new URLSearchParams(window.location.search).get("c");
    if (param) {
      const payload = decodeState<SharePayload>(param);
      if (payload) {
        setMinState(payload.min ?? 1);
        setMaxState(payload.max ?? 100);
        setCount(Math.min(10, Math.max(1, payload.count ?? 1)));
        setDupModeState(parseDupMode(payload.dups));
        return;
      }
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state: RandomState = JSON.parse(saved);
        const savedMin = state.min ?? 1;
        const savedMax = state.max ?? 100;
        setMinState(savedMin);
        setMaxState(savedMax);
        setCount(Math.min(10, Math.max(1, state.count ?? 1)));
        const mode = parseDupMode(state.dupMode ?? state.allowDuplicates);
        setDupModeState(mode);
        setHistory(state.history ?? []);
        if (mode === "pool") {
          setPoolRemaining(state.poolRemaining?.length
            ? state.poolRemaining
            : buildPool(savedMin, savedMax));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      const state: RandomState = { min, max, count, dupMode, history, poolRemaining };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [mounted, min, max, count, dupMode, history, poolRemaining]);

  // Validate
  const validate = useCallback((): string => {
    if (min > max) return "最小値は最大値より小さく設定してください";
    const range = max - min + 1;
    if ((dupMode === "once" || dupMode === "pool") && count > range)
      return `この範囲では${range}個までしか生成できません`;
    return "";
  }, [min, max, count, dupMode]);

  // Generate with rolling animation
  const generate = useCallback(() => {
    const errMsg = validate();
    if (errMsg) { setError(errMsg); return; }
    setError("");

    let finalValues: number[];
    let nextPool = poolRemaining;

    if (dupMode === "pool") {
      if (poolRemaining.length < count) {
        nextPool = buildPool(min, max);
        toast("プールをリセットしました（全数字使用済み）");
      }
      const shuffled = shuffle([...nextPool]);
      finalValues = shuffled.slice(0, count);
      nextPool = shuffled.slice(count);
      setPoolRemaining(nextPool);
    } else if (dupMode === "once") {
      finalValues = shuffle(buildPool(min, max)).slice(0, count);
    } else {
      finalValues = sampleWithDuplicates(min, max, count);
    }

    setRolling(true);
    rollingRef.current = true;

    const steps = 20;
    const intervals = Array.from({ length: steps }, (_, i) =>
      Math.round(50 + (i / steps) ** 2 * 150)
    );

    let step = 0;
    const runStep = () => {
      if (!rollingRef.current) return;
      if (step < steps) {
        setDisplayResults(sampleWithDuplicates(min, max, count));
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
  }, [min, max, count, dupMode, poolRemaining, validate]);

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
    const payload: SharePayload = { min, max, count, dups: dupMode };
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
  const totalRange = max > min ? max - min + 1 : 0;

  return (
    <ToolLayout title="ランダム数字" adVisible>
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

          {/* Count + 重複チップ（個数2以上・pool OFF時のみ） */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground w-12 shrink-0">個数</span>
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
            {count >= 2 && dupMode !== "pool" && (
              <div className="flex gap-1.5 ml-1">
                {([
                  { mode: "allow", label: "重複あり" },
                  { mode: "once",  label: "重複なし" },
                ] as const).map(({ mode, label }) => (
                  <button
                    key={mode}
                    onClick={() => setDupMode(mode)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                      dupMode === mode
                        ? "bg-foreground text-background border-foreground"
                        : "text-muted-foreground border-border hover:border-accent"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 出た番号を除外（独立トグル） */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">出た番号を除外</span>
              <button
                role="switch"
                aria-checked={dupMode === "pool"}
                onClick={() => setDupMode(dupMode === "pool" ? "once" : "pool")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  dupMode === "pool" ? "bg-accent" : "bg-muted border border-border"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  dupMode === "pool" ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
            {/* Pool status */}
            {dupMode === "pool" && !errMsg && totalRange > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
                <span>残り <span className="font-bold tabular-nums">{poolRemaining.length}</span> / {totalRange} 個</span>
                <button
                  onClick={() => {
                    setPoolRemaining(buildPool(min, max));
                    toast("プールをリセットしました");
                  }}
                  className="hover:text-foreground transition-colors ml-3"
                >
                  リセット
                </button>
              </div>
            )}
          </div>

          {/* Presets */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => applyPreset(1, 6)}
              className="h-8 px-3 rounded-md border border-border text-xs hover:bg-muted transition-colors">
              1〜6（サイコロ）
            </button>
            <button onClick={() => applyPreset(1, 10)}
              className="h-8 px-3 rounded-md border border-border text-xs hover:bg-muted transition-colors">
              1〜10
            </button>
            <button onClick={() => applyPreset(1, 100)}
              className="h-8 px-3 rounded-md border border-border text-xs hover:bg-muted transition-colors">
              1〜100
            </button>
          </div>

          {errMsg && <p className="text-sm text-destructive">{errMsg}</p>}
        </div>

        {/* Generate button */}
        <div className="flex gap-2">
          <button
            onClick={generate}
            disabled={!!errMsg || rolling}
            className="flex-1 h-14 rounded-xl text-xl font-bold transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}
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
            <p className="text-muted-foreground text-sm">「生成する」を押してください</p>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center">
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="flex-1 flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                <span>履歴（{history.length}件）</span>
                <span className="text-muted-foreground">{historyOpen ? "▲" : "▼"}</span>
              </button>
              <button
                onClick={() => setHistory([])}
                className="px-3 py-3 text-xs text-muted-foreground/60 hover:text-destructive transition-colors"
              >
                クリア
              </button>
            </div>
            {historyOpen && (
              <div className="divide-y divide-border">
                {history.map((entry, i) => (
                  <div key={i} className="px-4 py-2 flex items-center justify-between text-sm">
                    <span className="tabular-nums font-medium">{entry.values.join(", ")}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">{formatTime(entry.timestamp)}</span>
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
