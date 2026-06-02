"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, RotateCcw, Download, Play, Square, Flag,
  ChevronDown, ChevronUp, X, Pencil, Check, Maximize2, Copy, Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { DarkModeToggle } from "@/components/tool-layout/DarkModeToggle";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LapRecord {
  id: string;
  lapNumber: number;
  totalMs: number;
  lapMs: number;
  recordedAt: number;
}

interface Stopwatch {
  id: string;
  name: string;
  color: string;
  elapsedMs: number;
  startTime: number | null;
  isRunning: boolean;
  laps: LapRecord[];
}

interface UndoSwState {
  id: string;
  elapsedMs: number;
  laps: LapRecord[];
}

interface UndoSnapshot {
  type: "single" | "all";
  swId?: string;
  previousSwStates: UndoSwState[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_STOPWATCHES = 8;
const STORAGE_KEY = "phase1-stopwatch-settings";

const COLORS = [
  { value: "sky",     hex: "#0ea5e9", ring: "ring-sky-300/60 dark:ring-sky-700/40",         topLine: "bg-sky-500"     },
  { value: "violet",  hex: "#8b5cf6", ring: "ring-violet-300/60 dark:ring-violet-700/40",   topLine: "bg-violet-500"  },
  { value: "rose",    hex: "#f43f5e", ring: "ring-rose-300/60 dark:ring-rose-700/40",       topLine: "bg-rose-500"    },
  { value: "emerald", hex: "#10b981", ring: "ring-emerald-300/60 dark:ring-emerald-700/40", topLine: "bg-emerald-500" },
  { value: "orange",  hex: "#f97316", ring: "ring-orange-300/60 dark:ring-orange-700/40",   topLine: "bg-orange-500"  },
  { value: "yellow",  hex: "#eab308", ring: "ring-yellow-300/60 dark:ring-yellow-700/40",   topLine: "bg-yellow-500"  },
  { value: "zinc",    hex: "#a1a1aa", ring: "ring-zinc-300/60 dark:ring-zinc-700/40",       topLine: "bg-zinc-400"    },
  { value: "fuchsia", hex: "#d946ef", ring: "ring-fuchsia-300/60 dark:ring-fuchsia-700/40", topLine: "bg-fuchsia-500" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try { return crypto.randomUUID(); } catch { /* fallback */ }
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(ms: number): string {
  const cs = Math.floor(ms / 10) % 100;
  const s  = Math.floor(ms / 1000) % 60;
  const m  = Math.floor(ms / 60000) % 60;
  const h  = Math.floor(ms / 3600000);
  if (h > 0) {
    return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(cs).padStart(2,"0")}`;
  }
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(cs).padStart(2,"0")}`;
}

function getDisplayMs(sw: Stopwatch): number {
  if (!sw.isRunning || sw.startTime === null) return sw.elapsedMs;
  return sw.elapsedMs + (Date.now() - sw.startTime);
}

function getColor(colorValue: string) {
  return COLORS.find((c) => c.value === colorValue) ?? COLORS[0];
}

function createStopwatch(index: number): Stopwatch {
  return {
    id: genId(),
    name: `ストップウォッチ ${index + 1}`,
    color: COLORS[index % COLORS.length].value,
    elapsedMs: 0,
    startTime: null,
    isRunning: false,
    laps: [],
  };
}

// ─── FocusMode ────────────────────────────────────────────────────────────────

interface FocusModeProps {
  sw: Stopwatch;
  displayMs: number;
  onToggle: () => void;
  onLap: () => void;
  onReset: () => void;
  onExit: () => void;
}

function FocusMode({ sw, displayMs, onToggle, onLap, onReset, onExit }: FocusModeProps) {
  const startRef = useRef({ x: 0, y: 0 });
  const isExcludedRef = useRef(false);
  const cfg = getColor(sw.color);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    isExcludedRef.current = !!(e.target as HTMLElement).closest("[data-focus-btn]");
    startRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || isExcludedRef.current) return;
    const dx = Math.abs(e.clientX - startRef.current.x);
    const dy = Math.abs(e.clientY - startRef.current.y);
    if (dx <= 12 && dy <= 12) onToggle();
  };

  return (
    <div
      className="fixed inset-0 bg-background dark:bg-zinc-950 z-50 flex flex-col select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* カラーアクセント */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${cfg.topLine} opacity-70`} />

      {/* 終了ボタン */}
      <div className="absolute top-4 left-4" data-focus-btn>
        <button
          data-focus-btn
          onClick={onExit}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors touch-manipulation pointer-events-auto"
          aria-label="集中モードを終了"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* ステータスバッジ */}
      <div className="absolute top-4 right-4 pointer-events-none">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          sw.isRunning
            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            : "bg-muted text-muted-foreground"
        }`}>
          {sw.isRunning ? "計測中" : "停止中"}
        </span>
      </div>

      {/* メイン表示 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 pointer-events-none">
        <span className="text-sm font-medium text-muted-foreground tracking-wide">{sw.name}</span>
        <span className="text-7xl sm:text-8xl font-bold font-mono tabular-nums leading-none">
          {formatTime(displayMs)}
        </span>
        {sw.laps.length > 0 && (
          <span className="text-sm text-muted-foreground">ラップ {sw.laps.length}</span>
        )}
        {/* タップ操作ヒント — 常時表示 */}
        <span className="text-sm text-foreground/50 font-medium mt-2 tracking-wide">
          {sw.isRunning ? "画面タップで停止" : "画面タップで計測開始"}
        </span>
      </div>

      {/* 下部：操作ボタン群 */}
      <div className="px-8 pb-10 flex flex-col gap-2" data-focus-btn>
        {/* ラップボタン */}
        <button
          data-focus-btn
          onClick={onLap}
          disabled={!sw.isRunning}
          className={`w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all touch-manipulation pointer-events-auto ${
            sw.isRunning
              ? "bg-foreground/10 hover:bg-foreground/15 active:scale-[0.98] text-foreground"
              : "bg-foreground/5 text-muted-foreground/25 cursor-not-allowed"
          }`}
          aria-label="ラップ記録"
        >
          <Flag className="size-4" />
          ラップ
        </button>
        <p className="text-center text-xs text-muted-foreground/25 pointer-events-none">
          計測中のみ記録できます
        </p>
        {/* リセット — 小アイコン */}
        <div className="flex justify-center">
          <button
            data-focus-btn
            onClick={onReset}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-foreground/5 hover:bg-foreground/10 active:scale-[0.95] text-muted-foreground/50 hover:text-muted-foreground transition-all touch-manipulation pointer-events-auto"
            aria-label="このストップウォッチをリセット"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>

      {/* ダークモード */}
      <div className="absolute bottom-4 right-4 opacity-40 hover:opacity-90 transition-opacity pointer-events-auto" data-focus-btn>
        <DarkModeToggle />
      </div>
    </div>
  );
}

// ─── StopwatchCard ────────────────────────────────────────────────────────────

interface StopwatchCardProps {
  sw: Stopwatch;
  displayMs: number;
  isLapOpen: boolean;
  canRemove: boolean;
  isKeyboardFocused: boolean;
  onToggle: () => void;
  onLap: () => void;
  onReset: () => void;
  onRemove: () => void;
  onRename: (name: string) => void;
  onColorChange: (color: string) => void;
  onToggleLap: () => void;
  onFocus: () => void;
}

function StopwatchCard({
  sw, displayMs, isLapOpen, canRemove, isKeyboardFocused,
  onToggle, onLap, onReset, onRemove, onRename, onColorChange, onToggleLap, onFocus,
}: StopwatchCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(sw.name);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const cfg = getColor(sw.color);

  useEffect(() => {
    if (!isEditingName) setEditName(sw.name);
  }, [sw.name, isEditingName]);

  useEffect(() => {
    if (isEditingName) {
      setTimeout(() => { nameInputRef.current?.focus(); nameInputRef.current?.select(); }, 0);
    }
  }, [isEditingName]);

  const commitName = () => {
    const trimmed = editName.trim();
    if (trimmed) onRename(trimmed);
    else setEditName(sw.name);
    setIsEditingName(false);
  };

  const lapTimes = sw.laps.map((l) => l.lapMs);
  const minLap = lapTimes.length > 1 ? Math.min(...lapTimes) : null;
  const maxLap = lapTimes.length > 1 ? Math.max(...lapTimes) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl overflow-hidden shadow-sm ring-1 ${cfg.ring} bg-card ${
        isKeyboardFocused ? "outline outline-2 outline-primary/50 outline-offset-1" : ""
      }`}
    >
      <div className={`h-[3px] ${cfg.topLine}`} />
      <div className="p-3 flex flex-col gap-2">
        {/* Name row */}
        <div className="flex items-center gap-1 min-h-7">
          {isEditingName ? (
            <>
              <input
                ref={nameInputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitName();
                  if (e.key === "Escape") { setEditName(sw.name); setIsEditingName(false); }
                }}
                className="flex-1 min-w-0 text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
                maxLength={20}
              />
              <button onClick={commitName} className="p-1 rounded hover:bg-foreground/10" aria-label="確定">
                <Check className="size-3 text-primary" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditingName(true)}
                className="flex-1 min-w-0 text-left text-xs text-muted-foreground hover:text-foreground transition-colors truncate group flex items-center gap-1"
              >
                <span className="truncate">{sw.name}</span>
                <Pencil className="size-2.5 opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0" />
              </button>
              <button
                onClick={onFocus}
                className="p-1 rounded hover:bg-foreground/10 transition-colors flex-shrink-0"
                aria-label="集中モード"
              >
                <Maximize2 className="size-3 text-muted-foreground" />
              </button>
              {canRemove && (
                <button onClick={onRemove} className="p-1 rounded hover:bg-destructive/10 transition-colors" aria-label="削除">
                  <X className="size-3 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </>
          )}
        </div>

        {/* カラースウォッチ — 名前編集中のみ表示 */}
        {isEditingName && (
          <div className="flex gap-1.5 flex-wrap pt-0.5 pb-1">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => onColorChange(c.value)}
                className={`w-6 h-6 rounded-full transition-transform touch-manipulation ${
                  sw.color === c.value
                    ? "scale-125 ring-2 ring-foreground/30 ring-offset-1"
                    : "hover:scale-110 opacity-60 hover:opacity-100"
                }`}
                style={{ backgroundColor: c.hex }}
                aria-label={c.value}
              />
            ))}
          </div>
        )}

        {/* Time display */}
        <div className="text-center py-1">
          <span className="font-mono text-3xl font-bold tabular-nums tracking-tight">
            {formatTime(displayMs)}
          </span>
        </div>

        {/* Start/Stop - full width */}
        <Button
          size="sm"
          variant={sw.isRunning ? "destructive" : "default"}
          onClick={onToggle}
          className="w-full h-9 text-xs gap-1"
        >
          {sw.isRunning ? <Square className="size-3" /> : <Play className="size-3" />}
          {sw.isRunning ? "停止" : "開始"}
        </Button>

        {/* Lap + Reset - 2 columns */}
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={onLap}
            disabled={!sw.isRunning && displayMs === 0}
            className="h-8 text-xs gap-1"
          >
            <Flag className="size-3" />
            ラップ
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReset}
            disabled={displayMs === 0 && sw.laps.length === 0}
            className="h-8 text-xs gap-1"
          >
            <RotateCcw className="size-3" />
            リセット
          </Button>
        </div>

        {/* Lap toggle */}
        {sw.laps.length > 0 && (
          <button
            onClick={onToggleLap}
            className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5"
          >
            <span>ラップ ({sw.laps.length})</span>
            {isLapOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        )}

        {/* Lap list */}
        <AnimatePresence>
          {isLapOpen && sw.laps.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/40 pt-1 max-h-40 overflow-y-auto">
                <div className="grid grid-cols-3 text-xs text-muted-foreground px-1 pb-0.5 font-medium">
                  <span>#</span>
                  <span className="text-right">累計</span>
                  <span className="text-right">ラップ</span>
                </div>
                {[...sw.laps].reverse().map((lap) => (
                  <motion.div
                    key={lap.id}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`grid grid-cols-3 text-xs px-1 py-0.5 font-mono tabular-nums ${
                      lap.lapMs === minLap ? "text-green-500 dark:text-green-400" :
                      lap.lapMs === maxLap ? "text-red-500 dark:text-red-400" : ""
                    }`}
                  >
                    <span>{lap.lapNumber}</span>
                    <span className="text-right">{formatTime(lap.totalMs)}</span>
                    <span className="text-right">{formatTime(lap.lapMs)}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── StopwatchTool (main) ─────────────────────────────────────────────────────

export function StopwatchTool() {
  const [stopwatches, setStopwatches] = useState<Stopwatch[]>([createStopwatch(0)]);
  const [lapPanelOpen, setLapPanelOpen] = useState<Record<string, boolean>>({});
  const [displayTimes, setDisplayTimes] = useState<Record<string, number>>({});
  const [showResetAllConfirm, setShowResetAllConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusSwId, setFocusSwId] = useState<string | null>(null);
  const [keyboardFocusedIndex, setKeyboardFocusedIndex] = useState(0);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const rafRef = useRef<number | null>(null);
  const saveMenuRef = useRef<HTMLDivElement>(null);
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swRef = useRef(stopwatches);
  useEffect(() => { swRef.current = stopwatches; }, [stopwatches]);

  // Load saved names/colors from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { names?: string[]; colors?: string[] };
        if (saved.names && saved.names.length > 0) {
          setStopwatches(saved.names.map((name, i) => ({
            ...createStopwatch(i),
            name,
            color: saved.colors?.[i] ?? COLORS[i % COLORS.length].value,
          })));
        }
      }
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  // Save names/colors
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        names: stopwatches.map((s) => s.name),
        colors: stopwatches.map((s) => s.color),
      }));
    } catch { /* ignore */ }
  }, [stopwatches, mounted]);

  // RAF display loop
  useEffect(() => {
    const tick = () => {
      const next: Record<string, number> = {};
      swRef.current.forEach((s) => { next[s.id] = getDisplayMs(s); });
      setDisplayTimes(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const anyRunning = stopwatches.some((s) => s.isRunning);

  const triggerUndo = useCallback((snapshot: UndoSnapshot, durationMs: number, label: string) => {
    toast(label, {
      duration: durationMs,
      action: {
        label: "元に戻す",
        onClick: () => {
          setStopwatches((prev) => prev.map((s) => {
            const ps = snapshot.previousSwStates.find((p) => p.id === s.id);
            if (!ps) return s;
            return { ...s, isRunning: false, elapsedMs: ps.elapsedMs, startTime: null, laps: ps.laps };
          }));
          const restored: Record<string, boolean> = {};
          snapshot.previousSwStates.forEach((p) => { if (p.laps.length > 0) restored[p.id] = true; });
          setLapPanelOpen(restored);
        },
      },
    });
  }, []);

  const toggleSingle = useCallback((id: string) => {
    setStopwatches((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      return s.isRunning
        ? { ...s, isRunning: false, elapsedMs: getDisplayMs(s), startTime: null }
        : { ...s, isRunning: true, startTime: Date.now() };
    }));
  }, []);

  const stopSingle = useCallback((id: string) => {
    setStopwatches((prev) => prev.map((s) =>
      s.id !== id || !s.isRunning ? s : { ...s, isRunning: false, elapsedMs: getDisplayMs(s), startTime: null }
    ));
  }, []);

  const addLap = useCallback((id: string) => {
    setStopwatches((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      const totalMs = getDisplayMs(s);
      const prevTotal = s.laps.length > 0 ? s.laps[s.laps.length - 1].totalMs : 0;
      const lap: LapRecord = { id: genId(), lapNumber: s.laps.length + 1, totalMs, lapMs: totalMs - prevTotal, recordedAt: Date.now() };
      return { ...s, laps: [...s.laps, lap] };
    }));
    setLapPanelOpen((prev) => ({ ...prev, [id]: true }));
  }, []);

  const resetSingle = useCallback((id: string) => {
    const sws = swRef.current;
    const sw = sws.find((s) => s.id === id);
    if (!sw || (getDisplayMs(sw) === 0 && sw.laps.length === 0)) return;
    const snapshot: UndoSnapshot = {
      type: "single", swId: id,
      previousSwStates: sws.map((s) => ({ id: s.id, elapsedMs: getDisplayMs(s), laps: s.laps })),
    };
    setStopwatches((prev) => prev.map((s) =>
      s.id !== id ? s : { ...s, isRunning: false, elapsedMs: 0, startTime: null, laps: [] }
    ));
    setLapPanelOpen((prev) => ({ ...prev, [id]: false }));
    triggerUndo(snapshot, 3000, `${sw.name}をリセットしました`);
  }, [triggerUndo]);

  const removeSingle = useCallback((id: string) => {
    setStopwatches((prev) => prev.filter((s) => s.id !== id));
    setLapPanelOpen((prev) => { const next = { ...prev }; delete next[id]; return next; });
  }, []);

  const renameSingle = useCallback((id: string, name: string) => {
    setStopwatches((prev) => prev.map((s) => s.id !== id ? s : { ...s, name }));
  }, []);

  const changeColor = useCallback((id: string, color: string) => {
    setStopwatches((prev) => prev.map((s) => s.id !== id ? s : { ...s, color }));
  }, []);

  const startAll = useCallback(() => {
    setStopwatches((prev) => prev.map((s) => s.isRunning ? s : { ...s, isRunning: true, startTime: Date.now() }));
  }, []);

  const stopAll = useCallback(() => {
    setStopwatches((prev) => prev.map((s) =>
      s.isRunning ? { ...s, isRunning: false, elapsedMs: getDisplayMs(s), startTime: null } : s
    ));
  }, []);

  const resetAll = useCallback(() => {
    const sws = swRef.current;
    const snapshot: UndoSnapshot = {
      type: "all",
      previousSwStates: sws.map((s) => ({ id: s.id, elapsedMs: getDisplayMs(s), laps: s.laps })),
    };
    setStopwatches((prev) => prev.map((s) => ({ ...s, isRunning: false, elapsedMs: 0, startTime: null, laps: [] })));
    setLapPanelOpen({});
    setShowResetAllConfirm(false);
    triggerUndo(snapshot, 6000, "全ストップウォッチをリセットしました");
  }, [triggerUndo]);

  const addStopwatch = useCallback(() => {
    setStopwatches((prev) => {
      if (prev.length >= MAX_STOPWATCHES) return prev;
      const existingNames = new Set(prev.map((s) => s.name));
      let n = 1;
      let name: string;
      do { name = `ストップウォッチ ${n}`; n++; } while (existingNames.has(name));
      return [...prev, { ...createStopwatch(prev.length), name }];
    });
  }, []);

  const copyAsText = useCallback(async () => {
    const swsWithData = stopwatches.filter((s) => s.laps.length > 0 || getDisplayMs(s) > 0);
    if (swsWithData.length === 0) return;
    const date = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
    const lines: string[] = [`=== ${date} ===`];
    swsWithData.forEach((sw) => {
      lines.push(`\n【${sw.name}】`);
      if (sw.laps.length === 0) {
        lines.push(`  合計: ${formatTime(getDisplayMs(sw))}`);
      } else {
        sw.laps.forEach((lap) => {
          lines.push(`  #${lap.lapNumber}  ${formatTime(lap.totalMs)}  (${formatTime(lap.lapMs)})`);
        });
      }
    });
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast("テキストをコピーしました");
    } catch {
      toast("コピーに失敗しました");
    }
    setShowSaveMenu(false);
  }, [stopwatches]);

  const exportCsv = useCallback(() => {
    const header = "ストップウォッチ名,ラップ番号,累積タイム,ラップタイム,記録時刻";
    const rows = stopwatches.flatMap((s) => {
      if (s.laps.length === 0) {
        const ms = getDisplayMs(s);
        if (ms === 0) return [];
        return [[s.name, "-", formatTime(ms), "-", new Date().toISOString()].join(",")];
      }
      return s.laps.map((lap) =>
        [s.name, lap.lapNumber, formatTime(lap.totalMs), formatTime(lap.lapMs), new Date(lap.recordedAt).toISOString()].join(",")
      );
    });
    if (rows.length === 0) return;
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stopwatch-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowSaveMenu(false);
  }, [stopwatches]);

  // Keyboard shortcuts via latestRef to avoid re-registration
  const latestRef = useRef({
    stopwatches, focusSwId, anyRunning, keyboardFocusedIndex,
    toggleSingle, stopSingle, addLap, resetSingle, startAll, stopAll, addStopwatch,
  });
  useEffect(() => {
    latestRef.current = {
      stopwatches, focusSwId, anyRunning, keyboardFocusedIndex,
      toggleSingle, stopSingle, addLap, resetSingle, startAll, stopAll, addStopwatch,
    };
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      const { stopwatches: sws, focusSwId: fid, anyRunning: ar, keyboardFocusedIndex: kfi,
        toggleSingle: tog, stopSingle: stp, addLap: lap, resetSingle: rst,
        startAll: sa, stopAll: so, addStopwatch: add } = latestRef.current;

      if (fid) {
        const sw = sws.find((s) => s.id === fid);
        if (!sw) return;
        if (e.key === "Escape") { setFocusSwId(null); return; }
        if (e.key === " ") { e.preventDefault(); if (sw.isRunning) lap(fid); else tog(fid); return; }
        if (e.key === "ArrowDown") { e.preventDefault(); stp(fid); return; }
        return;
      }

      if (e.key === " ") { e.preventDefault(); if (ar) so(); else sa(); return; }
      if (e.key >= "1" && e.key <= "8") {
        const idx = parseInt(e.key) - 1;
        if (idx < sws.length) setKeyboardFocusedIndex(idx);
        return;
      }
      const focused = sws[kfi];
      if (!focused) return;
      if (e.key === "l" || e.key === "L") lap(focused.id);
      else if (e.key === "s" || e.key === "S") tog(focused.id);
      else if (e.key === "r" || e.key === "R") rst(focused.id);
      else if (e.key === "n" || e.key === "N") add();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/stopwatch`;
    navigator.clipboard.writeText(url)
      .then(() => {
        toast("URLをコピーしました");
        setShareSuccess(true);
        if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
        shareTimerRef.current = setTimeout(() => setShareSuccess(false), 2000);
      })
      .catch(() => toast("コピーに失敗しました"));
  }, []);

  const stats = useMemo(() => {
    const allLaps = stopwatches.flatMap((sw) =>
      sw.laps.map((l) => ({ ...l, swName: sw.name }))
    );
    const swTimes = stopwatches.map((sw) => displayTimes[sw.id] ?? sw.elapsedMs);
    const totalMs = swTimes.reduce((a, b) => a + b, 0);
    const activeSws = swTimes.filter((ms) => ms > 0);
    const avgSwMs = activeSws.length > 1
      ? Math.round(activeSws.reduce((a, b) => a + b, 0) / activeSws.length) : null;
    const lapTimes = allLaps.map((l) => l.lapMs);
    const avgLapMs = lapTimes.length > 0
      ? Math.round(lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length) : null;
    const minMs = lapTimes.length > 0 ? Math.min(...lapTimes) : null;
    const maxMs = lapTimes.length > 0 ? Math.max(...lapTimes) : null;
    const fastestLap = minMs !== null ? allLaps.find((l) => l.lapMs === minMs) ?? null : null;
    const slowestLap = maxMs !== null ? allLaps.find((l) => l.lapMs === maxMs) ?? null : null;
    return { totalMs, avgSwMs, avgLapMs, fastestLap, slowestLap, lapCount: lapTimes.length };
  }, [stopwatches, displayTimes]);

  // Close save menu on outside click
  useEffect(() => {
    if (!showSaveMenu) return;
    const handler = (e: MouseEvent) => {
      if (saveMenuRef.current && !saveMenuRef.current.contains(e.target as Node)) {
        setShowSaveMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSaveMenu]);

  const hasAnyData = stopwatches.some((s) => s.laps.length > 0 || s.elapsedMs > 0 || s.isRunning);
  const focusSw = focusSwId ? stopwatches.find((s) => s.id === focusSwId) ?? null : null;

  if (!mounted) return null;

  return (
    <>
      <ToolLayout title="多列ストップウォッチ" wide adVisible={!anyRunning}>
        <div className="space-y-4">
          {/* Global controls */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button size="sm" onClick={startAll} disabled={stopwatches.every((s) => s.isRunning)} className="gap-1.5">
                <Play className="size-3.5" />全スタート
              </Button>
              <Button size="sm" variant="outline" onClick={stopAll} disabled={!anyRunning} className="gap-1.5">
                <Square className="size-3.5" />全停止
              </Button>
            </div>
            <div className="flex gap-1.5 flex-shrink-0 relative">
              {/* キーボードショートカットポップアップ */}
              {showShortcuts && (
                <div className="absolute top-full right-0 mt-2 w-64 rounded-lg border border-border bg-background shadow-lg p-3 z-50 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground mb-2">キーボードショートカット</p>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>Space</span><span>全体スタート / 停止</span></div>
                    <div className="flex justify-between"><span>1〜8</span><span>ストップウォッチを選択</span></div>
                    <div className="flex justify-between"><span>S</span><span>選択中をスタート / 停止</span></div>
                    <div className="flex justify-between"><span>L</span><span>選択中にラップ記録</span></div>
                    <div className="flex justify-between"><span>R</span><span>選択中をリセット</span></div>
                    <div className="flex justify-between"><span>N</span><span>ストップウォッチを追加</span></div>
                  </div>
                </div>
              )}
              {hasAnyData && (
                <div className="relative" ref={saveMenuRef}>
                  <Button size="sm" variant="outline" onClick={() => setShowSaveMenu((v) => !v)} className="gap-1.5 h-9 px-2 sm:px-3">
                    <Download className="size-3.5" />
                    <span className="hidden sm:inline text-sm">保存</span>
                    <ChevronDown className={`size-3 transition-transform duration-150 ${showSaveMenu ? "rotate-180" : ""}`} />
                  </Button>
                  {showSaveMenu && (
                    <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-border bg-background shadow-lg z-10 overflow-hidden">
                      <button onClick={copyAsText} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left">
                        <Copy className="size-3.5 text-muted-foreground" />テキストコピー
                      </button>
                      <button onClick={exportCsv} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left border-t border-border/40">
                        <Download className="size-3.5 text-muted-foreground" />CSVダウンロード
                      </button>
                    </div>
                  )}
                </div>
              )}
              <Button size="sm" variant="outline" onClick={handleShare} className="gap-1.5 h-9 px-2 sm:px-3">
                {shareSuccess ? <Check className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
                <span className="hidden sm:inline text-sm">{shareSuccess ? "コピー済" : "共有"}</span>
              </Button>
              <Button
                size="sm" variant="outline"
                onClick={() => setShowResetAllConfirm(true)}
                className="gap-1.5 h-9 px-2 sm:px-3 text-muted-foreground hover:text-destructive hover:border-destructive/50"
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline text-sm">全リセット</span>
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => setShowShortcuts((v) => !v)}
                aria-label="キーボードショートカット"
                className="h-9 w-9 px-0 text-muted-foreground font-bold"
              >
                ?
              </Button>
            </div>
          </div>

          {/* Grid — max 4 columns */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <AnimatePresence>
              {stopwatches.map((sw, idx) => (
                <StopwatchCard
                  key={sw.id}
                  sw={sw}
                  displayMs={displayTimes[sw.id] ?? sw.elapsedMs}
                  isLapOpen={!!lapPanelOpen[sw.id]}
                  canRemove={stopwatches.length > 1}
                  isKeyboardFocused={idx === keyboardFocusedIndex}
                  onToggle={() => toggleSingle(sw.id)}
                  onLap={() => addLap(sw.id)}
                  onReset={() => resetSingle(sw.id)}
                  onRemove={() => removeSingle(sw.id)}
                  onRename={(name) => renameSingle(sw.id, name)}
                  onColorChange={(color) => changeColor(sw.id, color)}
                  onToggleLap={() => setLapPanelOpen((prev) => ({ ...prev, [sw.id]: !prev[sw.id] }))}
                  onFocus={() => setFocusSwId(sw.id)}
                />
              ))}
            </AnimatePresence>

            {stopwatches.length < MAX_STOPWATCHES && (
              <motion.button
                onClick={addStopwatch}
                className="rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 min-h-[180px] text-muted-foreground hover:text-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="size-6" />
                <span className="text-xs">追加</span>
                <span className="text-xs opacity-50">N キー</span>
              </motion.button>
            )}
          </div>

          {/* 統計セクション */}
          <div className="rounded-lg border border-border/60 overflow-hidden">
              <button
                onClick={() => setShowStats((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
              >
                <span>統計</span>
                <ChevronDown className={`size-3.5 transition-transform duration-150 ${showStats ? "rotate-180" : ""}`} />
              </button>
              {showStats && (
                <div className="border-t border-border/40 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div className="flex justify-between col-span-2 sm:col-span-1">
                    <span className="text-muted-foreground">全合計タイム</span>
                    <span className="font-mono font-medium">{formatTime(stats.totalMs)}</span>
                  </div>
                  {stats.avgSwMs !== null && (
                    <div className="flex justify-between col-span-2 sm:col-span-1">
                      <span className="text-muted-foreground">全体平均タイム</span>
                      <span className="font-mono font-medium">{formatTime(stats.avgSwMs)}</span>
                    </div>
                  )}
                  {stats.avgLapMs !== null && (
                    <div className="flex justify-between col-span-2 sm:col-span-1">
                      <span className="text-muted-foreground">平均ラップ</span>
                      <span className="font-mono font-medium">{formatTime(stats.avgLapMs)}</span>
                    </div>
                  )}
                  {stats.fastestLap && (
                    <div className="flex justify-between col-span-2 sm:col-span-1">
                      <span className="text-muted-foreground">最速ラップ</span>
                      <span className="font-mono font-medium text-green-600 dark:text-green-400">
                        {formatTime(stats.fastestLap.lapMs)}
                        <span className="text-muted-foreground font-sans ml-1">({stats.fastestLap.swName})</span>
                      </span>
                    </div>
                  )}
                  {stats.slowestLap && (
                    <div className="flex justify-between col-span-2 sm:col-span-1">
                      <span className="text-muted-foreground">最遅ラップ</span>
                      <span className="font-mono font-medium text-red-500 dark:text-red-400">
                        {formatTime(stats.slowestLap.lapMs)}
                        <span className="text-muted-foreground font-sans ml-1">({stats.slowestLap.swName})</span>
                      </span>
                    </div>
                  )}
                  {stats.lapCount > 0 && (
                    <div className="flex justify-between col-span-2 sm:col-span-1">
                      <span className="text-muted-foreground">総ラップ数</span>
                      <span className="font-medium">{stats.lapCount}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
        </div>

        <Dialog open={showResetAllConfirm} onOpenChange={setShowResetAllConfirm}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>全体リセット</DialogTitle>
              <DialogDescription>全ストップウォッチをリセットします。6秒間は「元に戻す」で取り消せます。</DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton={false}>
              <Button variant="outline" onClick={() => setShowResetAllConfirm(false)}>キャンセル</Button>
              <Button variant="destructive" onClick={resetAll}>リセット</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ToolLayout>

      <AnimatePresence>
        {focusSw && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50"
          >
            <FocusMode
              sw={focusSw}
              displayMs={displayTimes[focusSw.id] ?? focusSw.elapsedMs}
              onToggle={() => toggleSingle(focusSw.id)}
              onLap={() => addLap(focusSw.id)}
              onReset={() => resetSingle(focusSw.id)}
              onExit={() => setFocusSwId(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
