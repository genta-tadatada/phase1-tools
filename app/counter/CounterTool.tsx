"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Maximize2,
  X,
  Plus,
  RotateCcw,
  Share2,
  Pencil,
  Check,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { decodeState, generateShareUrl } from "@/lib/share";
import { useLongPress } from "@/hooks/useLongPress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Types ──────────────────────────────────────────────────────────────────

type CounterColor =
  | "teal"
  | "sky"
  | "violet"
  | "rose"
  | "amber"
  | "emerald"
  | "zinc";

const COLOR_CYCLE: CounterColor[] = [
  "teal",
  "sky",
  "violet",
  "rose",
  "amber",
  "emerald",
  "zinc",
];

const COLOR_CONFIG: Record<
  CounterColor,
  { border: string; bg: string; swatch: string; dot: string; label: string }
> = {
  teal: {
    border: "border-l-4 border-teal-500",
    bg: "bg-teal-50/60 dark:bg-teal-950/30",
    swatch: "bg-teal-500",
    dot: "bg-teal-500",
    label: "ティール",
  },
  sky: {
    border: "border-l-4 border-sky-500",
    bg: "bg-sky-50/60 dark:bg-sky-950/30",
    swatch: "bg-sky-500",
    dot: "bg-sky-500",
    label: "スカイ",
  },
  violet: {
    border: "border-l-4 border-violet-500",
    bg: "bg-violet-50/60 dark:bg-violet-950/30",
    swatch: "bg-violet-500",
    dot: "bg-violet-500",
    label: "バイオレット",
  },
  rose: {
    border: "border-l-4 border-rose-500",
    bg: "bg-rose-50/60 dark:bg-rose-950/30",
    swatch: "bg-rose-500",
    dot: "bg-rose-500",
    label: "ローズ",
  },
  amber: {
    border: "border-l-4 border-amber-500",
    bg: "bg-amber-50/60 dark:bg-amber-950/30",
    swatch: "bg-amber-500",
    dot: "bg-amber-500",
    label: "アンバー",
  },
  emerald: {
    border: "border-l-4 border-emerald-500",
    bg: "bg-emerald-50/60 dark:bg-emerald-950/30",
    swatch: "bg-emerald-500",
    dot: "bg-emerald-500",
    label: "エメラルド",
  },
  zinc: {
    border: "border-l-4 border-zinc-400",
    bg: "bg-zinc-50/60 dark:bg-zinc-900/30",
    swatch: "bg-zinc-400",
    dot: "bg-zinc-400",
    label: "モノクロ",
  },
};

interface HistoryEntry {
  id: string;
  delta: number;
  type: "up" | "down" | "manual" | "reset" | "undo";
  timestamp: number;
}

interface Counter {
  id: string;
  name: string;
  value: number;
  color: CounterColor;
  history: HistoryEntry[];
}

interface UndoSnapshot {
  type: "single" | "all";
  counterId?: string;
  previousValues: { id: string; value: number }[];
}

type SharePayload = { n: string; v: number; col: CounterColor }[];

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "phase1-counter-state";
const MAX_COUNTERS = 10;

function loadFromStorage(): Counter[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.map(
      (c: {
        id?: string;
        name?: string;
        value?: number;
        color?: string;
        history?: HistoryEntry[];
      }) => ({
        id: c.id ?? crypto.randomUUID(),
        name: c.name ?? "カウンター",
        value: typeof c.value === "number" ? c.value : 0,
        color: (c.color && c.color in COLOR_CONFIG
          ? c.color
          : "teal") as CounterColor,
        history: Array.isArray(c.history) ? c.history : [],
      })
    );
  } catch {
    return null;
  }
}

function saveToStorage(counters: Counter[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counters));
  } catch {}
}

function restoreFromUrl(): Counter[] | null {
  if (typeof window === "undefined") return null;
  const param = new URLSearchParams(window.location.search).get("c");
  if (!param) return null;
  const items = decodeState<SharePayload>(param);
  if (!items || !Array.isArray(items)) return null;
  return items.map((item) => ({
    id: crypto.randomUUID(),
    name: item.n ?? "カウンター",
    value: typeof item.v === "number" ? item.v : 0,
    color: (item.col && item.col in COLOR_CONFIG
      ? item.col
      : "teal") as CounterColor,
    history: [],
  }));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createCounter(index: number): Counter {
  return {
    id: crypto.randomUUID(),
    name: `カウンター${index + 1}`,
    value: 0,
    color: COLOR_CYCLE[index % COLOR_CYCLE.length],
    history: [],
  };
}

function withHistoryEntry(
  counter: Counter,
  delta: number,
  type: HistoryEntry["type"]
): Counter {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    delta,
    type,
    timestamp: Date.now(),
  };
  return {
    ...counter,
    value: counter.value + delta,
    history: [...counter.history, entry],
  };
}

// ─── FocusMode ───────────────────────────────────────────────────────────────

interface FocusModeProps {
  counter: Counter;
  onCount: (delta: number) => void;
  onExit: () => void;
  hintVisible: boolean;
}

function FocusMode({ counter, onCount, onExit, hintVisible }: FocusModeProps) {
  const startYRef = useRef(0);
  const isExitDownRef = useRef(false);
  const colorDot = COLOR_CONFIG[counter.color].dot;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isExitDownRef.current = !!(e.target as HTMLElement).closest(
      "[data-exit-btn]"
    );
    startYRef.current = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isExitDownRef.current) return;
    const deltaY = e.clientY - startYRef.current;
    if (deltaY > 30) {
      onCount(-1);
    } else {
      onCount(1);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-background dark:bg-zinc-950 z-50 flex flex-col select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* Exit button */}
      <div className="absolute top-4 left-4" data-exit-btn>
        <button
          data-exit-btn
          onClick={onExit}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors touch-manipulation pointer-events-auto"
          aria-label="集中モードを終了"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Counter display */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${colorDot} flex-shrink-0`} />
          <span className="text-sm font-medium text-muted-foreground">
            {counter.name}
          </span>
        </div>
        <motion.span
          key={counter.value}
          initial={{ scale: 1.03 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.05, ease: "easeOut" }}
          className="text-9xl font-bold tabular-nums leading-none"
          aria-live="polite"
          aria-atomic="true"
        >
          {counter.value}
        </motion.span>
      </div>

      {/* Operation hints */}
      <AnimatePresence>
        {hintVisible && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.4 }}
            className="absolute bottom-14 left-0 right-0 flex flex-col items-center gap-1 pointer-events-none"
          >
            <span className="text-xs text-muted-foreground/60">
              画面どこでもタップで +1
            </span>
            <span className="text-xs text-muted-foreground/60">
              下スワイプで −1
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CounterCard ─────────────────────────────────────────────────────────────

interface CounterCardProps {
  counter: Counter;
  isEditing: boolean;
  canRemove: boolean;
  onCount: (delta: number) => void;
  onSetValue: (value: number) => void;
  onReset: () => void;
  onRemove: () => void;
  onFocus: () => void;
  onEditStart: () => void;
  onEditEnd: () => void;
  onRename: (name: string) => void;
  onColorChange: (color: CounterColor) => void;
}

function CounterCard({
  counter,
  isEditing,
  canRemove,
  onCount,
  onSetValue,
  onReset,
  onRemove,
  onFocus,
  onEditStart,
  onEditEnd,
  onRename,
  onColorChange,
}: CounterCardProps) {
  const [editName, setEditName] = useState(counter.name);
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [inputValue, setInputValue] = useState(String(counter.value));
  const [scalePulse, setScalePulse] = useState(false);
  const prevValueRef = useRef(counter.value);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const valueInputRef = useRef<HTMLInputElement>(null);
  const colorConfig = COLOR_CONFIG[counter.color];

  // Sync external name to edit field
  useEffect(() => {
    if (!isEditing) setEditName(counter.name);
  }, [counter.name, isEditing]);

  // Focus name input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 0);
    }
  }, [isEditing]);

  // Focus value input
  useEffect(() => {
    if (isEditingValue) {
      setTimeout(() => {
        valueInputRef.current?.focus();
        valueInputRef.current?.select();
      }, 0);
    }
  }, [isEditingValue]);

  // Scale pulse on value change
  useEffect(() => {
    if (counter.value !== prevValueRef.current) {
      prevValueRef.current = counter.value;
      setScalePulse(true);
      const t = setTimeout(() => setScalePulse(false), 120);
      return () => clearTimeout(t);
    }
  }, [counter.value]);

  const commitName = () => {
    const trimmed = editName.trim();
    if (trimmed) onRename(trimmed);
    else setEditName(counter.name);
    onEditEnd();
  };

  const commitValue = () => {
    const num = parseInt(inputValue, 10);
    if (!isNaN(num)) onSetValue(num);
    else setInputValue(String(counter.value));
    setIsEditingValue(false);
  };

  const plusLongPress = useLongPress(() => onCount(1));
  const minusLongPress = useLongPress(() => onCount(-1));

  return (
    <div
      className={`rounded-lg overflow-hidden border border-border ${colorConfig.border} ${colorConfig.bg} transition-colors duration-200`}
    >
      <div className="p-3 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-center gap-1 min-h-8">
          {isEditing ? (
            <>
              <input
                ref={nameInputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitName();
                  if (e.key === "Escape") {
                    setEditName(counter.name);
                    onEditEnd();
                  }
                }}
                className="flex-1 min-w-0 text-sm bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
                maxLength={20}
                aria-label="カウンター名"
              />
              <button
                onClick={commitName}
                className="p-1.5 rounded hover:bg-foreground/10 transition-colors flex-shrink-0"
                aria-label="確定"
              >
                <Check className="size-3.5 text-primary" />
              </button>
              {canRemove && (
                <button
                  onClick={onRemove}
                  className="p-1.5 rounded hover:bg-destructive/10 transition-colors flex-shrink-0"
                  aria-label="削除"
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={onEditStart}
                className="flex-1 min-w-0 text-left text-sm text-muted-foreground hover:text-foreground transition-colors truncate group flex items-center gap-1"
                aria-label={`${counter.name}（タップして編集）`}
              >
                <span className="truncate">{counter.name}</span>
                <Pencil className="size-3 flex-shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" />
              </button>
              <button
                onClick={onFocus}
                className="p-1.5 rounded hover:bg-foreground/10 transition-colors flex-shrink-0"
                aria-label="集中モード"
              >
                <Maximize2 className="size-3.5 text-muted-foreground" />
              </button>
            </>
          )}
        </div>

        {/* Color swatches — only in edit mode */}
        {isEditing && (
          <div className="flex gap-1.5 flex-wrap">
            {(Object.keys(COLOR_CONFIG) as CounterColor[]).map((color) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={`w-5 h-5 rounded-full ${COLOR_CONFIG[color].swatch} transition-transform touch-manipulation ${
                  counter.color === color
                    ? "scale-125 ring-2 ring-foreground/30 ring-offset-1"
                    : "hover:scale-110"
                }`}
                aria-label={COLOR_CONFIG[color].label}
                title={COLOR_CONFIG[color].label}
              />
            ))}
          </div>
        )}

        {/* Value display */}
        <div className="flex items-center justify-center py-1">
          {isEditingValue ? (
            <input
              ref={valueInputRef}
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={commitValue}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitValue();
                if (e.key === "Escape") {
                  setInputValue(String(counter.value));
                  setIsEditingValue(false);
                }
              }}
              className="text-4xl font-bold w-28 text-center bg-transparent border-b-2 border-primary focus:outline-none tabular-nums"
              aria-label="カウント値"
            />
          ) : (
            <motion.button
              animate={{ scale: scalePulse ? 1.08 : 1 }}
              transition={{ duration: 0.06, ease: "easeOut" }}
              onClick={() => {
                setInputValue(String(counter.value));
                setIsEditingValue(true);
              }}
              className="text-5xl font-bold tabular-nums cursor-pointer hover:text-primary transition-colors leading-none"
              aria-label={`現在の値 ${counter.value}、タップして直接入力`}
            >
              {counter.value}
            </motion.button>
          )}
        </div>

        {/* +/- buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onCount(-1)}
            {...minusLongPress}
            className="h-11 flex items-center justify-center rounded-md bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/15 transition-colors text-xl font-medium touch-manipulation select-none"
            aria-label="マイナス1"
          >
            −
          </button>
          <button
            onClick={() => onCount(1)}
            {...plusLongPress}
            className="h-11 flex items-center justify-center rounded-md bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/15 transition-colors text-xl font-medium touch-manipulation select-none"
            aria-label="プラス1"
          >
            ＋
          </button>
        </div>

        {/* Reset — only in edit mode */}
        {isEditing && (
          <button
            onClick={() => {
              onReset();
              onEditEnd();
            }}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1 py-0.5"
          >
            <RotateCcw className="size-3" />
            このカウンターをリセット
          </button>
        )}
      </div>
    </div>
  );
}

// ─── CounterTool (main) ───────────────────────────────────────────────────────

export function CounterTool() {
  const [counters, setCounters] = useState<Counter[]>([
    createCounter(0),
    createCounter(1),
  ]);
  const [mounted, setMounted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusCounterId, setFocusCounterId] = useState<string | null>(null);
  const [showResetAllConfirm, setShowResetAllConfirm] = useState(false);
  const [focusHintVisible, setFocusHintVisible] = useState(true);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyboardFocusedIndexRef = useRef(0);

  // Init from URL or localStorage
  useEffect(() => {
    const fromUrl = restoreFromUrl();
    const fromStorage = loadFromStorage();
    if (fromUrl) setCounters(fromUrl);
    else if (fromStorage) setCounters(fromStorage);
    setMounted(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (mounted) saveToStorage(counters);
  }, [counters, mounted]);

  // Focus mode hint auto-hide
  useEffect(() => {
    if (focusCounterId) {
      setFocusHintVisible(true);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => setFocusHintVisible(false), 5000);
    }
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, [focusCounterId]);

  // Stable undo trigger — uses functional setCounters so no deps needed
  const triggerUndo = useCallback(
    (snapshot: UndoSnapshot, durationMs: number, label: string) => {
      toast(label, {
        duration: durationMs,
        action: {
          label: "元に戻す",
          onClick: () => {
            setCounters((prev) =>
              prev.map((c) => {
                const prevVal = snapshot.previousValues.find(
                  (p) => p.id === c.id
                );
                if (!prevVal) return c;
                const delta = prevVal.value - c.value;
                if (delta === 0) return c;
                return withHistoryEntry(c, delta, "undo");
              })
            );
          },
        },
      });
    },
    []
  );

  const handleCount = useCallback((id: string, delta: number) => {
    setCounters((prev) =>
      prev.map((c) =>
        c.id !== id ? c : withHistoryEntry(c, delta, delta > 0 ? "up" : "down")
      )
    );
  }, []);

  const handleSetValue = useCallback((id: string, newValue: number) => {
    setCounters((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const delta = newValue - c.value;
        return withHistoryEntry(c, delta, "manual");
      })
    );
  }, []);

  const handleResetSingle = useCallback(
    (id: string) => {
      const counter = counters.find((c) => c.id === id);
      if (!counter || counter.value === 0) return;
      const snapshot: UndoSnapshot = {
        type: "single",
        counterId: id,
        previousValues: counters.map((c) => ({ id: c.id, value: c.value })),
      };
      setCounters((prev) =>
        prev.map((c) => (c.id !== id ? c : withHistoryEntry(c, -c.value, "reset")))
      );
      triggerUndo(snapshot, 3000, `${counter.name}をリセットしました`);
    },
    [counters, triggerUndo]
  );

  const handleResetAll = useCallback(() => {
    const hasNonZero = counters.some((c) => c.value !== 0);
    if (!hasNonZero) {
      setShowResetAllConfirm(false);
      return;
    }
    const snapshot: UndoSnapshot = {
      type: "all",
      previousValues: counters.map((c) => ({ id: c.id, value: c.value })),
    };
    setCounters((prev) =>
      prev.map((c) => (c.value === 0 ? c : withHistoryEntry(c, -c.value, "reset")))
    );
    setShowResetAllConfirm(false);
    triggerUndo(snapshot, 6000, "全カウンターをリセットしました");
  }, [counters, triggerUndo]);

  const handleAddCounter = useCallback(() => {
    setCounters((prev) => {
      if (prev.length >= MAX_COUNTERS) return prev;
      return [...prev, createCounter(prev.length)];
    });
  }, []);

  const handleRemoveCounter = useCallback(
    (id: string) => {
      setCounters((prev) => {
        if (prev.length <= 1) return prev;
        return prev.filter((c) => c.id !== id);
      });
      if (focusCounterId === id) setFocusCounterId(null);
      setEditingId((prev) => (prev === id ? null : prev));
    },
    [focusCounterId]
  );

  const handleRename = useCallback((id: string, name: string) => {
    setCounters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name } : c))
    );
  }, []);

  const handleColorChange = useCallback((id: string, color: CounterColor) => {
    setCounters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, color } : c))
    );
  }, []);

  const handleShare = useCallback(() => {
    if (typeof window === "undefined") return;
    const payload: SharePayload = counters.map((c) => ({
      n: c.name,
      v: c.value,
      col: c.color,
    }));
    const url = generateShareUrl(payload);
    navigator.clipboard
      .writeText(url)
      .then(() => toast("共有URLをコピーしました"))
      .catch(() =>
        toast("URLのコピーに失敗しました", { description: url })
      );
  }, [counters]);

  // Keyboard shortcuts — stable registration via ref pattern
  const latestRef = useRef({
    counters,
    focusCounterId,
    handleCount,
    handleResetSingle,
    handleAddCounter,
  });
  useEffect(() => {
    latestRef.current = {
      counters,
      focusCounterId,
      handleCount,
      handleResetSingle,
      handleAddCounter,
    };
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;

      const {
        counters: cs,
        focusCounterId: fid,
        handleCount: count,
        handleResetSingle: reset,
        handleAddCounter: add,
      } = latestRef.current;

      if (fid) {
        if (e.key === "Escape") setFocusCounterId(null);
        else if (e.key === " " || e.key === "ArrowUp") {
          e.preventDefault();
          count(fid, 1);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          count(fid, -1);
        }
        return;
      }

      if (e.key >= "1" && e.key <= "9") {
        const idx = parseInt(e.key) - 1;
        if (idx < cs.length) keyboardFocusedIndexRef.current = idx;
        return;
      }

      const focused = cs[keyboardFocusedIndexRef.current];
      if (!focused) return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        count(focused.id, 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        count(focused.id, -1);
      } else if (e.key === "r" && !e.shiftKey) {
        reset(focused.id);
      } else if (e.key === "R" && e.shiftKey) {
        setShowResetAllConfirm(true);
      } else if (e.key === "n" || e.key === "N") {
        add();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []); // register once; reads latest values via latestRef

  const total = counters.reduce((sum, c) => sum + c.value, 0);
  const focusCounter = focusCounterId
    ? (counters.find((c) => c.id === focusCounterId) ?? null)
    : null;

  return (
    <>
      <ToolLayout title="多列カウンター" wide>
        <div className="space-y-4">
          {/* Counter grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {counters.map((counter) => (
              <CounterCard
                key={counter.id}
                counter={counter}
                isEditing={editingId === counter.id}
                canRemove={counters.length > 1}
                onCount={(delta) => handleCount(counter.id, delta)}
                onSetValue={(v) => handleSetValue(counter.id, v)}
                onReset={() => handleResetSingle(counter.id)}
                onRemove={() => handleRemoveCounter(counter.id)}
                onFocus={() => setFocusCounterId(counter.id)}
                onEditStart={() =>
                  setEditingId((prev) =>
                    prev === counter.id ? null : counter.id
                  )
                }
                onEditEnd={() => setEditingId(null)}
                onRename={(name) => handleRename(counter.id, name)}
                onColorChange={(color) => handleColorChange(counter.id, color)}
              />
            ))}
          </div>

          {/* Add button */}
          {counters.length < MAX_COUNTERS && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCounter}
                className="gap-2"
              >
                <Plus className="size-3.5" />
                追加
              </Button>
            </div>
          )}

          {/* Footer: total + controls */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              合計:{" "}
              <span className="font-semibold text-foreground">{total}</span>
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="gap-1.5 h-8 text-xs px-2"
              >
                <Share2 className="size-3.5" />
                共有
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetAllConfirm(true)}
                className="gap-1.5 h-8 text-xs px-2 text-muted-foreground hover:text-destructive"
              >
                <RotateCcw className="size-3.5" />
                全体リセット
              </Button>
            </div>
          </div>
        </div>

        {/* Reset all confirm dialog */}
        <Dialog
          open={showResetAllConfirm}
          onOpenChange={(open) => setShowResetAllConfirm(open)}
        >
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>全体リセット</DialogTitle>
              <DialogDescription>
                全カウンターを0に戻します。6秒間は「元に戻す」で取り消せます。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton={false}>
              <Button
                variant="outline"
                onClick={() => setShowResetAllConfirm(false)}
              >
                キャンセル
              </Button>
              <Button variant="destructive" onClick={handleResetAll}>
                リセット
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ToolLayout>

      {/* Focus mode overlay */}
      <AnimatePresence>
        {focusCounter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50"
          >
            <FocusMode
              counter={focusCounter}
              onCount={(delta) => handleCount(focusCounter.id, delta)}
              onExit={() => setFocusCounterId(null)}
              hintVisible={focusHintVisible}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
