"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, RotateCcw, Share2, Play, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { toast } from "sonner";
import { decodeState, generateShareUrl } from "@/lib/share";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AmidaEntry {
  id: string;
  name: string;
  result: string;
}

type TraceSpeed = "slow" | "normal" | "fast";
type AmidaPhase = "setup" | "amida" | "tracing" | "revealed";

interface SharePayload {
  entries: { n: string; r: string }[];
  rows: boolean[][];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_PLAYERS = 8;
const MIN_PLAYERS = 2;
const STORAGE_KEY = "phase1-amida-settings";

const SPEED_MS: Record<TraceSpeed, number> = {
  slow: 300,
  normal: 150,
  fast: 60,
};

const PATH_COLORS = [
  "#f43f5e", "#8b5cf6", "#0ea5e9", "#10b981",
  "#f97316", "#d946ef", "#f59e0b", "#14b8a6",
];

// SVG layout
const COL_WIDTH = 80;
const SVG_PAD_TOP = 50;
const SVG_PAD_BOT = 50;
const ROW_HEIGHT = 28; // pixels per amida row

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try { return crypto.randomUUID(); } catch { /* fallback */ }
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateAmida(numPlayers: number): boolean[][] {
  const NUM_ROWS = Math.max(8, numPlayers * 2);
  const rows: boolean[][] = [];
  for (let row = 0; row < NUM_ROWS; row++) {
    const line: boolean[] = new Array(numPlayers - 1).fill(false);
    if (row < NUM_ROWS - 1) { // 最終行は横棒なし（底部をすっきり見せる）
      for (let col = 0; col < numPlayers - 1; col++) {
        if (col > 0 && line[col - 1]) continue;
        line[col] = Math.random() > 0.5;
      }
    }
    rows.push(line);
  }
  return rows;
}

function traceAmida(startCol: number, rows: boolean[][], numPlayers: number): { col: number; row: number }[] {
  const path: { col: number; row: number }[] = [{ col: startCol, row: 0 }];
  let currentCol = startCol;
  for (let row = 0; row < rows.length; row++) {
    let nextCol = currentCol;
    if (currentCol > 0 && rows[row][currentCol - 1]) {
      nextCol = currentCol - 1;
    } else if (currentCol < numPlayers - 1 && rows[row][currentCol]) {
      nextCol = currentCol + 1;
    }
    if (nextCol !== currentCol) {
      // 横棒の高さまで垂直に降りてから水平に移動（直角折れ線）
      path.push({ col: currentCol, row: row + 1 });
      currentCol = nextCol;
    }
    path.push({ col: currentCol, row: row + 1 });
  }
  return path;
}

function colToX(col: number, numPlayers: number): number {
  const totalW = numPlayers * COL_WIDTH;
  const startX = COL_WIDTH / 2;
  return startX + col * COL_WIDTH;
}

function rowToY(row: number): number {
  return SVG_PAD_TOP + row * ROW_HEIGHT;
}

// ─── AmidaSVG ─────────────────────────────────────────────────────────────────

interface AmidaSVGProps {
  entries: AmidaEntry[];
  rows: boolean[][];
  revealedCols: Set<number>;
  tracingCol: number | null;
  tracingStep: number;
  tracedPaths: { col: number; row: number }[][];
}

function AmidaSVG({ entries, rows, revealedCols, tracingCol, tracingStep, tracedPaths }: AmidaSVGProps) {
  const numPlayers = entries.length;
  const numRows = rows.length;
  const svgWidth = numPlayers * COL_WIDTH;
  const svgHeight = SVG_PAD_TOP + numRows * ROW_HEIGHT + SVG_PAD_BOT;

  // Compute all traced paths for revealed cols
  const revealedPaths = tracedPaths;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      width="100%"
      style={{ maxWidth: svgWidth, overflow: "visible" }}
      className="select-none"
    >
      {/* Names (top) */}
      {entries.map((entry, i) => (
        <text
          key={`name-${i}`}
          x={colToX(i, numPlayers)}
          y={20}
          textAnchor="middle"
          className="fill-foreground text-xs font-medium"
          fontSize={11}
          fontFamily="inherit"
        >
          {entry.name || `${i + 1}`}
        </text>
      ))}

      {/* Vertical lines */}
      {entries.map((_, i) => (
        <line
          key={`vline-${i}`}
          x1={colToX(i, numPlayers)}
          y1={SVG_PAD_TOP}
          x2={colToX(i, numPlayers)}
          y2={SVG_PAD_TOP + numRows * ROW_HEIGHT}
          stroke="currentColor"
          strokeWidth={2}
          className="text-zinc-700 dark:text-zinc-300"
          opacity={0.6}
        />
      ))}

      {/* Horizontal bars */}
      {rows.map((row, rowIdx) =>
        row.map((hasBar, colIdx) =>
          hasBar ? (
            <line
              key={`bar-${rowIdx}-${colIdx}`}
              x1={colToX(colIdx, numPlayers)}
              y1={rowToY(rowIdx + 1)}
              x2={colToX(colIdx + 1, numPlayers)}
              y2={rowToY(rowIdx + 1)}
              stroke="currentColor"
              strokeWidth={2}
              className="text-zinc-700 dark:text-zinc-300"
              opacity={0.6}
            />
          ) : null
        )
      )}

      {/* Revealed traced paths */}
      {revealedPaths.map((path, pathIdx) => {
        if (path.length < 2) return null;
        const colIdx = path[0].col;
        const isActive = tracingCol === colIdx;
        const isRevealed = revealedCols.has(colIdx);
        // トレース中 or 開示済みのパスのみ描画
        if (!isActive && !isRevealed) return null;

        const visiblePath = isActive ? path.slice(0, tracingStep + 1) : path;
        const pathColor = PATH_COLORS[colIdx % PATH_COLORS.length];
        // 別の人をトレース中は他のパスを薄く表示
        const opacity = (tracingCol !== null && !isActive) ? 0.25 : 0.9;

        const d = visiblePath
          .map((pt, i) => {
            const x = colToX(pt.col, numPlayers);
            const y = rowToY(pt.row);
            return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
          })
          .join(" ");

        return (
          <g key={`traced-${pathIdx}`}>
            <path
              d={d}
              fill="none"
              stroke={pathColor}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={opacity}
            />
            {/* Current position dot */}
            {isActive && tracingStep < path.length && (
              <circle
                cx={colToX(visiblePath[visiblePath.length - 1].col, numPlayers)}
                cy={rowToY(visiblePath[visiblePath.length - 1].row)}
                r={7}
                fill={pathColor}
                opacity={opacity}
              />
            )}
          </g>
        );
      })}

      {/* Results (bottom) - 各列jの到達点に結果を表示 */}
      {entries.map((_, j) => {
        // 列jに到達する人を探す
        const personIdx = tracedPaths.findIndex(
          (path) => path.length > 0 && path[path.length - 1].col === j
        );
        const isRevealed = personIdx !== -1 && revealedCols.has(personIdx);
        const resultText = isRevealed ? (entries[j].result || "?") : "?";
        return (
          <text
            key={`result-${j}`}
            x={colToX(j, numPlayers)}
            y={svgHeight - 8}
            textAnchor="middle"
            fontSize={11}
            fontFamily="inherit"
            fontWeight={isRevealed ? "bold" : "normal"}
            style={isRevealed ? { fill: "var(--accent)" } : { opacity: 0.4 }}
          >
            {resultText}
          </text>
        );
      })}
    </svg>
  );
}

// ─── AmidaTool (main) ─────────────────────────────────────────────────────────

export function AmidaTool() {
  const [entries, setEntries] = useState<AmidaEntry[]>([
    { id: genId(), name: "", result: "" },
    { id: genId(), name: "", result: "" },
    { id: genId(), name: "", result: "" },
  ]);
  const [rows, setRows] = useState<boolean[][]>([]);
  const [phase, setPhase] = useState<AmidaPhase>("setup");
  const [revealedCols, setRevealedCols] = useState<Set<number>>(new Set());
  const [tracingCol, setTracingCol] = useState<number | null>(null);
  const [tracingStep, setTracingStep] = useState(0);
  const [tracedPaths, setTracedPaths] = useState<{ col: number; row: number }[][]>([]);
  const [traceSpeed, setTraceSpeed] = useState<TraceSpeed>("normal");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mounted, setMounted] = useState(false);
  const traceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tracingColRef = useRef<number | null>(null);

  // tracingCol を ref に同期（startTrace のクロージャから最新値を参照するため）
  useEffect(() => { tracingColRef.current = tracingCol; }, [tracingCol]);

  // Load from URL or localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const param = new URLSearchParams(window.location.search).get("c");
    if (param) {
      const payload = decodeState<SharePayload>(param);
      if (payload) {
        setEntries(payload.entries.map((e) => ({ id: genId(), name: e.n, result: e.r })));
        setRows(payload.rows);
        // Compute all paths
        const paths = payload.entries.map((_, i) => traceAmida(i, payload.rows, payload.entries.length));
        setTracedPaths(paths);
        const allCols = new Set(payload.entries.map((_, i) => i));
        setRevealedCols(allCols);
        setPhase("revealed");
      }
    } else {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.traceSpeed) setTraceSpeed(saved.traceSpeed);
          if (saved.lastEntries && saved.lastEntries.length >= MIN_PLAYERS) {
            setEntries(saved.lastEntries.map((e: { name: string; result: string }) => ({
              id: genId(), name: e.name, result: e.result
            })));
          }
        }
      } catch { /* ignore */ }
    }
    setMounted(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        traceSpeed,
        lastEntries: entries.map((e) => ({ name: e.name, result: e.result })),
      }));
    } catch { /* ignore */ }
  }, [traceSpeed, entries, mounted]);

  const addEntry = useCallback(() => {
    setEntries((prev) => {
      if (prev.length >= MAX_PLAYERS) return prev;
      return [...prev, { id: genId(), name: "", result: "" }];
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => {
      if (prev.length <= MIN_PLAYERS) return prev;
      return prev.filter((e) => e.id !== id);
    });
  }, []);

  const updateEntry = useCallback((id: string, field: "name" | "result", value: string) => {
    setEntries((prev) => prev.map((e) => e.id !== id ? e : { ...e, [field]: value }));
  }, []);

  const applyTemplate = useCallback((type: "winlose" | "number") => {
    setEntries((prev) => prev.map((e, i) => ({
      ...e,
      result: type === "winlose"
        ? (i === 0 ? "当たり" : "はずれ")
        : `${i + 1}番`,
    })));
  }, []);

  const handleGenerate = useCallback(() => {
    const numPlayers = entries.length;
    const newRows = generateAmida(numPlayers);
    setRows(newRows);
    const paths = entries.map((_, i) => traceAmida(i, newRows, numPlayers));
    setTracedPaths(paths);
    setRevealedCols(new Set());
    setTracingCol(null);
    setTracingStep(0);
    setPhase("amida");
  }, [entries]);

  const handleRegenerate = useCallback(() => {
    const numPlayers = entries.length;
    const newRows = generateAmida(numPlayers);
    setRows(newRows);
    const paths = entries.map((_, i) => traceAmida(i, newRows, numPlayers));
    setTracedPaths(paths);
    setRevealedCols(new Set());
    setTracingCol(null);
    setTracingStep(0);
  }, [entries]);

  // Trace animation step
  const startTrace = useCallback((colIdx: number, onComplete?: () => void) => {
    if (tracingColRef.current !== null) return;
    const path = tracedPaths[colIdx];
    if (!path || path.length === 0) return;
    tracingColRef.current = colIdx;
    setTracingCol(colIdx);
    setTracingStep(0);
    setPhase("tracing");

    let step = 0;
    const tick = () => {
      step++;
      setTracingStep(step);
      if (step < path.length - 1) {
        traceTimerRef.current = setTimeout(tick, SPEED_MS[traceSpeed]);
      } else {
        // Done
        setRevealedCols((prev) => new Set([...prev, colIdx]));
        tracingColRef.current = null;
        setTracingCol(null);
        setPhase("amida");
        if (onComplete) setTimeout(onComplete, 300);
      }
    };
    traceTimerRef.current = setTimeout(tick, SPEED_MS[traceSpeed]);
  }, [tracedPaths, traceSpeed]);

  const handleRevealAll = useCallback(() => {
    if (tracingColRef.current !== null) return;
    const unrevealedCols = entries.map((_, i) => i).filter((i) => !revealedCols.has(i));
    if (unrevealedCols.length === 0) return;
    const traceSequentially = (idx: number) => {
      if (idx >= unrevealedCols.length) return;
      startTrace(unrevealedCols[idx], () => traceSequentially(idx + 1));
    };
    traceSequentially(0);
  }, [entries, revealedCols, startTrace]);

  const handleShare = useCallback(() => {
    const payload: SharePayload = {
      entries: entries.map((e) => ({ n: e.name, r: e.result })),
      rows,
    };
    const url = generateShareUrl(payload);
    navigator.clipboard.writeText(url).then(
      () => toast("共有URLをコピーしました"),
      () => toast("URLのコピーに失敗しました")
    );
  }, [entries, rows]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (traceTimerRef.current) clearTimeout(traceTimerRef.current); };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (phase === "setup" && e.key === "Enter") handleGenerate();
      if ((phase === "amida" || phase === "revealed") && e.key === " ") { e.preventDefault(); handleRevealAll(); }
      if ((phase === "amida" || phase === "revealed") && (e.key === "r" || e.key === "R")) handleRegenerate();
      if (phase === "amida" || phase === "revealed") {
        const num = parseInt(e.key);
        if (num >= 1 && num <= entries.length) startTrace(num - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, handleGenerate, handleRevealAll, handleRegenerate, entries.length, startTrace]);

  const validEntries = entries.filter((e) => e.name.trim().length > 0).length;
  const canGenerate = validEntries >= MIN_PLAYERS;

  return (
    <ToolLayout title="あみだくじ" adVisible>
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {phase === "setup" ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* ヘッダービジュアル */}
              <div className="relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 border border-violet-200/60 dark:border-violet-700/30">
                <img src="/uploads/kawaii-blob-lavender.svg" alt="" aria-hidden="true" className="absolute -right-6 -bottom-6 w-28 h-28 opacity-20 pointer-events-none select-none" />
                <img src="/assets/icon-amida.png" alt="" aria-hidden="true" className="w-16 h-16 object-contain flex-shrink-0 relative z-10" />
                <div className="relative z-10">
                  <p className="text-sm font-bold text-violet-700 dark:text-violet-300">あみだくじ</p>
                  <p className="text-xs text-violet-600/70 dark:text-violet-400/70 mt-0.5">参加者を入力してあみだを生成。一人ずつ線を辿ろう！</p>
                </div>
              </div>

              {/* Entry table */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">👥</span>
                  <span className="text-sm font-bold">参加者と結果を入力</span>
                </div>
                <div className="grid grid-cols-[1fr_1fr_32px] gap-2 text-xs text-muted-foreground px-1">
                  <span>参加者名</span><span>結果（任意）</span><span />
                </div>
                {entries.map((entry, i) => (
                  <div key={entry.id} className="grid grid-cols-[1fr_1fr_32px] gap-2 items-center">
                    <input
                      value={entry.name}
                      onChange={(e) => updateEntry(entry.id, "name", e.target.value)}
                      placeholder={`${i + 1}`}
                      className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      maxLength={10}
                    />
                    <input
                      value={entry.result}
                      onChange={(e) => updateEntry(entry.id, "result", e.target.value)}
                      placeholder="当たり"
                      className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      maxLength={10}
                    />
                    <button
                      onClick={() => removeEntry(entry.id)}
                      disabled={entries.length <= MIN_PLAYERS}
                      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
                {entries.length < MAX_PLAYERS && (
                  <Button variant="outline" size="sm" onClick={addEntry} className="gap-2 w-full">
                    <Plus className="size-3.5" />
                    参加者を追加
                  </Button>
                )}
              </div>

              {/* Templates */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">テンプレート:</span>
                {[
                  { key: "winlose" as const, label: "🎯 当たり / はずれ", grad: "from-rose-400 to-pink-400" },
                  { key: "number"  as const, label: "🔢 1〜N番", grad: "from-sky-400 to-indigo-400" },
                ].map(({ key, label, grad }) => (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => applyTemplate(key)}
                    className={`text-xs rounded-full bg-gradient-to-r ${grad} text-white font-bold px-3.5 py-1.5 shadow-sm hover:shadow transition-all`}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>

              {/* Speed setting */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">⏱ 辿る速度:</span>
                {(["slow", "normal", "fast"] as TraceSpeed[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setTraceSpeed(s)}
                    className={`text-xs rounded-full border px-3 py-1 transition-all ${
                      traceSpeed === s
                        ? "bg-gradient-to-r from-violet-400 to-purple-400 text-white border-transparent shadow-sm"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {s === "slow" ? "遅い" : s === "normal" ? "普通" : "速い"}
                  </button>
                ))}
              </div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                disabled={!canGenerate}
                onClick={handleGenerate}
                className="w-full h-12 rounded-2xl text-sm font-bold bg-gradient-to-r from-violet-400 to-purple-400 text-white shadow-md disabled:opacity-40 flex items-center justify-center gap-2"
              >
                🎋 あみだくじを作る！
              </motion.button>
              {!canGenerate && (
                <p className="text-xs text-center text-muted-foreground">参加者名を{MIN_PLAYERS}人以上入力してください</p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="amida"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* SVG */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="overflow-x-auto"
              >
                <div className="min-w-0 mx-auto" style={{ maxWidth: entries.length * COL_WIDTH }}>
                  <AmidaSVG
                    entries={entries}
                    rows={rows}
                    revealedCols={revealedCols}
                    tracingCol={tracingCol}
                    tracingStep={tracingStep}
                    tracedPaths={tracedPaths}
                  />
                </div>
              </motion.div>

              {/* Instructions */}
              {tracingCol === null && revealedCols.size < entries.length && (
                <p className="text-xs text-center text-muted-foreground">
                  縦線の番号キー（1〜{entries.length}）を押すか、「全員分を見る」で辿れます
                </p>
              )}

              {/* Individual trace buttons */}
              {tracingCol === null && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {entries.map((entry, i) => {
                    const colors = [
                      "from-rose-400 to-pink-400", "from-violet-400 to-purple-400",
                      "from-sky-400 to-blue-400",  "from-emerald-400 to-teal-400",
                      "from-orange-400 to-amber-400","from-fuchsia-400 to-pink-400",
                      "from-amber-400 to-yellow-400","from-teal-400 to-cyan-400",
                    ];
                    const done = revealedCols.has(i);
                    return (
                      <motion.button
                        key={entry.id}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => startTrace(i)}
                        disabled={done || tracingCol !== null}
                        className={`text-xs rounded-full px-3 py-1 font-medium transition-all ${
                          done
                            ? "opacity-40 cursor-not-allowed bg-muted border border-border"
                            : `bg-gradient-to-r ${colors[i % colors.length]} text-white shadow-sm hover:shadow`
                        }`}
                      >
                        {i + 1}. {entry.name || `${i + 1}`}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Main actions */}
              <div className="flex flex-wrap gap-2">
                {revealedCols.size < entries.length && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className="h-9 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-400 to-purple-400 text-white shadow-sm flex items-center gap-2 disabled:opacity-50"
                    onClick={handleRevealAll}
                    disabled={tracingCol !== null}
                  >
                    <Eye className="size-4" />
                    全員分を見る
                  </motion.button>
                )}
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={tracingCol !== null}
                  className="gap-2"
                >
                  <RotateCcw className="size-4" />
                  やり直し
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setPhase("setup"); setRevealedCols(new Set()); setTracingCol(null); }}
                  disabled={tracingCol !== null}
                  className="gap-2"
                >
                  設定に戻る
                </Button>
              </div>

              {/* Share */}
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                <Share2 className="size-3.5" />
                URLシェア（同じあみだを共有）
              </Button>

              {/* Keyboard hints */}
              <div className="relative flex">
                {showShortcuts && (
                  <div className="absolute bottom-full mb-2 w-64 rounded-lg border border-border bg-background shadow-lg p-3 z-50 text-xs text-muted-foreground text-left">
                    <p className="font-semibold text-foreground mb-2">キーボードショートカット</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span>Enter</span><span>あみだ生成（設定画面）</span></div>
                      <div className="flex justify-between"><span>Space</span><span>全員分を見る</span></div>
                      <div className="flex justify-between"><span>R</span><span>やり直し</span></div>
                      <div className="flex justify-between"><span>1〜{entries.length}</span><span>対応する線を辿る</span></div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setShowShortcuts(v => !v)}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-border bg-card text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
                  aria-label="キーボードショートカット"
                >?</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolLayout>
  );
}
