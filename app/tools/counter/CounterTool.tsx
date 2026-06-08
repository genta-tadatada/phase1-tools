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
  History,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { DarkModeToggle } from "@/components/tool-layout/DarkModeToggle";
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
  | "sky"
  | "violet"
  | "rose"
  | "fuchsia"
  | "yellow"
  | "orange"
  | "emerald"
  | "zinc";

// Counter 1 = sky (fixed). Rest alternates cool/warm for max grid contrast.
// 2-col pairs: sky×orange, violet×yellow, rose×emerald, fuchsia×zinc
const COLOR_CYCLE: CounterColor[] = [
  "sky",     // 1: cool  200°
  "orange",  // 2: warm   25°
  "violet",  // 3: cool  265°
  "yellow",  // 4: warm   55°
  "rose",    // 5: warm  330°
  "emerald", // 6: cool  150°
  "fuchsia", // 7: warm  300°
  "zinc",    // 8: neutral
];

const COLOR_CONFIG: Record<
  CounterColor,
  { ring: string; bg: string; topLine: string; swatch: string; label: string }
> = {
  sky:     { ring: "ring-1 ring-sky-300/60 dark:ring-sky-700/40",           bg: "bg-sky-50/70 dark:bg-sky-950/20",           topLine: "bg-sky-500",     swatch: "bg-sky-500",     label: "スカイ" },
  violet:  { ring: "ring-1 ring-violet-300/60 dark:ring-violet-700/40",     bg: "bg-violet-50/70 dark:bg-violet-950/20",     topLine: "bg-violet-500",  swatch: "bg-violet-500",  label: "バイオレット" },
  rose:    { ring: "ring-1 ring-rose-300/60 dark:ring-rose-700/40",         bg: "bg-rose-50/70 dark:bg-rose-950/20",         topLine: "bg-rose-500",    swatch: "bg-rose-500",    label: "ローズ" },
  fuchsia: { ring: "ring-1 ring-fuchsia-300/60 dark:ring-fuchsia-700/40",   bg: "bg-fuchsia-50/70 dark:bg-fuchsia-950/20",   topLine: "bg-fuchsia-500", swatch: "bg-fuchsia-500", label: "フクシア" },
  yellow:  { ring: "ring-1 ring-yellow-300/60 dark:ring-yellow-700/40",     bg: "bg-yellow-50/70 dark:bg-yellow-950/20",     topLine: "bg-yellow-500",  swatch: "bg-yellow-500",  label: "イエロー" },
  orange:  { ring: "ring-1 ring-orange-300/60 dark:ring-orange-700/40",     bg: "bg-orange-50/70 dark:bg-orange-950/20",     topLine: "bg-orange-500",  swatch: "bg-orange-500",  label: "オレンジ" },
  emerald: { ring: "ring-1 ring-emerald-300/60 dark:ring-emerald-700/40",   bg: "bg-emerald-50/70 dark:bg-emerald-950/20",   topLine: "bg-emerald-500", swatch: "bg-emerald-500", label: "エメラルド" },
  zinc:    { ring: "ring-1 ring-zinc-300/60 dark:ring-zinc-600/40",         bg: "bg-zinc-50/70 dark:bg-zinc-900/20",         topLine: "bg-zinc-400",    swatch: "bg-zinc-400",    label: "モノクロ" },
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

interface GlobalEvent {
  id: string;
  type: "reset-all";
  timestamp: number;
}

interface DisplayEntry {
  id: string;
  type: HistoryEntry["type"] | "reset-all";
  timestamp: number;
  totalDelta: number;
  count: number;
  counterName?: string;
  counterColor?: CounterColor;
}

// generateId() requires secure context (HTTPS/localhost).
// This fallback covers HTTP dev access from mobile on local network.
function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try { return crypto.randomUUID(); } catch { /* non-secure context */ }
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "phase1-counter-state";
const EVENTS_KEY = "phase1-counter-events";
const MAX_COUNTERS = 16;
const MAX_HISTORY = 200;
const MAX_VALUE = 999999;
const MIN_VALUE = -99999;

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
        id: c.id ?? generateId(),
        name: c.name ?? "カウンター",
        value: typeof c.value === "number" ? c.value : 0,
        color: (c.color && c.color in COLOR_CONFIG
          ? c.color
          : "sky") as CounterColor,
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

function loadEvents(): GlobalEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GlobalEvent[];
  } catch { return []; }
}

function saveEvents(events: GlobalEvent[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(EVENTS_KEY, JSON.stringify(events)); } catch {}
}

function restoreFromUrl(): Counter[] | null {
  if (typeof window === "undefined") return null;
  const param = new URLSearchParams(window.location.search).get("c");
  if (!param) return null;
  const items = decodeState<SharePayload>(param);
  if (!items || !Array.isArray(items)) return null;
  return items.map((item) => ({
    id: generateId(),
    name: item.n ?? "カウンター",
    value: typeof item.v === "number" ? item.v : 0,
    color: (item.col && item.col in COLOR_CONFIG
      ? item.col
      : "sky") as CounterColor,
    history: [],
  }));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createCounter(index: number): Counter {
  return {
    id: generateId(),
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
  const newValue = Math.max(MIN_VALUE, Math.min(MAX_VALUE, counter.value + delta));
  const actualDelta = newValue - counter.value;
  if (actualDelta === 0) return counter;
  const entry: HistoryEntry = {
    id: generateId(),
    delta: actualDelta,
    type,
    timestamp: Date.now(),
  };
  const next = [...counter.history, entry];
  return {
    ...counter,
    value: newValue,
    history: next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next,
  };
}

function getValueFontClass(value: number): string {
  const len = value.toString().length;
  if (len <= 4) return "text-5xl";
  if (len <= 5) return "text-4xl";
  return "text-3xl";
}

function formatHistoryDelta(entry: { type: string; totalDelta: number; count: number }): string {
  const sign = entry.totalDelta >= 0 ? "+" : "";
  switch (entry.type) {
    case "reset": return "→ 0";
    case "undo": return `↩ ${sign}${entry.totalDelta}`;
    case "manual": return `手動 ${sign}${entry.totalDelta}`;
    default: return `${sign}${entry.totalDelta}`;
  }
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "今";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}時間前`;
  return `${Math.floor(diff / 86_400_000)}日前`;
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
  const startXRef = useRef(0);
  const isExitDownRef = useRef(false);
  const colorSwatch = COLOR_CONFIG[counter.color].swatch;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return; // ignore secondary touch points (multi-touch)
    isExitDownRef.current = !!(e.target as HTMLElement).closest("[data-exit-btn]");
    startYRef.current = e.clientY;
    startXRef.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    if (isExitDownRef.current) return;
    const deltaY = e.clientY - startYRef.current;
    const deltaX = e.clientX - startXRef.current;
    // Down-swipe: clearly vertical movement downward (not a diagonal/horizontal swipe)
    if (deltaY > 30 && Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
      onCount(-1);
    } else if (Math.abs(deltaY) <= 30) {
      onCount(1); // tap or negligible movement
    }
    // Ignore ambiguous diagonal gestures (deltaY > 30 but mostly horizontal)
  };

  return (
    <div
      className="fixed inset-0 bg-background dark:bg-zinc-950 z-50 flex flex-col select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* Top color line — subtle accent showing which counter is active */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${colorSwatch} opacity-70`} />

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
        <span className="text-sm font-medium text-muted-foreground tracking-wide">
          {counter.name}
        </span>
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
            <span className="text-xs text-muted-foreground/50">
              画面どこでもタップで +1
            </span>
            <span className="text-xs text-muted-foreground/50">
              下スワイプで −1
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dark mode toggle — bottom-right, unobtrusive */}
      <div className="absolute bottom-4 right-4 opacity-50 hover:opacity-100 transition-opacity pointer-events-auto">
        <DarkModeToggle />
      </div>
    </div>
  );
}

// ─── CounterCard ─────────────────────────────────────────────────────────────

interface CounterCardProps {
  counter: Counter;
  isEditing: boolean;
  canRemove: boolean;
  isKeyboardFocused: boolean;
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
  isKeyboardFocused,
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

  const { suppressClick: plusSuppressClick, ...plusEvents } = useLongPress(() => onCount(1));
  const { suppressClick: minusSuppressClick, ...minusEvents } = useLongPress(() => onCount(-1));

  return (
    <div className={`rounded-lg overflow-hidden shadow-sm ${colorConfig.ring} ${colorConfig.bg} transition-shadow duration-200 hover:shadow-md ${isKeyboardFocused ? "outline outline-2 outline-primary/50 outline-offset-1" : ""}`}>
      {/* Top color accent */}
      <div className={`h-[2px] ${colorConfig.topLine} opacity-80`} />
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
          <div className="flex gap-2 flex-wrap">
            {COLOR_CYCLE.map((color) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={`w-7 h-7 rounded-full ${COLOR_CONFIG[color].swatch} transition-transform touch-manipulation ${
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
              className={`${getValueFontClass(counter.value)} font-bold tabular-nums cursor-pointer hover:text-primary transition-colors leading-none`}
              aria-label={`現在の値 ${counter.value}、タップして直接入力`}
            >
              {counter.value}
            </motion.button>
          )}
        </div>

        {/* +/- buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { if (!minusSuppressClick()) onCount(-1); }}
            {...minusEvents}
            className="h-13 flex items-center justify-center rounded-md bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/15 transition-colors text-xl font-medium touch-manipulation select-none"
            aria-label="マイナス1"
          >
            −
          </button>
          <button
            onClick={() => { if (!plusSuppressClick()) onCount(1); }}
            {...plusEvents}
            className="h-13 flex items-center justify-center rounded-md bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/15 transition-colors text-xl font-medium touch-manipulation select-none"
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
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [focusHintVisible, setFocusHintVisible] = useState(true);
  const [keyboardFocusedIndex, setKeyboardFocusedIndex] = useState(0);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [globalEvents, setGlobalEvents] = useState<GlobalEvent[]>([]);
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Init from URL or localStorage
  useEffect(() => {
    const fromUrl = restoreFromUrl();
    const fromStorage = loadFromStorage();
    if (fromUrl) setCounters(fromUrl);
    else if (fromStorage) setCounters(fromStorage);
    setGlobalEvents(loadEvents());
    setMounted(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (mounted) saveToStorage(counters);
  }, [counters, mounted]);

  useEffect(() => {
    if (mounted) saveEvents(globalEvents);
  }, [globalEvents, mounted]);

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
      prev.map((c) => (c.value === 0 ? c : { ...c, value: 0 }))
    );
    setGlobalEvents((prev) => [
      ...prev,
      { id: generateId(), type: "reset-all" as const, timestamp: Date.now() },
    ]);
    setShowResetAllConfirm(false);
    triggerUndo(snapshot, 6000, "全カウンターをリセットしました");
  }, [counters, triggerUndo]);

  const handleAddCounter = useCallback(() => {
    setCounters((prev) => {
      if (prev.length >= MAX_COUNTERS) return prev;
      return [
        ...prev,
        {
          id: generateId(),
          name: `カウンター${prev.length + 1}`,
          value: 0,
          color: COLOR_CYCLE[prev.length % COLOR_CYCLE.length],
          history: [],
        },
      ];
    });
  }, []);

  const handleRemoveCounter = useCallback((id: string) => {
    setDeleteConfirmId(id);
  }, []);

  const handleConfirmRemove = useCallback(() => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setCounters((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((c) => c.id !== id);
    });
    setFocusCounterId((prev) => (prev === id ? null : prev));
    setEditingId((prev) => (prev === id ? null : prev));
    setDeleteConfirmId(null);
  }, [deleteConfirmId]);

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

  const handleDeleteAll = useCallback(() => {
    setCounters([createCounter(0)]);
    setEditingId(null);
    setFocusCounterId(null);
    setShowDeleteAllConfirm(false);
    setGlobalEvents([]);
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
      .then(() => {
        toast("共有URLをコピーしました");
        setShareSuccess(true);
        if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
        shareTimerRef.current = setTimeout(() => setShareSuccess(false), 2000);
      })
      .catch(() => toast("URLのコピーに失敗しました", { description: url }));
  }, [counters]);

  // Keyboard shortcuts — stable registration via ref pattern
  const latestRef = useRef({
    counters,
    focusCounterId,
    handleCount,
    handleResetSingle,
    handleAddCounter,
    keyboardFocusedIndex,
  });
  useEffect(() => {
    latestRef.current = {
      counters,
      focusCounterId,
      handleCount,
      handleResetSingle,
      handleAddCounter,
      keyboardFocusedIndex,
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
        keyboardFocusedIndex: kfi,
      } = latestRef.current;

      if (fid) {
        if (e.key === "Escape") setFocusCounterId(null);
        else if (e.key === " " || e.key === "ArrowUp" || e.key === "+") {
          e.preventDefault();
          count(fid, 1);
        } else if (e.key === "ArrowDown" || e.key === "-") {
          e.preventDefault();
          count(fid, -1);
        }
        return;
      }

      if (e.key >= "1" && e.key <= "9") {
        const idx = parseInt(e.key) - 1;
        if (idx < cs.length) setKeyboardFocusedIndex(idx);
        return;
      }

      const focused = cs[kfi];
      if (!focused) return;

      if (e.key === "ArrowUp" || e.key === "+") {
        e.preventDefault();
        count(focused.id, 1);
      } else if (e.key === "ArrowDown" || e.key === "-") {
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

  const allHistory: Array<
    ({ counterName: string; counterColor: CounterColor } & HistoryEntry) | GlobalEvent
  > = [
    ...counters.flatMap((c) =>
      c.history.map((h) => ({ ...h, counterName: c.name, counterColor: c.color }))
    ),
    ...globalEvents,
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 200);

  // 60秒以内の同カウンター・同方向ボタン操作をひとまとめにする
  const MERGE_WINDOW_MS = 60_000;
  const groupedHistory = allHistory.reduce<DisplayEntry[]>((acc, raw) => {
    const last = acc[acc.length - 1];

    if (raw.type === "reset-all") {
      acc.push({ id: raw.id, type: raw.type, timestamp: raw.timestamp, totalDelta: 0, count: 1 });
      return acc;
    }

    // raw は HistoryEntry & { counterName, counterColor }
    const isBtn = raw.type === "up" || raw.type === "down";
    const withinWindow = last ? last.timestamp - raw.timestamp <= MERGE_WINDOW_MS : false;

    if (
      isBtn &&
      last &&
      (last.type === "up" || last.type === "down") &&
      last.type === raw.type &&
      last.counterName === raw.counterName &&
      withinWindow
    ) {
      last.totalDelta += raw.delta;
      last.count += 1;
    } else {
      acc.push({
        id: raw.id,
        type: raw.type,
        timestamp: raw.timestamp,
        totalDelta: raw.delta,
        count: 1,
        counterName: raw.counterName,
        counterColor: raw.counterColor,
      });
    }
    return acc;
  }, []);
  const focusCounter = focusCounterId
    ? (counters.find((c) => c.id === focusCounterId) ?? null)
    : null;

  return (
    <>
      <ToolLayout title="マルチカウンター" wide adVisible>
        <div className="space-y-4">
          {/* Counter grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {counters.map((counter, idx) => (
              <CounterCard
                key={counter.id}
                counter={counter}
                isEditing={editingId === counter.id}
                canRemove={counters.length > 1}
                isKeyboardFocused={idx === keyboardFocusedIndex}
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

          {/* Unified history panel */}
          {groupedHistory.length > 0 && (
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <button
                onClick={() => setShowAllHistory((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <History className="size-3.5" />
                  変更履歴
                  <span className="text-muted-foreground/50">（{groupedHistory.length}件）</span>
                </span>
                <ChevronDown className={`size-3.5 transition-transform duration-150 ${showAllHistory ? "rotate-180" : ""}`} />
              </button>
              {showAllHistory && (
                <div className="border-t border-border/40 max-h-52 overflow-y-auto">
                  {groupedHistory.map((entry) =>
                    entry.type === "reset-all" ? (
                      <div
                        key={entry.id}
                        className="grid grid-cols-[auto_1fr_auto] gap-x-3 items-center px-4 py-1.5 border-b border-border/20 last:border-0 text-xs"
                      >
                        <RotateCcw className="size-3 text-muted-foreground/50 flex-shrink-0" />
                        <span className="text-muted-foreground/70">全体リセット</span>
                        <span className="text-muted-foreground/40 flex-shrink-0">{formatRelativeTime(entry.timestamp)}</span>
                      </div>
                    ) : (
                      <div
                        key={entry.id}
                        className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 items-center px-4 py-1.5 border-b border-border/20 last:border-0 text-xs"
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${COLOR_CONFIG[entry.counterColor ?? "zinc"].swatch}`} />
                        <span className="text-muted-foreground truncate">{entry.counterName}</span>
                        <span className={`font-mono font-medium tabular-nums ${
                          entry.type === "reset" || entry.type === "undo"
                            ? "text-muted-foreground"
                            : entry.totalDelta > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-500 dark:text-rose-400"
                        }`}>
                          {formatHistoryDelta(entry)}
                        </span>
                        <span className="text-muted-foreground/40 flex-shrink-0">{formatRelativeTime(entry.timestamp)}</span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer: total card (left) + action buttons (right) */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            {/* Total — takes available left space */}
            <div className="flex flex-1 items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 min-w-0">
              <span className="text-xs text-muted-foreground tracking-widest uppercase">合計</span>
              <span className="text-3xl font-bold tabular-nums">{total}</span>
            </div>
            {/* Action buttons — icon-only on mobile, icon+label on sm+ */}
            <div className="flex gap-1.5 flex-shrink-0 relative">
              {/* Keyboard shortcuts popup */}
              {showShortcuts && (
                <div className="absolute bottom-full right-0 mb-2 w-64 rounded-lg border border-border bg-background shadow-lg p-3 z-50 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground mb-2">キーボードショートカット</p>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>1〜9</span><span>カウンターを選択</span></div>
                    <div className="flex justify-between"><span>↑ / +</span><span>+1</span></div>
                    <div className="flex justify-between"><span>↓ / −</span><span>−1</span></div>
                    <div className="flex justify-between"><span>r</span><span>選択中をリセット</span></div>
                    <div className="flex justify-between"><span>Shift+R</span><span>全体リセット</span></div>
                    <div className="flex justify-between"><span>n</span><span>カウンター追加</span></div>
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShortcuts((v) => !v)}
                aria-label="キーボードショートカット"
                className="h-9 w-9 px-0 text-muted-foreground font-bold"
              >
                ?
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-1.5 h-9 px-2 sm:px-3"
              >
                {shareSuccess ? <Check className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
                <span className="hidden sm:inline text-sm">{shareSuccess ? "コピー済" : "共有"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetAllConfirm(true)}
                className="gap-1.5 h-9 px-2 sm:px-3 text-muted-foreground hover:text-destructive hover:border-destructive/50"
              >
                <RotateCcw className="size-4" />
                <span className="hidden sm:inline text-sm">全体リセット</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteAllConfirm(true)}
                className="gap-1.5 h-9 px-2 sm:px-3 text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5"
              >
                <Trash2 className="size-4" />
                <span className="hidden sm:inline text-sm">全消去</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Delete all confirm dialog */}
        <Dialog
          open={showDeleteAllConfirm}
          onOpenChange={(open) => setShowDeleteAllConfirm(open)}
        >
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>全消去</DialogTitle>
              <DialogDescription>
                全カウンターと変更履歴をすべて削除します。この操作は取り消せません。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton={false}>
              <Button
                variant="outline"
                onClick={() => setShowDeleteAllConfirm(false)}
              >
                キャンセル
              </Button>
              <Button variant="destructive" onClick={handleDeleteAll}>
                削除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Individual counter delete confirm dialog */}
        <Dialog
          open={deleteConfirmId !== null}
          onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
        >
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>カウンターを削除</DialogTitle>
              <DialogDescription>
                「{counters.find((c) => c.id === deleteConfirmId)?.name ?? "このカウンター"}」を削除します。この操作は取り消せません。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton={false}>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                キャンセル
              </Button>
              <Button variant="destructive" onClick={handleConfirmRemove}>
                削除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
