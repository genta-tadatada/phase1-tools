"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";

const STORAGE_KEY = "phase1-roulette-state";
const DEFAULT_ITEMS = ["1", "2", "3"];

export function RouletteTool() {
  const [items, setItems] = useState<string[]>(DEFAULT_ITEMS);
  const [newItem, setNewItem] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");

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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
    } catch { /* ignore */ }
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

  const spin = useCallback(() => {
    if (items.length < 2) { setError("2個以上の選択肢を追加してください"); return; }
    if (spinning) return;
    setError("");
    setSpinning(true);
    setSelectedIndex(null);

    const winIndex = Math.floor(Math.random() * items.length);
    const steps = 30;
    const intervals = Array.from({ length: steps }, (_, i) =>
      Math.round(40 + (i / steps) ** 2 * 200)
    );
    let step = 0;
    let current = 0;
    const advance = () => {
      if (step < steps - 1) {
        current = (current + 1) % items.length;
        setHighlightIndex(current);
        setTimeout(advance, intervals[step]);
        step++;
      } else {
        setHighlightIndex(winIndex);
        setSpinning(false);
        setSelectedIndex(winIndex);
      }
    };
    setTimeout(advance, intervals[0]);
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

  return (
    <ToolLayout title="ルーレット">
      <div className="flex flex-col gap-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="選択肢を入力..."
            className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <button
            onClick={addItem}
            className="h-9 px-4 rounded-md text-sm font-medium transition-colors"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}
          >
            追加
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {items.map((item, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                selectedIndex === i ? "bg-accent/10 border border-accent" : "bg-muted"
              }`}
            >
              <span className={`text-sm ${selectedIndex === i ? "font-bold text-accent" : ""}`}>{item}</span>
              <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive text-xs ml-2 transition-colors">×</button>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="rounded-xl border-2 border-border overflow-hidden">
          {items.map((item, i) => (
            <motion.div
              key={i}
              animate={{
                backgroundColor: (spinning ? highlightIndex : selectedIndex) === i ? "color-mix(in oklch, var(--accent) 15%, transparent)" : "transparent",
                scale: (spinning ? highlightIndex : selectedIndex) === i ? 1.02 : 1,
              }}
              transition={{ duration: 0.08 }}
              className={`flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0 ${
                (spinning ? highlightIndex : selectedIndex) === i ? "border-l-2 border-l-accent font-bold" : ""
              }`}
            >
              <span className="text-sm">{item}</span>
              {(spinning ? highlightIndex : selectedIndex) === i && (
                <span className="text-accent text-xs">{spinning ? "▶" : "✓"}</span>
              )}
            </motion.div>
          ))}
        </div>

        {selectedIndex !== null && !spinning && (
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center text-2xl font-bold"
            style={{ color: "var(--accent)" }}
          >
            {items[selectedIndex]}
          </motion.p>
        )}

        <button
          onClick={spin}
          disabled={spinning || items.length < 2}
          className="w-full sm:w-64 mx-auto h-14 rounded-xl text-xl font-bold transition-colors disabled:opacity-50"
          style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          {spinning ? "スピン中..." : "スタート (Enter)"}
        </button>
      </div>
    </ToolLayout>
  );
}
