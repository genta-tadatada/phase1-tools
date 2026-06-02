"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";

const STORAGE_KEY = "phase1-roulette-state";
const DEFAULT_ITEMS = ["りんご", "バナナ", "いちご"];

// 項目ごとのカラーパレット（8色サイクル）
const PALETTE = [
  { bg: "from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20",         border: "border-rose-200/80 dark:border-rose-700/30",     dot: "bg-rose-400",     grad: "from-rose-400 to-pink-400",      text: "text-rose-600 dark:text-rose-400"    },
  { bg: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20", border: "border-violet-200/80 dark:border-violet-700/30", dot: "bg-violet-400",   grad: "from-violet-400 to-purple-400",  text: "text-violet-600 dark:text-violet-400"},
  { bg: "from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/20",           border: "border-sky-200/80 dark:border-sky-700/30",       dot: "bg-sky-400",      grad: "from-sky-400 to-blue-400",       text: "text-sky-600 dark:text-sky-400"      },
  { bg: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20",   border: "border-emerald-200/80 dark:border-emerald-700/30",dot: "bg-emerald-400", grad: "from-emerald-400 to-teal-400",   text: "text-emerald-600 dark:text-emerald-400"},
  { bg: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20",   border: "border-orange-200/80 dark:border-orange-700/30", dot: "bg-orange-400",   grad: "from-orange-400 to-amber-400",   text: "text-orange-600 dark:text-orange-400"},
  { bg: "from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/30 dark:to-pink-950/20",   border: "border-fuchsia-200/80 dark:border-fuchsia-700/30",dot: "bg-fuchsia-400", grad: "from-fuchsia-400 to-pink-400",   text: "text-fuchsia-600 dark:text-fuchsia-400"},
  { bg: "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20",   border: "border-amber-200/80 dark:border-amber-700/30",   dot: "bg-amber-400",    grad: "from-amber-400 to-yellow-400",   text: "text-amber-600 dark:text-amber-500"  },
  { bg: "from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/20",         border: "border-teal-200/80 dark:border-teal-700/30",     dot: "bg-teal-400",     grad: "from-teal-400 to-cyan-400",      text: "text-teal-600 dark:text-teal-400"    },
];

export function RouletteTool() {
  const [items, setItems] = useState<string[]>(DEFAULT_ITEMS);
  const [newItem, setNewItem] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [cumulativeMode, setCumulativeMode] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const cumulativeModeRef = useRef(false);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { cumulativeModeRef.current = cumulativeMode; }, [cumulativeMode]);
  useEffect(() => () => { if (spinTimerRef.current) clearTimeout(spinTimerRef.current); }, []);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const s = JSON.parse(saved);
        if (Array.isArray(s.items) && s.items.length >= 2) setItems(s.items);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ items })); } catch { /* ignore */ }
  }, [mounted, items]);

  const addItem = () => {
    const v = newItem.trim();
    if (!v) return;
    setItems((prev) => [...prev, v]);
    setNewItem("");
    setError("");
  };

  const removeItem = (i: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
    setSelectedIndex(null);
  };

  const removeSelected = () => {
    if (selectedIndex === null) return;
    const winner = items[selectedIndex];
    setHistory((prev) => [winner, ...prev]);
    setItems((prev) => prev.filter((_, idx) => idx !== selectedIndex));
    setSelectedIndex(null);
  };

  const spin = useCallback(() => {
    if (items.length < 2) { setError("2個以上の選択肢を追加してください"); return; }
    if (spinning) return;
    setError("");
    setSpinning(true);
    setSelectedIndex(null);
    const winIndex = Math.floor(Math.random() * items.length);
    const steps = 32;
    const intervals = Array.from({ length: steps }, (_, i) => Math.round(35 + (i / steps) ** 2.2 * 220));
    let step = 0;
    let current = 0;
    const advance = () => {
      if (step < steps - 1) {
        current = (current + 1) % items.length;
        setHighlightIndex(current);
        spinTimerRef.current = setTimeout(advance, intervals[step]);
        step++;
      } else {
        setHighlightIndex(winIndex);
        setSpinning(false);
        setSelectedIndex(winIndex);
        if (cumulativeModeRef.current) {
          const winner = items[winIndex];
          spinTimerRef.current = setTimeout(() => {
            setHistory((prev) => [winner, ...prev]);
            setItems((prev) => prev.filter((_, idx) => idx !== winIndex));
            setSelectedIndex(null);
          }, 1800);
        }
      }
    };
    spinTimerRef.current = setTimeout(advance, intervals[0]);
  }, [items, spinning]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Enter") { e.preventDefault(); spin(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [spin]);

  if (!mounted) return null;

  const activeIdx = spinning ? highlightIndex : selectedIndex;

  return (
    <ToolLayout title="ルーレット" adVisible={!spinning}>
      <div className="flex flex-col gap-5">

        {/* 入力 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="選択肢を入力..."
            className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={addItem}
            className="h-10 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-400 to-purple-400 text-white shadow-sm"
          >
            追加
          </motion.button>
        </div>

        {/* スピン表示エリア */}
        <div className="rounded-2xl border border-border/60 overflow-hidden">
          {items.map((item, i) => {
            const c = PALETTE[i % PALETTE.length];
            const isActive = activeIdx === i;
            return (
              <motion.div
                key={i}
                animate={{
                  scale: isActive ? 1.02 : 1,
                  backgroundColor: "transparent",
                }}
                transition={{ duration: 0.07 }}
                className={`relative flex items-center justify-between px-4 py-3 border-b border-border/40 last:border-b-0 transition-colors ${
                  isActive ? `bg-gradient-to-r ${c.bg}` : "hover:bg-muted/30"
                }`}
              >
                {/* 左のカラードット */}
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.dot} ${isActive ? "scale-125" : "opacity-60"} transition-all`} />
                  <span className={`text-sm font-medium ${isActive ? c.text : ""}`}>{item}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isActive && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`text-sm font-bold ${c.text}`}
                    >
                      {spinning ? "▶" : "✓"}
                    </motion.span>
                  )}
                  <button
                    onClick={() => removeItem(i)}
                    disabled={spinning}
                    className="text-muted-foreground/40 hover:text-destructive text-xs transition-colors disabled:opacity-20 px-1"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        {/* 当選結果 */}
        <AnimatePresence>
          {selectedIndex !== null && !spinning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="flex flex-col items-center gap-3 py-2"
            >
              <div className={`w-full py-4 rounded-2xl bg-gradient-to-r ${PALETTE[selectedIndex % PALETTE.length].grad} text-white text-center shadow-lg`}>
                <p className="text-xs font-medium opacity-80 mb-1">🎉 当選</p>
                <p className="text-4xl sm:text-5xl font-black">{items[selectedIndex]}</p>
              </div>
              {!cumulativeMode && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={removeSelected}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors border border-border rounded-full px-4 py-1.5 hover:border-destructive/40"
                >
                  この結果を除外して次へ
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 累積モードトグル */}
        <label className="flex items-center gap-3 cursor-pointer self-center">
          <button
            role="switch"
            aria-checked={cumulativeMode}
            onClick={() => { setCumulativeMode(!cumulativeMode); setSelectedIndex(null); }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              cumulativeMode ? "bg-gradient-to-r from-violet-400 to-purple-400" : "bg-muted border border-border"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${cumulativeMode ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          <span className="text-sm text-muted-foreground">累積モード（当選を自動除外）</span>
        </label>

        {/* スタートボタン */}
        <motion.button
          onClick={spin}
          disabled={spinning || items.length < 2}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          className="w-full sm:w-64 mx-auto h-14 rounded-2xl text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 text-white shadow-lg disabled:opacity-50 transition-opacity"
        >
          {spinning ? (
            <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }} className="inline-block">
              🎡
            </motion.span>
          ) : "🎡 スタート"}
        </motion.button>
        <div className="relative flex justify-center">
          {showShortcuts && (
            <div className="absolute bottom-full mb-2 w-64 rounded-lg border border-border bg-background shadow-lg p-3 z-50 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-2">キーボードショートカット</p>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Enter</span><span>スタート</span></div>
              </div>
            </div>
          )}
          <button
            onClick={() => setShowShortcuts(v => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-border bg-card text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
            aria-label="キーボードショートカット"
          >?</button>
        </div>

        {/* 当選履歴 */}
        <AnimatePresence>
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/60 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
                <span className="text-xs font-medium text-muted-foreground">当選履歴（{history.length}件）</span>
                <button onClick={() => setHistory([])} className="text-xs text-muted-foreground/50 hover:text-destructive transition-colors">クリア</button>
              </div>
              <div className="px-4 py-3 flex flex-wrap gap-1.5">
                {history.map((item, i) => {
                  const c = PALETTE[i % PALETTE.length];
                  return (
                    <span key={i} className={`text-xs rounded-full px-3 py-1 bg-gradient-to-r ${c.bg} border ${c.border} ${c.text} font-medium`}>
                      {item}
                    </span>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </ToolLayout>
  );
}
