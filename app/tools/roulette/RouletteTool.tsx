"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";

const STORAGE_KEY = "phase1-roulette-v2";

interface RouletteItem {
  label: string;
  weight: number;
}

const SECTOR_COLORS = [
  "#fda4af", // soft pink
  "#fdba74", // peach
  "#fde68a", // butter yellow
  "#a7f3d0", // mint
  "#bae6fd", // sky
  "#fbcfe8", // sakura
  "#fecaca", // coral
  "#ddd6fe", // light lavender
];
const SECTOR_TEXT_COLOR = "#3f3f46"; // zinc-700 — pastelに合わせて濃色テキスト

const DEFAULT_ITEMS: RouletteItem[] = [
  { label: "りんご", weight: 1 },
  { label: "バナナ", weight: 1 },
  { label: "いちご", weight: 1 },
];

const CX = 140, CY = 140, R = 125;

// 角度0=上(12時)、時計回り
function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sectorPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const s = polarToXY(cx, cy, r, start);
  const e = polarToXY(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
}

function weightedRandom(items: RouletteItem[]): number {
  const total = items.reduce((s, it) => s + it.weight, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    rand -= items[i].weight;
    if (rand <= 0) return i;
  }
  return items.length - 1;
}

export function RouletteTool() {
  const [items, setItems] = useState<RouletteItem[]>(DEFAULT_ITEMS);
  const [newLabel, setNewLabel] = useState("");
  const [pointerAngle, setPointerAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [cumulativeMode, setCumulativeMode] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showWeights, setShowWeights] = useState(false);
  const [error, setError] = useState("");
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cumulativeModeRef = useRef(false);
  const itemsRef = useRef(items);
  useEffect(() => { cumulativeModeRef.current = cumulativeMode; }, [cumulativeMode]);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => () => { if (spinTimerRef.current) clearTimeout(spinTimerRef.current); }, []);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const s = JSON.parse(saved);
        if (Array.isArray(s.items) && s.items.length >= 2) setItems(s.items);
        const savedAngle = s.pointerAngle ?? s.wheelAngle;
        if (typeof savedAngle === "number") setPointerAngle(savedAngle % 360);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, pointerAngle: pointerAngle % 360 })); } catch { /* ignore */ }
  }, [mounted, items, pointerAngle]);

  // セクター計算
  const totalWeight = items.reduce((s, it) => s + it.weight, 0);
  const sectors = items.map((item, i) => {
    const angle = (item.weight / totalWeight) * 360;
    const startAngle = items.slice(0, i).reduce((s, it) => s + (it.weight / totalWeight) * 360, 0);
    return { ...item, angle, startAngle, midAngle: startAngle + angle / 2, color: SECTOR_COLORS[i % SECTOR_COLORS.length] };
  });

  const addItem = () => {
    const v = newLabel.trim();
    if (!v) return;
    setItems((prev) => [...prev, { label: v, weight: 1 }]);
    setNewLabel("");
    setError("");
  };

  const removeItem = (i: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
    setSelectedIndex(null);
  };

  const updateWeight = (i: number, w: number) => {
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, weight: Math.max(1, Math.min(99, Math.round(w))) } : it));
  };

  const spin = useCallback(() => {
    if (spinning || items.length < 2) { setError("2個以上の選択肢が必要です"); return; }
    setError("");
    setSelectedIndex(null);
    setSpinning(true);

    const winIdx = weightedRandom(items);

    // 当選セクターのmidAngle計算（セクターのランダムな位置に着地）
    const totalW = items.reduce((s, it) => s + it.weight, 0);
    let startA = 0;
    for (let i = 0; i < winIdx; i++) startA += (items[i].weight / totalW) * 360;
    const sectorAngle = (items[winIdx].weight / totalW) * 360;
    const offset = (Math.random() - 0.5) * sectorAngle * 0.6;
    const midAngle = startA + sectorAngle / 2 + offset;

    // 針回転量：固定ホイールの midAngle セクターを指すように
    const raw = ((midAngle - (pointerAngle % 360)) % 360 + 360) % 360;
    const totalRotation = 1800 + raw; // 5回転 + 位置合わせ

    setPointerAngle(pointerAngle + totalRotation);

    spinTimerRef.current = setTimeout(() => {
      setSpinning(false);
      setSelectedIndex(winIdx);
      if (cumulativeModeRef.current) {
        spinTimerRef.current = setTimeout(() => {
          const cur = itemsRef.current;
          const winner = cur[winIdx]?.label;
          if (winner) setHistory((prev) => [winner, ...prev]);
          setItems((prev) => prev.filter((_, idx) => idx !== winIdx));
          setSelectedIndex(null);
        }, 1800);
      }
    }, 4300);
  }, [spinning, items, pointerAngle]);

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
    <ToolLayout title="ルーレット" adVisible>
      <div className="flex flex-col gap-5">

        {/* ヘッダービジュアル */}
        <div className="relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-950/30 dark:to-orange-950/20 border border-pink-200/60 dark:border-pink-700/30">
          <img src="/uploads/kawaii-blob-pink.svg" alt="" aria-hidden="true" className="absolute -right-6 -bottom-6 w-28 h-28 opacity-20 pointer-events-none select-none" />
          <img src="/assets/icon-roulette.png" alt="" aria-hidden="true" className="w-16 h-16 object-contain flex-shrink-0 relative z-10" />
          <div className="relative z-10">
            <p className="text-sm font-bold text-pink-700 dark:text-pink-300">ルーレット</p>
            <p className="text-xs text-pink-600/70 dark:text-pink-400/70 mt-0.5">選択肢を追加してスタート！針が止まった項目が当選。</p>
          </div>
        </div>

        {/* 入力 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="選択肢を入力..."
            className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50"
          />
          <motion.button whileTap={{ scale: 0.95 }} onClick={addItem}
            className="h-10 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-sm">
            追加
          </motion.button>
        </div>

        {/* 円形ルーレット */}
        <div className="flex justify-center select-none">
          <div className="relative" style={{ width: CX * 2, height: CY * 2 }}>
            {/* 固定ホイール */}
            <svg
              width={CX * 2} height={CY * 2}
              viewBox={`0 0 ${CX * 2} ${CY * 2}`}
              style={{ display: "block" }}
            >
              {/* セクター */}
              {sectors.map((s, i) => {
                const pos = polarToXY(CX, CY, R * 0.65, s.midAngle);
                const fontSize = s.angle > 45 ? 13 : s.angle > 25 ? 11 : s.angle > 12 ? 9 : 7;
                const labelText = s.label.length > 7 ? s.label.slice(0, 6) + "…" : s.label;
                return (
                  <g key={i}>
                    <path
                      d={sectorPath(CX, CY, R, s.startAngle, s.startAngle + s.angle)}
                      fill={s.color}
                      stroke="white"
                      strokeWidth={1.5}
                    />
                    <text
                      x={pos.x} y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={fontSize}
                      fontWeight="bold"
                      fill={SECTOR_TEXT_COLOR}
                      style={{ userSelect: "none", pointerEvents: "none" }}
                    >
                      {labelText}
                    </text>
                  </g>
                );
              })}
              {/* 外周リング */}
              <circle cx={CX} cy={CY} r={R + 1} fill="none" stroke="#fbcfe8" strokeWidth={2} />
              {/* 中心下地（シンプル） */}
              <circle cx={CX} cy={CY} r={18} fill="white" stroke="#f9a8d4" strokeWidth={1.5} />
            </svg>

            {/* 回転ポインター（針） */}
            <svg
              width={CX * 2} height={CY * 2}
              viewBox={`0 0 ${CX * 2} ${CY * 2}`}
              className="absolute inset-0 pointer-events-none"
              style={{
                transformOrigin: "50% 50%",
                transform: `rotate(${pointerAngle}deg)`,
                transition: spinning
                  ? "transform 4.3s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
                  : "none",
              }}
            >
              {/* 針の影 */}
              <polygon
                points={`${CX},${CY - 96} ${CX + 6},${CY - 58} ${CX + 3},${CY - 20} ${CX - 3},${CY - 20} ${CX - 6},${CY - 58}`}
                fill="rgba(0,0,0,0.18)"
                transform="translate(2,4)"
              />
              {/* 針本体（テーパー形状） */}
              <polygon
                points={`${CX},${CY - 96} ${CX + 6},${CY - 58} ${CX + 3},${CY - 20} ${CX - 3},${CY - 20} ${CX - 6},${CY - 58}`}
                fill="white"
                stroke="#f9a8d4"
                strokeWidth={1}
              />
              {/* 先端ハイライト */}
              <circle cx={CX} cy={CY - 94} r={2.5} fill="rgba(255,255,255,0.95)" />
              {/* 中心ピン（シンプル） */}
              <circle cx={CX} cy={CY} r={5} fill="white" stroke="#f9a8d4" strokeWidth={1.5} />
              <circle cx={CX} cy={CY} r={2} fill="#f9a8d4" />
            </svg>
          </div>
        </div>

        {/* 当選結果 */}
        <AnimatePresence>
          {selectedIndex !== null && !spinning && items[selectedIndex] && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="flex flex-col items-center gap-3"
            >
              <div
                className="w-full py-4 rounded-2xl text-center shadow-lg"
                style={{
                  backgroundColor: SECTOR_COLORS[selectedIndex % SECTOR_COLORS.length],
                  color: SECTOR_TEXT_COLOR,
                }}
              >
                <p className="text-xs font-medium opacity-70 mb-1">🎉 当選</p>
                <p className="text-4xl sm:text-5xl font-black">{items[selectedIndex].label}</p>
              </div>
              {!cumulativeMode && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const winner = items[selectedIndex!].label;
                    setHistory((prev) => [winner, ...prev]);
                    setItems((prev) => prev.filter((_, idx) => idx !== selectedIndex));
                    setSelectedIndex(null);
                  }}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors border border-border rounded-full px-4 py-1.5 hover:border-destructive/40"
                >
                  この結果を除外して次へ
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        {/* スタートボタン */}
        <motion.button
          onClick={spin}
          disabled={spinning || items.length < 2}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          className="w-full sm:w-64 mx-auto h-14 rounded-2xl text-xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg disabled:opacity-50 transition-opacity"
        >
          {spinning
            ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }} className="inline-block">🎡</motion.span>
            : "🎡 スタート"}
        </motion.button>

        {/* 選択肢リスト + 割合編集 */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
            <span className="text-xs font-medium text-muted-foreground">選択肢（{items.length}件）</span>
            <button
              onClick={() => setShowWeights(v => !v)}
              className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                showWeights
                  ? "border-pink-400 text-pink-500 bg-pink-50 dark:bg-pink-950/30"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              割合を編集
            </button>
          </div>
          {items.map((item, i) => {
            const pct = Math.round((item.weight / totalWeight) * 100);
            return (
              <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border/40 last:border-b-0">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length] }}
                />
                <span className="flex-1 text-sm min-w-0 truncate">{item.label}</span>
                {showWeights ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min={1} max={99}
                      value={item.weight}
                      onChange={(e) => updateWeight(i, Number(e.target.value))}
                      className="w-14 h-7 px-2 rounded-md border border-border bg-background text-xs text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-pink-400/50"
                    />
                    <span className="text-xs text-muted-foreground w-9 tabular-nums text-right">{pct}%</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">{pct}%</span>
                )}
                <button
                  onClick={() => removeItem(i)}
                  disabled={spinning}
                  className="text-muted-foreground/40 hover:text-destructive text-xs transition-colors disabled:opacity-20 px-1 shrink-0"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        {/* 累積モード */}
        <label className="flex items-center gap-3 cursor-pointer self-center">
          <button
            role="switch"
            aria-checked={cumulativeMode}
            onClick={() => { setCumulativeMode(!cumulativeMode); setSelectedIndex(null); }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              cumulativeMode ? "bg-gradient-to-r from-pink-400 to-rose-400" : "bg-muted border border-border"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${cumulativeMode ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          <span className="text-sm text-muted-foreground">累積モード（当選を自動除外）</span>
        </label>

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
                {history.map((item, i) => (
                  <span key={i} className="text-xs rounded-full px-3 py-1 border border-border text-muted-foreground font-medium">
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </ToolLayout>
  );
}
