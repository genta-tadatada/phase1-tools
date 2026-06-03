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

// 演出は常にガチャに統一（選択UIは廃止）。SharePayload 互換のため型自体は残す。
type DrawAnimation = "gacha";
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

// ─── GachaCard ───────────────────────────────────────────────────────────────

function GachaCard({ result, onDone }: { result: string; onDone: () => void }) {
  const [step, setStep] = useState<"fall" | "shake" | "flash" | "open" | "reveal">("fall");
  const colorRef = useRef(GACHA_COLORS[Math.floor(Math.random() * GACHA_COLORS.length)]);
  const color = colorRef.current;

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep("shake"),  600),
      setTimeout(() => setStep("flash"),  1000),
      setTimeout(() => setStep("open"),   1300),
      setTimeout(() => setStep("reveal"), 1700),
      setTimeout(() => onDone(),          2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  // スパークル用パーティクル（8方向）
  const sparkles = Array.from({ length: 8 }, (_, i) => ({
    angle: i * 45,
    id: i,
    dx: Math.cos((i * 45 * Math.PI) / 180) * 60,
    dy: Math.sin((i * 45 * Math.PI) / 180) * 60,
  }));

  return (
    <div className="flex flex-col items-center gap-6 py-6 min-h-[260px] relative">
      {/* フラッシュエフェクト */}
      <AnimatePresence>
        {step === "flash" && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)" }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 2, 3] }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* カプセル */}
      <div className="relative" style={{ width: 128, height: 128 }}>
        {/* メインカプセル外周 */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `4px solid ${color}`, background: "white" }}
          animate={
            step === "fall" ? { y: 0, rotate: 0, scale: 1 } :
            step === "shake" ? { x: [-8, 8, -6, 6, -4, 4, -2, 0], rotate: [-5, 5, -4, 4, -2, 2, 0, 0] } :
            {}
          }
          initial={{ y: -280, rotate: -30, scale: 0.85 }}
          transition={
            step === "fall" ? { type: "spring", stiffness: 200, damping: 15 } :
            step === "shake" ? { duration: 0.35, times: [0, 0.14, 0.28, 0.42, 0.56, 0.7, 0.84, 1] } :
            {}
          }
        >
          {/* 上半分（カラー・開封で飛ぶ） */}
          <motion.div
            className="absolute top-0 left-0 right-0 z-10"
            style={{
              height: "52%",
              borderRadius: "64px 64px 0 0",
              background: `linear-gradient(135deg, ${color}dd, ${color})`,
            }}
            animate={step === "open" || step === "reveal" ? { y: -90, opacity: 0 } : { y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
          {/* 下半分（白・結果が透けて見える感じ） */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: "52%",
              borderRadius: "0 0 64px 64px",
              background: "linear-gradient(135deg, #f8f8f8, #fff)",
            }}
          />
          {/* ハイライト */}
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              top: 16,
              left: 20,
              width: 32,
              height: 22,
              background: "rgba(255,255,255,0.5)",
              borderRadius: "50%",
              filter: "blur(6px)",
            }}
          />
          {/* 開封マーク */}
          {(step === "open" || step === "reveal") && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-30 text-2xl"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              ✨
            </motion.div>
          )}
        </motion.div>

        {/* スパークルパーティクル */}
        <AnimatePresence>
          {(step === "open" || step === "reveal") && sparkles.map((s) => (
            <motion.div
              key={s.id}
              className="absolute w-3 h-3 rounded-full z-40"
              style={{
                top: "50%",
                left: "50%",
                marginTop: -6,
                marginLeft: -6,
                background: color,
              }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{ x: s.dx, y: s.dy, scale: [0, 1.2, 0], opacity: [1, 1, 0] }}
              transition={{ duration: 0.6, ease: "easeOut", delay: s.id * 0.02 }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* OPEN!テキスト */}
      <AnimatePresence>
        {step === "open" && (
          <motion.p
            className="text-sm font-black tracking-widest"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5, y: -10 }}
            animate={{ opacity: 1, scale: 1.2, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            OPEN!
          </motion.p>
        )}
      </AnimatePresence>

      {/* 結果カード */}
      <AnimatePresence>
        {step === "reveal" && (
          <motion.div
            initial={{ scale: 0.1, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 18 }}
            className="rounded-2xl px-10 py-4 text-center shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${color}ee, ${color})`,
              boxShadow: `0 8px 32px ${color}55`,
            }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.75)" }}>
              ✨ 結果 ✨
            </p>
            <p className="text-3xl font-black text-white drop-shadow">{result}</p>
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
        lastEntries: entries.map((e) => ({ label: e.label, count: e.totalCount })),
      }));
    } catch { /* ignore */ }
  }, [entries, mounted]);

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
      anim: "gacha",
      entries: mode === "custom" ? entries.map((e) => ({ l: e.label, c: e.totalCount })) : undefined,
      max: mode === "number" ? numberMax : undefined,
    };
    const url = generateShareUrl(payload);
    navigator.clipboard.writeText(url).then(
      () => toast("共有URLをコピーしました"),
      () => toast("URLのコピーに失敗しました")
    );
  }, [mode, entries, numberMax]);

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
  }, [isAnimating, isComplete, mode, numberMax, numberDrawn, entries]);

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
              <div className="relative overflow-hidden flex items-center gap-4 p-5 rounded-3xl bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/20 border border-amber-200/70 dark:border-amber-700/40 shadow-sm">
                <img src="/uploads/kawaii-blob-pink.svg" alt="" aria-hidden="true" className="absolute -right-6 -bottom-6 w-28 h-28 opacity-20 pointer-events-none select-none" />
                <div className="w-16 h-16 flex-shrink-0 relative z-10 bg-white/50 rounded-xl p-1">
                  <img src="/assets/icon-lot.png" alt="" aria-hidden="true" className="w-full h-full object-contain" />
                </div>
                <div className="relative z-10">
                  <p className="text-lg font-black text-amber-700 dark:text-amber-300 tracking-tight">くじ引き</p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5">設定してくじを引こう！ワクワクのガチャ演出で結果を発表 ✨</p>
                </div>
              </div>

              {/* Mode tabs */}
              <div className="flex rounded-2xl border border-amber-200/60 dark:border-amber-700/30 bg-amber-50/50 dark:bg-amber-950/20 p-1.5 gap-1.5">
                {(["custom", "number"] as LotMode[]).map((m) => (
                  <motion.button
                    key={m}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-black transition-all duration-200 ${
                      mode === m
                        ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md"
                        : "text-amber-700/60 dark:text-amber-400/60 hover:text-amber-700 dark:hover:text-amber-300"
                    }`}
                  >
                    {m === "custom" ? "🎟️ カスタム" : "🔢 数字くじ"}
                  </motion.button>
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
                  <GachaCard result={currentResult} onDone={handleAnimationDone} />
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
