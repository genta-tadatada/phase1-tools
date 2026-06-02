"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Check } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { toast } from "sonner";
import { decodeState, generateShareUrl } from "@/lib/share";

type DiceFace = 4 | 6 | 8 | 10 | 12 | 20;
const DICE_FACES: DiceFace[] = [4, 6, 8, 10, 12, 20];
const DICE_STORAGE = "phase1-dice-state";

interface SharePayload {
  f: number;
  c: number;
}

// カラーテーマ（面数ごと）
const THEME: Record<DiceFace, {
  bg: string; dot: string; border: string;
  badge: string; grad: string; ring: string;
}> = {
  4:  { bg: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20",    dot: "#f97316", border: "border-orange-200/80 dark:border-orange-700/30",  badge: "bg-orange-500",  grad: "from-orange-400 to-amber-400",   ring: "ring-orange-300/60" },
  6:  { bg: "from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20",          dot: "#f43f5e", border: "border-rose-200/80 dark:border-rose-700/30",      badge: "bg-rose-500",    grad: "from-rose-400 to-pink-400",      ring: "ring-rose-300/60"   },
  8:  { bg: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20",  dot: "#8b5cf6", border: "border-violet-200/80 dark:border-violet-700/30",  badge: "bg-violet-500",  grad: "from-violet-400 to-purple-400",  ring: "ring-violet-300/60" },
  10: { bg: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20",    dot: "#10b981", border: "border-emerald-200/80 dark:border-emerald-700/30",badge: "bg-emerald-500", grad: "from-emerald-400 to-teal-400",   ring: "ring-emerald-300/60"},
  12: { bg: "from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/20",            dot: "#0ea5e9", border: "border-sky-200/80 dark:border-sky-700/30",        badge: "bg-sky-500",     grad: "from-sky-400 to-blue-400",       ring: "ring-sky-300/60"    },
  20: { bg: "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20",    dot: "#d97706", border: "border-amber-200/80 dark:border-amber-700/30",    badge: "bg-amber-500",   grad: "from-amber-400 to-yellow-400",   ring: "ring-amber-300/60"  },
};

// D6 ドット座標
const D6_DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 22], [72, 22], [28, 50], [72, 50], [28, 78], [72, 78]],
};

function D6Svg({ value, color }: { value: number; color: string }) {
  const dots = D6_DOTS[Math.max(1, Math.min(6, value))] ?? D6_DOTS[1];
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={7.5} fill={color} />
      ))}
    </svg>
  );
}

function PolygonDiceSvg({ faces, value, color }: { faces: DiceFace; value: number; color: string }) {
  const polygons: Record<DiceFace, string> = {
    4:  "50,12 88,80 12,80",
    6:  "18,18 82,18 82,82 18,82",
    8:  "50,8 92,50 50,92 8,50",
    10: "50,8 88,38 78,82 22,82 12,38",
    12: "50,8 82,22 94,60 70,90 30,90 6,60 18,22",
    20: "50,6 90,32 90,68 50,94 10,68 10,32",
  };
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-1">
      <polygon
        points={polygons[faces]}
        fill="none"
        stroke={color}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <text
        x="50" y="58"
        textAnchor="middle"
        fontSize="22"
        fontWeight="bold"
        fill={color}
        fontFamily="var(--font-inter)"
      >
        {value}
      </text>
    </svg>
  );
}

export function DiceTool() {
  const [faces, setFaces] = useState<DiceFace>(6);
  const [diceCount, setDiceCount] = useState(1);
  const [values, setValues] = useState<number[]>([1]);
  const [shaking, setShaking] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rollHistory, setRollHistory] = useState<{ values: number[]; faces: DiceFace }[]>([]);
  const [justRolled, setJustRolled] = useState(false);
  const [shared, setShared] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const t = THEME[faces];

  useEffect(() => {
    setMounted(true);
    // Try URL params first
    const param = new URLSearchParams(window.location.search).get("c");
    if (param) {
      const payload = decodeState<SharePayload>(param);
      if (payload) {
        if (DICE_FACES.includes(payload.f as DiceFace)) setFaces(payload.f as DiceFace);
        if (payload.c >= 1 && payload.c <= 10) setDiceCount(payload.c);
        return;
      }
    }
    try {
      const saved = localStorage.getItem(DICE_STORAGE);
      if (saved) {
        const s = JSON.parse(saved);
        if (DICE_FACES.includes(s.faces)) setFaces(s.faces);
        if (s.count >= 1 && s.count <= 10) setDiceCount(s.count);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setValues((prev) => {
      if (prev.length === diceCount) return prev;
      if (prev.length < diceCount) return [...prev, ...Array.from({ length: diceCount - prev.length }, () => 1)];
      return prev.slice(0, diceCount);
    });
  }, [diceCount, mounted]);

  useEffect(() => {
    if (!mounted) return;
    setValues((prev) => prev.map((v) => Math.max(1, Math.min(v, faces))));
  }, [faces, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(DICE_STORAGE, JSON.stringify({ faces, count: diceCount }));
    } catch { /* ignore */ }
  }, [mounted, faces, diceCount]);

  const handleShare = useCallback(async () => {
    const payload: SharePayload = { f: faces, c: diceCount };
    const url = generateShareUrl(payload);
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1500);
      toast("共有URLをコピーしました");
    } catch {
      toast("コピーに失敗しました");
    }
  }, [faces, diceCount]);

  const roll = useCallback(() => {
    if (shaking) return;
    setShaking(true);
    setJustRolled(false);
    setTimeout(() => {
      const newValues = Array.from({ length: diceCount }, () => Math.floor(Math.random() * faces) + 1);
      setValues(newValues);
      setShaking(false);
      setJustRolled(true);
      setRollHistory((prev) => [{ values: newValues, faces }, ...prev].slice(0, 5));
    }, 520);
  }, [shaking, diceCount, faces]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Enter" || e.code === "Space" || e.code === "KeyR") {
        e.preventDefault();
        roll();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [roll]);

  const total = values.reduce((a, b) => a + b, 0);
  if (!mounted) return null;

  return (
    <ToolLayout title="サイコロ" adVisible>
      <div className="flex flex-col gap-6">

        {/* 面数セレクター */}
        <div className="flex gap-2 flex-wrap justify-center">
          {DICE_FACES.map((f) => {
            const c = THEME[f];
            const active = faces === f;
            return (
              <motion.button
                key={f}
                onClick={() => setFaces(f)}
                whileTap={{ scale: 0.93 }}
                className={`w-13 h-9 px-3 rounded-full text-sm font-bold transition-all duration-200 ${
                  active
                    ? `bg-gradient-to-r ${c.grad} text-white shadow-md`
                    : `bg-gradient-to-br ${c.bg} border ${c.border} hover:ring-2 ${c.ring}`
                }`}
              >
                D{f}
              </motion.button>
            );
          })}
        </div>

        {/* 個数セレクター */}
        <div className="flex items-center justify-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setDiceCount((c) => Math.max(1, c - 1))}
            className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-lg font-semibold hover:bg-muted transition-colors"
          >
            −
          </motion.button>
          <span className="text-2xl font-bold tabular-nums w-8 text-center">{diceCount}</span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setDiceCount((c) => Math.min(10, c + 1))}
            className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-lg font-semibold hover:bg-muted transition-colors"
          >
            ＋
          </motion.button>
          <span className="text-sm text-muted-foreground">個</span>
        </div>

        {/* サイコロ表示 */}
        <div className="flex flex-wrap gap-4 justify-center py-2">
          <AnimatePresence mode="popLayout">
            {values.map((val, i) => (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, scale: 0.5 }}
                animate={
                  shaking
                    ? { rotate: [0, -18, 18, -12, 12, -6, 6, 0], y: [0, -10, 2, -5, 0], scale: 1 }
                    : justRolled
                      ? { rotate: 0, scale: [1.25, 0.95, 1.05, 1], y: 0 }
                      : { rotate: 0, scale: 1, y: 0 }
                }
                exit={{ opacity: 0, scale: 0.5 }}
                transition={
                  shaking
                    ? { duration: 0.52, ease: "easeInOut" }
                    : { type: "spring", stiffness: 350, damping: 14, delay: i * 0.06 }
                }
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${t.bg} shadow-md border ${t.border} ring-1 ${t.ring} flex items-center justify-center`}
              >
                {faces === 6
                  ? <D6Svg value={val} color={t.dot} />
                  : <PolygonDiceSvg faces={faces} value={val} color={t.dot} />
                }
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 合計 */}
        <AnimatePresence mode="wait">
          {diceCount > 1 && (
            <motion.p
              key={total}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="text-center text-4xl font-bold tabular-nums"
            >
              合計: <span className={`bg-gradient-to-r ${t.grad} bg-clip-text text-transparent`}>{total}</span>
            </motion.p>
          )}
        </AnimatePresence>

        {/* 振るボタン + 共有 */}
        <div className="flex gap-2 justify-center">
          <motion.button
            onClick={roll}
            disabled={shaking}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            className={`flex-1 sm:flex-none sm:w-52 h-14 rounded-2xl text-xl font-bold transition-opacity disabled:opacity-60 bg-gradient-to-r ${t.grad} text-white shadow-lg`}
          >
            {shaking ? (
              <motion.span animate={{ rotate: [0, 20, -20, 0] }} transition={{ repeat: Infinity, duration: 0.3 }}>
                🎲
              </motion.span>
            ) : (
              "🎲 振る"
            )}
          </motion.button>
          <button
            onClick={handleShare}
            className="h-14 px-4 rounded-2xl border border-border bg-card hover:bg-muted transition-colors flex items-center gap-1.5 text-sm text-muted-foreground"
            aria-label="設定をURLでシェア"
          >
            {shared ? <Check className="size-4 text-green-500" /> : <Share2 className="size-4" />}
          </button>
        </div>

        <div className="relative flex justify-center">
          {showShortcuts && (
            <div className="absolute bottom-full mb-2 w-64 rounded-lg border border-border bg-background shadow-lg p-3 z-50 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-2">キーボードショートカット</p>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Enter / Space / R</span><span>振る</span></div>
              </div>
            </div>
          )}
          <button
            onClick={() => setShowShortcuts(v => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-border bg-card text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
            aria-label="キーボードショートカット"
          >?</button>
        </div>

        {/* 履歴 */}
        <AnimatePresence>
          {rollHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1.5 pt-2 border-t border-border/50"
            >
              <p className="text-xs text-muted-foreground text-center font-medium">直近の履歴</p>
              {rollHistory.map((entry, i) => {
                const c = THEME[entry.faces];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: i === 0 ? 1 : 0.4, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-3 px-3 py-1.5 rounded-xl ${
                      i === 0 ? `bg-gradient-to-r ${c.bg} border ${c.border}` : ""
                    }`}
                  >
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${c.badge} flex-shrink-0`}>
                      D{entry.faces}
                    </span>
                    <span className="text-sm font-mono tabular-nums flex-1">{entry.values.join("  　")}</span>
                    {entry.values.length > 1 && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        計 {entry.values.reduce((a, b) => a + b, 0)}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </ToolLayout>
  );
}
