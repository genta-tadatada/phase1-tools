"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, RotateCcw, Share2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { toast } from "sonner";
import { encodeState, decodeState, generateShareUrl } from "@/lib/share";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LotEntry {
  id: string;
  label: string;
  totalCount: number;
  remaining: number;
}

type DrawAnimation = "scratch" | "envelope" | "instant";
type LotMode = "custom" | "number";

interface DrawRecord {
  id: string;
  label: string;
  drawnAt: number;
}

interface LotState {
  phase: "setup" | "drawing" | "complete";
  mode: LotMode;
  entries: LotEntry[];
  numberMax: number;
  numberDrawn: number[];
  drawAnimation: DrawAnimation;
  records: DrawRecord[];
  currentResult: string | null;
  isAnimating: boolean;
}

interface SharePayload {
  mode: LotMode;
  entries?: { l: string; c: number }[];
  max?: number;
  anim: DrawAnimation;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "phase1-lot-settings";
const GACHA_COLORS = ["#f43f5e", "#8b5cf6", "#0ea5e9", "#10b981", "#f97316"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try { return crypto.randomUUID(); } catch { /* fallback */ }
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function drawFromEntries(entries: LotEntry[]): { result: LotEntry; updated: LotEntry[] } | null {
  const pool: LotEntry[] = entries.filter((e) => e.remaining > 0);
  if (pool.length === 0) return null;
  const totalRemaining = pool.reduce((sum, e) => sum + e.remaining, 0);
  let rand = Math.floor(Math.random() * totalRemaining);
  let chosen: LotEntry | null = null;
  for (const e of pool) {
    if (rand < e.remaining) { chosen = e; break; }
    rand -= e.remaining;
  }
  if (!chosen) return null;
  const updated = entries.map((e) =>
    e.id === chosen!.id ? { ...e, remaining: e.remaining - 1 } : e
  );
  return { result: chosen, updated };
}

// ─── InstantCard ─────────────────────────────────────────────────────────────

function InstantCard({ result, onDone }: { result: string; onDone: () => void }) {
  const [displayText, setDisplayText] = useState("?");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const steps = 10;
    let step = 0;
    const decoys = ["?", "??", "?", "??", "?"];
    const tick = () => {
      step++;
      if (step < steps) {
        setDisplayText(decoys[step % decoys.length]);
        setTimeout(tick, 30 + step * 8);
      } else {
        setDisplayText(result);
        setRevealed(true);
      }
    };
    setTimeout(tick, 30);
  }, [result]);

  useEffect(() => {
    if (revealed) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
  }, [revealed, onDone]);

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <motion.div
        className="w-56 h-32 rounded-xl shadow-md border border-border bg-card flex items-center justify-center"
        animate={revealed ? { scale: [1, 1.1, 1], borderColor: ["var(--border)", "var(--accent)", "var(--border)"] } : {}}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <span className="text-3xl font-bold">{displayText}</span>
      </motion.div>
    </div>
  );
}

// ─── EnvelopeCard ─────────────────────────────────────────────────────────────

function EnvelopeCard({ result, onDone }: { result: string; onDone: () => void }) {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpened(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (opened) {
      const t = setTimeout(onDone, 800);
      return () => clearTimeout(t);
    }
  }, [opened, onDone]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      <div className="relative w-40 h-28 perspective-[600px]">
        {/* Envelope body */}
        <div className="absolute inset-0 rounded-xl bg-amber-100 dark:bg-amber-950 border-2 border-amber-300 dark:border-amber-700 flex items-end justify-center pb-4 overflow-hidden">
          <AnimatePresence>
            {opened && (
              <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.25 }}
                className="bg-white dark:bg-zinc-800 rounded-lg px-4 py-2 shadow text-sm font-bold text-center"
              >
                {result}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Flap */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-14 origin-top"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateX: opened ? -160 : 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="w-full h-full bg-amber-200 dark:bg-amber-900 border-2 border-amber-300 dark:border-amber-700 rounded-t-xl"
            style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
        </motion.div>
      </div>
      <p className="text-xs text-muted-foreground">封筒が開いています...</p>
    </div>
  );
}

// ─── GachaCard ───────────────────────────────────────────────────────────────

function GachaCard({ result, onDone }: { result: string; onDone: () => void }) {
  const [step, setStep] = useState<"enter" | "open" | "reveal">("enter");
  const colorRef = useRef(GACHA_COLORS[Math.floor(Math.random() * GACHA_COLORS.length)]);
  const color = colorRef.current;

  useEffect(() => {
    const t1 = setTimeout(() => setStep("open"),   700);
    const t2 = setTimeout(() => setStep("reveal"), 1100);
    const t3 = setTimeout(() => onDone(),          2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const opening = step === "open" || step === "reveal";

  return (
    <div className="flex flex-col items-center gap-5 py-4 min-h-[200px]">
      {/* カプセル */}
      <motion.div
        className="relative shrink-0"
        style={{ width: 112, height: 112 }}
        initial={{ y: -240, rotate: -25, scale: 0.9 }}
        animate={{ y: 0, rotate: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 250, damping: 18 }}
      >
        {/* 本体（白ベース） */}
        <div
          className="absolute inset-0 rounded-full bg-white dark:bg-zinc-800"
          style={{ border: `3px solid ${color}` }}
        />
        {/* 上半分（カラー・開封時に上に飛ぶ） */}
        <motion.div
          className="absolute top-0 left-0 right-0 z-10"
          style={{ height: "50%", borderRadius: "56px 56px 0 0", background: color }}
          animate={opening ? { y: -72 } : { y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 16 }}
        />
        {/* シャイン */}
        <div
          className="absolute z-20 pointer-events-none"
          style={{ top: 13, left: 18, width: 28, height: 18, background: "rgba(255,255,255,0.4)", borderRadius: "50%", filter: "blur(5px)" }}
        />
      </motion.div>

      {/* 結果カード */}
      <AnimatePresence>
        {step === "reveal" && (
          <motion.div
            initial={{ scale: 0.2, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="rounded-2xl px-8 py-3 text-center shadow-xl"
            style={{ background: color }}
          >
            <p className="text-xs font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>結果</p>
            <p className="text-2xl font-black text-white">{result}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── LotTool (main) ───────────────────────────────────────────────────────────

export function LotTool() {
  const [mode, setMode] = useState<LotMode>("custom");
  const [entries, setEntries] = useState<LotEntry[]>([
    { id: genId(), label: "当たり", totalCount: 3, remaining: 3 },
    { id: genId(), label: "はずれ", totalCount: 10, remaining: 10 },
  ]);
  const [numberMax, setNumberMax] = useState(10);
  const [numberDrawn, setNumberDrawn] = useState<number[]>([]);
  const [drawAnimation, setDrawAnimation] = useState<DrawAnimation>("scratch");
  const [phase, setPhase] = useState<LotState["phase"]>("setup");
  const [records, setRecords] = useState<DrawRecord[]>([]);
  const [currentResult, setCurrentResult] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from URL or localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const param = new URLSearchParams(window.location.search).get("c");
    if (param) {
      const payload = decodeState<SharePayload>(param);
      if (payload) {
        setMode(payload.mode);
        setDrawAnimation(payload.anim);
        if (payload.entries) {
          setEntries(payload.entries.map((e) => ({ id: genId(), label: e.l, totalCount: e.c, remaining: e.c })));
        }
        if (payload.max) setNumberMax(payload.max);
      }
    } else {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.drawAnimation) setDrawAnimation(saved.drawAnimation);
          if (saved.lastEntries) {
            setEntries(saved.lastEntries.map((e: { label: string; count: number }) => ({
              id: genId(), label: e.label, totalCount: e.count, remaining: e.count
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
        drawAnimation,
        lastEntries: entries.map((e) => ({ label: e.label, count: e.totalCount })),
      }));
    } catch { /* ignore */ }
  }, [drawAnimation, entries, mounted]);

  const totalEntries = entries.reduce((sum, e) => sum + e.totalCount, 0);
  const totalRemaining = entries.reduce((sum, e) => sum + e.remaining, 0);
  const isComplete = mode === "custom"
    ? totalRemaining === 0
    : numberDrawn.length >= numberMax;

  const addEntry = useCallback(() => {
    setEntries((prev) => [...prev, { id: genId(), label: "", totalCount: 1, remaining: 1 }]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateEntryLabel = useCallback((id: string, label: string) => {
    setEntries((prev) => prev.map((e) => e.id !== id ? e : { ...e, label }));
  }, []);

  const updateEntryCount = useCallback((id: string, count: number) => {
    const c = Math.max(1, count);
    setEntries((prev) => prev.map((e) => e.id !== id ? e : { ...e, totalCount: c, remaining: c }));
  }, []);

  const handleShare = useCallback(() => {
    const payload: SharePayload = {
      mode,
      anim: drawAnimation,
      entries: mode === "custom" ? entries.map((e) => ({ l: e.label, c: e.totalCount })) : undefined,
      max: mode === "number" ? numberMax : undefined,
    };
    const url = generateShareUrl(payload);
    navigator.clipboard.writeText(url).then(
      () => toast("共有URLをコピーしました"),
      () => toast("URLのコピーに失敗しました")
    );
  }, [mode, drawAnimation, entries, numberMax]);

  const handleStart = useCallback(() => {
    setRecords([]);
    setCurrentResult(null);
    setNumberDrawn([]);
    // Reset remaining counts
    setEntries((prev) => prev.map((e) => ({ ...e, remaining: e.totalCount })));
    setPhase("drawing");
  }, []);

  const handleDraw = useCallback(() => {
    if (isAnimating || isComplete) return;
    let result: string;

    if (mode === "number") {
      const available = Array.from({ length: numberMax }, (_, i) => i + 1).filter((n) => !numberDrawn.includes(n));
      if (available.length === 0) return;
      result = String(available[Math.floor(Math.random() * available.length)]);
      setNumberDrawn((prev) => [...prev, parseInt(result)]);
    } else {
      const drawn = drawFromEntries(entries);
      if (!drawn) return;
      result = drawn.result.label;
      setEntries(drawn.updated);
    }

    setCurrentResult(result);
    setIsAnimating(true);
  }, [isAnimating, isComplete, mode, numberMax, numberDrawn, entries, drawAnimation]);

  const handleAnimationDone = useCallback(() => {
    setIsAnimating(false);
    if (currentResult !== null) {
      setRecords((prev) => [{ id: genId(), label: currentResult!, drawnAt: Date.now() }, ...prev]);
    }
  }, [currentResult]);

  const handleReset = useCallback(() => {
    setEntries((prev) => prev.map((e) => ({ ...e, remaining: e.totalCount })));
    setNumberDrawn([]);
    setRecords([]);
    setCurrentResult(null);
    setShowResetConfirm(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (phase === "drawing") {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleDraw(); }
        if (e.key === "r" || e.key === "R") setShowResetConfirm(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, handleDraw]);

  return (
    <ToolLayout title="くじ引き" adVisible>
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {phase === "setup" ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* ヘッダービジュアル */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/60 dark:border-amber-700/30">
                <span className="text-4xl">🎲</span>
                <div>
                  <p className="text-sm font-bold text-amber-700 dark:text-amber-300">くじ引き</p>
                  <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">設定してくじを引こう！ガチャ演出で結果を発表。</p>
                </div>
              </div>

              {/* Mode tabs */}
              <div className="flex rounded-xl border border-border bg-muted/50 p-1 gap-1">
                {(["custom", "number"] as LotMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all duration-200 ${
                      mode === m
                        ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "custom" ? "🎟️ カスタム" : "🔢 数字くじ"}
                  </button>
                ))}
              </div>

              {mode === "custom" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-[1fr_80px_32px] gap-2 text-xs text-muted-foreground px-1">
                    <span>種類名</span><span className="text-center">枚数</span><span />
                  </div>
                  {entries.map((entry) => (
                    <div key={entry.id} className="grid grid-cols-[1fr_80px_32px] gap-2 items-center">
                      <input
                        value={entry.label}
                        onChange={(e) => updateEntryLabel(entry.id, e.target.value)}
                        placeholder="当たり"
                        className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        maxLength={20}
                      />
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={entry.totalCount}
                        onChange={(e) => updateEntryCount(entry.id, parseInt(e.target.value) || 1)}
                        className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button
                        onClick={() => removeEntry(entry.id)}
                        disabled={entries.length <= 1}
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addEntry} className="gap-2 w-full">
                    <Plus className="size-3.5" />
                    種類を追加
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">合計: {totalEntries}枚</p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-sm">1 〜</span>
                  <input
                    type="number"
                    min={2}
                    max={999}
                    value={numberMax}
                    onChange={(e) => setNumberMax(Math.max(2, parseInt(e.target.value) || 2))}
                    className="w-20 rounded-lg border border-border bg-card px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <span className="text-sm">の中から 1枚ずつ引く</span>
                </div>
              )}

              {/* Animation selector */}
              <div className="space-y-2">
                <p className="text-sm font-medium">演出</p>
                <div className="flex gap-2">
                  {(["scratch", "envelope", "instant"] as DrawAnimation[]).map((anim) => (
                    <button
                      key={anim}
                      onClick={() => setDrawAnimation(anim)}
                      className={`flex-1 rounded-lg py-1.5 text-xs border transition-colors ${drawAnimation === anim ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-border text-muted-foreground hover:border-border/80"}`}
                    >
                      {anim === "scratch" ? "🎲 ガチャ" : anim === "envelope" ? "封筒" : "即表示"}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.01 }}
                  className="w-full h-12 rounded-2xl text-sm font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md disabled:opacity-40 flex items-center justify-center gap-2"
                  disabled={mode === "custom" ? (totalEntries === 0 || entries.some((e) => !e.label.trim())) : false}
                  onClick={handleStart}
                >
                  🎟️ くじ引きスタート！
                </motion.button>
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleShare}>
                  <Share2 className="size-3.5" />
                  URLで共有
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="drawing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Remaining badges */}
              <div className="flex flex-wrap gap-1.5">
                {mode === "custom" ? entries.map((e) => (
                  <span key={e.id} className="rounded-full bg-muted px-3 py-0.5 text-xs">
                    {e.label} × {e.remaining}
                  </span>
                )) : (
                  <span className="rounded-full bg-muted px-3 py-0.5 text-xs">
                    残り {numberMax - numberDrawn.length} / {numberMax}
                  </span>
                )}
              </div>

              {/* Lot card area */}
              <div className="flex flex-col items-center justify-center min-h-48">
                {isAnimating && currentResult !== null ? (
                  drawAnimation === "scratch" ? (
                    <GachaCard result={currentResult} onDone={handleAnimationDone} />
                  ) : drawAnimation === "envelope" ? (
                    <EnvelopeCard result={currentResult} onDone={handleAnimationDone} />
                  ) : (
                    <InstantCard result={currentResult} onDone={handleAnimationDone} />
                  )
                ) : currentResult !== null && !isAnimating ? (
                  <motion.div
                    key={`result-${records.length}`}
                    initial={{ scale: 0.7, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 18 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-56 h-32 rounded-2xl shadow-lg bg-gradient-to-br from-amber-400 to-orange-400 flex flex-col items-center justify-center gap-1">
                      <span className="text-xs font-medium text-white/70">結果</span>
                      <span className="text-3xl font-black text-white">{currentResult}</span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="w-56 h-32 rounded-xl border-2 border-dashed border-border/60 flex items-center justify-center text-muted-foreground text-sm">
                    {isComplete ? "くじ引き終了！" : "ボタンを押してくじを引く"}
                  </div>
                )}
              </div>

              {/* CTA */}
              {!isComplete ? (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.02 }}
                  className="w-full h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  onClick={handleDraw}
                  disabled={isAnimating}
                >
                  {isAnimating ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.5 }}>🎟️</motion.span>
                  ) : "🎟️ くじを引く！"}
                </motion.button>
              ) : (
                <div className="text-center py-4">
                  <p className="text-lg font-bold mb-3">くじ引き終了！</p>
                  <p className="text-sm text-muted-foreground">全{mode === "custom" ? totalEntries : numberMax}枚引き切りました</p>
                </div>
              )}

              {/* Records */}
              {records.length > 0 && (
                <div className="rounded-xl border border-border/60 p-3 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">引いた記録 ({records.length}/{mode === "custom" ? totalEntries : numberMax})</p>
                  <div className="max-h-32 overflow-y-auto space-y-0.5 mt-1">
                    {records.map((r, i) => (
                      <div key={r.id} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground text-xs">{i + 1}.</span>
                        <span>{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPhase("setup")} className="gap-2">
                  <ChevronLeft className="size-3.5" />
                  設定に戻る
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetConfirm(true)}
                  className="gap-2 text-muted-foreground hover:text-destructive"
                >
                  <RotateCcw className="size-3.5" />
                  リセット
                </Button>
              </div>
              <div className="relative flex justify-center">
                {showShortcuts && (
                  <div className="absolute bottom-full mb-2 w-64 rounded-lg border border-border bg-background shadow-lg p-3 z-50 text-xs text-muted-foreground text-left">
                    <p className="font-semibold text-foreground mb-2">キーボードショートカット</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span>Enter / Space</span><span>くじを引く（引き中のみ）</span></div>
                      <div className="flex justify-between"><span>R</span><span>リセット</span></div>
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

      {/* Reset confirm */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>リセット</DialogTitle>
            <DialogDescription>くじをすべて元に戻します。引いた記録は削除されます。</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false}>
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleReset}>リセット</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ToolLayout>
  );
}
