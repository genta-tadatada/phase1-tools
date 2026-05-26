"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, RotateCcw, Download, Play, Square, Flag, ChevronDown, ChevronUp, X, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_STOPWATCHES = 5;
const STORAGE_KEY = "phase1-stopwatch-settings";

const COLORS = [
  { value: "sky", bg: "bg-sky-500", ring: "ring-sky-300/60 dark:ring-sky-700/40", topLine: "bg-sky-500" },
  { value: "violet", bg: "bg-violet-500", ring: "ring-violet-300/60 dark:ring-violet-700/40", topLine: "bg-violet-500" },
  { value: "rose", bg: "bg-rose-500", ring: "ring-rose-300/60 dark:ring-rose-700/40", topLine: "bg-rose-500" },
  { value: "emerald", bg: "bg-emerald-500", ring: "ring-emerald-300/60 dark:ring-emerald-700/40", topLine: "bg-emerald-500" },
  { value: "orange", bg: "bg-orange-500", ring: "ring-orange-300/60 dark:ring-orange-700/40", topLine: "bg-orange-500" },
  { value: "yellow", bg: "bg-yellow-500", ring: "ring-yellow-300/60 dark:ring-yellow-700/40", topLine: "bg-yellow-500" },
  { value: "zinc", bg: "bg-zinc-400", ring: "ring-zinc-300/60 dark:ring-zinc-700/40", topLine: "bg-zinc-400" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try { return crypto.randomUUID(); } catch { /* fallback */ }
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(ms: number): string {
  const centiseconds = Math.floor(ms / 10) % 100;
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 60000) % 60;
  const hours = Math.floor(ms / 3600000);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function getDisplayMs(sw: Stopwatch): number {
  if (!sw.isRunning || sw.startTime === null) return sw.elapsedMs;
  return sw.elapsedMs + (Date.now() - sw.startTime);
}

function getColorConfig(colorValue: string) {
  return COLORS.find((c) => c.value === colorValue) ?? COLORS[0];
}

function createStopwatch(index: number): Stopwatch {
  const color = COLORS[index % COLORS.length].value;
  return {
    id: genId(),
    name: `ストップウォッチ ${index + 1}`,
    color,
    elapsedMs: 0,
    startTime: null,
    isRunning: false,
    laps: [],
  };
}

// ─── StopwatchCard ────────────────────────────────────────────────────────────

interface StopwatchCardProps {
  sw: Stopwatch;
  displayMs: number;
  isLapOpen: boolean;
  canRemove: boolean;
  onToggle: () => void;
  onLap: () => void;
  onReset: () => void;
  onRemove: () => void;
  onRename: (name: string) => void;
  onToggleLap: () => void;
}

function StopwatchCard({
  sw,
  displayMs,
  isLapOpen,
  canRemove,
  onToggle,
  onLap,
  onReset,
  onRemove,
  onRename,
  onToggleLap,
}: StopwatchCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(sw.name);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const colorCfg = getColorConfig(sw.color);

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

  // Find fastest and slowest laps
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
      className={`rounded-xl overflow-hidden shadow-sm ring-1 ${colorCfg.ring} bg-card`}
    >
      {/* Top accent line */}
      <div className={`h-[3px] ${colorCfg.topLine}`} />

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
              {canRemove && (
                <button onClick={onRemove} className="p-1 rounded hover:bg-destructive/10 transition-colors" aria-label="削除">
                  <X className="size-3 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Time display */}
        <div className="text-center py-1">
          <span className="font-mono text-3xl font-bold tabular-nums tracking-tight">
            {formatTime(displayMs)}
          </span>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-1.5">
          <Button
            size="sm"
            variant={sw.isRunning ? "destructive" : "default"}
            onClick={onToggle}
            className="h-8 text-xs gap-1"
          >
            {sw.isRunning ? <Square className="size-3" /> : <Play className="size-3" />}
            {sw.isRunning ? "停止" : "開始"}
          </Button>
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
                      lap.lapMs === maxLap ? "text-red-500 dark:text-red-400" :
                      ""
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
  const rafRef = useRef<number | null>(null);

  // Load saved names from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { names?: string[]; colors?: string[] };
        if (saved.names && saved.names.length > 0) {
          setStopwatches(saved.names.map((name, i) =>
            ({ ...createStopwatch(i), name, color: saved.colors?.[i] ?? COLORS[i % COLORS.length].value })
          ));
        }
      }
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  // Save names/colors to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        names: stopwatches.map((sw) => sw.name),
        colors: stopwatches.map((sw) => sw.color),
      }));
    } catch { /* ignore */ }
  }, [stopwatches, mounted]);

  // RAF loop for display updates
  useEffect(() => {
    const tick = () => {
      setDisplayTimes(() => {
        const next: Record<string, number> = {};
        setStopwatches((prev) => {
          prev.forEach((sw) => { next[sw.id] = getDisplayMs(sw); });
          return prev;
        });
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const anyRunning = stopwatches.some((sw) => sw.isRunning);

  const toggleSingle = useCallback((id: string) => {
    setStopwatches((prev) =>
      prev.map((sw) => {
        if (sw.id !== id) return sw;
        if (sw.isRunning) {
          return { ...sw, isRunning: false, elapsedMs: getDisplayMs(sw), startTime: null };
        } else {
          return { ...sw, isRunning: true, startTime: Date.now() };
        }
      })
    );
  }, []);

  const addLap = useCallback((id: string) => {
    setStopwatches((prev) =>
      prev.map((sw) => {
        if (sw.id !== id) return sw;
        const totalMs = getDisplayMs(sw);
        const prevTotal = sw.laps.length > 0 ? sw.laps[sw.laps.length - 1].totalMs : 0;
        const lap: LapRecord = {
          id: genId(),
          lapNumber: sw.laps.length + 1,
          totalMs,
          lapMs: totalMs - prevTotal,
          recordedAt: Date.now(),
        };
        return { ...sw, laps: [...sw.laps, lap] };
      })
    );
    setLapPanelOpen((prev) => ({ ...prev, [id]: true }));
  }, []);

  const resetSingle = useCallback((id: string) => {
    setStopwatches((prev) =>
      prev.map((sw) =>
        sw.id !== id ? sw : { ...sw, isRunning: false, elapsedMs: 0, startTime: null, laps: [] }
      )
    );
    setLapPanelOpen((prev) => ({ ...prev, [id]: false }));
  }, []);

  const removeSingle = useCallback((id: string) => {
    setStopwatches((prev) => prev.filter((sw) => sw.id !== id));
    setLapPanelOpen((prev) => { const next = { ...prev }; delete next[id]; return next; });
  }, []);

  const renameSingle = useCallback((id: string, name: string) => {
    setStopwatches((prev) => prev.map((sw) => sw.id !== id ? sw : { ...sw, name }));
  }, []);

  const startAll = useCallback(() => {
    setStopwatches((prev) =>
      prev.map((sw) => sw.isRunning ? sw : { ...sw, isRunning: true, startTime: Date.now() })
    );
  }, []);

  const stopAll = useCallback(() => {
    setStopwatches((prev) =>
      prev.map((sw) => sw.isRunning ? { ...sw, isRunning: false, elapsedMs: getDisplayMs(sw), startTime: null } : sw)
    );
  }, []);

  const resetAll = useCallback(() => {
    setStopwatches((prev) => prev.map((sw) => ({ ...sw, isRunning: false, elapsedMs: 0, startTime: null, laps: [] })));
    setLapPanelOpen({});
    setShowResetAllConfirm(false);
  }, []);

  const addStopwatch = useCallback(() => {
    setStopwatches((prev) => {
      if (prev.length >= MAX_STOPWATCHES) return prev;
      return [...prev, createStopwatch(prev.length)];
    });
  }, []);

  const exportCsv = useCallback(() => {
    const header = "ストップウォッチ名,ラップ番号,累積タイム,ラップタイム,記録時刻";
    const rows = stopwatches.flatMap((sw) =>
      sw.laps.map((lap) =>
        [sw.name, lap.lapNumber, formatTime(lap.totalMs), formatTime(lap.lapMs), new Date(lap.recordedAt).toISOString()].join(",")
      )
    );
    if (rows.length === 0) return;
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stopwatch-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stopwatches]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (e.key === " ") {
        e.preventDefault();
        if (anyRunning) stopAll(); else startAll();
      } else if (e.key === "n" || e.key === "N") {
        addStopwatch();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [anyRunning, startAll, stopAll, addStopwatch]);

  const hasAnyLaps = stopwatches.some((sw) => sw.laps.length > 0);

  return (
    <ToolLayout title="多列ストップウォッチ" wide adVisible={!anyRunning}>
      <div className="space-y-4">
        {/* Global controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button size="sm" onClick={startAll} disabled={stopwatches.every((sw) => sw.isRunning)} className="gap-1.5">
              <Play className="size-3.5" />
              全スタート
            </Button>
            <Button size="sm" variant="outline" onClick={stopAll} disabled={!anyRunning} className="gap-1.5">
              <Square className="size-3.5" />
              全停止
            </Button>
          </div>
          <div className="flex gap-2">
            {hasAnyLaps && (
              <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1.5">
                <Download className="size-3.5" />
                CSV
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowResetAllConfirm(true)}
              className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/50"
            >
              <RotateCcw className="size-3.5" />
              全リセット
            </Button>
          </div>
        </div>

        {/* Stopwatch grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <AnimatePresence>
            {stopwatches.map((sw) => (
              <StopwatchCard
                key={sw.id}
                sw={sw}
                displayMs={displayTimes[sw.id] ?? sw.elapsedMs}
                isLapOpen={!!lapPanelOpen[sw.id]}
                canRemove={stopwatches.length > 1}
                onToggle={() => toggleSingle(sw.id)}
                onLap={() => addLap(sw.id)}
                onReset={() => resetSingle(sw.id)}
                onRemove={() => removeSingle(sw.id)}
                onRename={(name) => renameSingle(sw.id, name)}
                onToggleLap={() => setLapPanelOpen((prev) => ({ ...prev, [sw.id]: !prev[sw.id] }))}
              />
            ))}
          </AnimatePresence>

          {/* Add button */}
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

        {/* Shortcut hints */}
        <div className="text-xs text-muted-foreground/50 border-t border-border/40 pt-3 space-y-0.5">
          <p>Space: 全体スタート / 停止　　N: ストップウォッチ追加</p>
        </div>
      </div>

      {/* Reset all confirm */}
      <Dialog open={showResetAllConfirm} onOpenChange={setShowResetAllConfirm}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>全体リセット</DialogTitle>
            <DialogDescription>全ストップウォッチをリセットします。ラップ記録もすべて削除されます。</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false}>
            <Button variant="outline" onClick={() => setShowResetAllConfirm(false)}>キャンセル</Button>
            <Button variant="destructive" onClick={resetAll}>リセット</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ToolLayout>
  );
}
