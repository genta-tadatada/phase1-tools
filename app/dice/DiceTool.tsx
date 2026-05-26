"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";

type DiceFace = 4 | 6 | 8 | 10 | 12 | 20;
const DICE_FACES: DiceFace[] = [4, 6, 8, 10, 12, 20];
const DICE_STORAGE = "phase1-dice-state";

const D6_DOTS: Record<number, number[][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
};

function D6Svg({ value }: { value: number }) {
  const dots = D6_DOTS[Math.max(1, Math.min(6, value))] ?? D6_DOTS[1];
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={8} fill="currentColor" />
      ))}
    </svg>
  );
}

function PolygonDiceSvg({ faces, value }: { faces: DiceFace; value: number }) {
  const polygons: Record<DiceFace, string> = {
    4: "50,10 90,85 10,85",
    6: "15,15 85,15 85,85 15,85",
    8: "50,5 95,50 50,95 5,50",
    10: "50,5 90,35 80,85 20,85 10,35",
    12: "50,5 85,20 95,60 70,90 30,90 5,60 15,20",
    20: "50,5 90,30 90,70 50,95 10,70 10,30",
  };
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-1">
      <polygon points={polygons[faces]} fill="none" stroke="currentColor" strokeWidth={3} />
      <text x="50" y="57" textAnchor="middle" fontSize="22" fontWeight="bold" fill="currentColor" fontFamily="var(--font-inter)">
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

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(DICE_STORAGE);
      if (saved) {
        const s = JSON.parse(saved);
        if (DICE_FACES.includes(s.faces)) setFaces(s.faces);
        if (s.count >= 1 && s.count <= 6) setDiceCount(s.count);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setValues(Array.from({ length: diceCount }, () => Math.floor(Math.random() * faces) + 1));
  }, [diceCount, faces, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(DICE_STORAGE, JSON.stringify({ faces, count: diceCount }));
    } catch { /* ignore */ }
  }, [mounted, faces, diceCount]);

  const roll = useCallback(() => {
    if (shaking) return;
    setShaking(true);
    setTimeout(() => {
      setValues(Array.from({ length: diceCount }, () => Math.floor(Math.random() * faces) + 1));
      setShaking(false);
    }, 600);
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
    <ToolLayout title="サイコロ">
      <div className="flex flex-col gap-6">
        <div className="flex gap-2 flex-wrap justify-center">
          {DICE_FACES.map((f) => (
            <button
              key={f}
              onClick={() => setFaces(f)}
              className={`w-12 h-9 rounded-md text-sm font-medium transition-colors ${
                faces === f ? "text-[var(--accent-foreground)]" : "border border-border bg-card hover:bg-muted"
              }`}
              style={faces === f ? { backgroundColor: "var(--accent)" } : undefined}
            >
              D{f}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setDiceCount((c) => Math.max(1, c - 1))} className="w-8 h-8 rounded-md border border-border bg-card flex items-center justify-center text-sm hover:bg-muted transition-colors">−</button>
          <span className="font-medium tabular-nums w-4 text-center">{diceCount}</span>
          <button onClick={() => setDiceCount((c) => Math.min(6, c + 1))} className="w-8 h-8 rounded-md border border-border bg-card flex items-center justify-center text-sm hover:bg-muted transition-colors">＋</button>
          <span className="text-sm text-muted-foreground">個</span>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {values.map((val, i) => (
            <motion.div
              key={i}
              animate={shaking ? { rotate: [0, -10, 10, -8, 8, -5, 5, 0] } : { rotate: 0, scale: [1.1, 1] }}
              transition={shaking ? { duration: 0.6, ease: "easeInOut" } : { type: "spring", stiffness: 300, damping: 15, delay: i * 0.1 }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-card shadow-md border border-border flex items-center justify-center"
            >
              {faces === 6 ? <D6Svg value={val} /> : <PolygonDiceSvg faces={faces} value={val} />}
            </motion.div>
          ))}
        </div>

        {diceCount > 1 && (
          <p className="text-center text-4xl font-bold tabular-nums font-[var(--font-inter)]">合計: {total}</p>
        )}

        <button
          onClick={roll}
          disabled={shaking}
          className="w-full sm:w-64 mx-auto h-14 rounded-xl text-xl font-bold transition-colors disabled:opacity-50"
          style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          振る (Enter)
        </button>
        <p className="text-xs text-muted-foreground text-center">Enter / Space / R: 振る</p>
      </div>
    </ToolLayout>
  );
}
