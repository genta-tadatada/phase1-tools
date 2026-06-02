"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { decodeState, generateShareUrl } from "@/lib/share";
import { Share2, Check } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type TimeSignature = "4/4" | "3/4" | "2/4" | "6/8";
type SubDiv = 1 | 2 | 3 | 4;

interface BpmState {
  bpm: number;
  timeSignature: TimeSignature;
  volume: number;
  subdivision?: SubDiv;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "phase1-bpm-state";
const MIN_BPM = 40;
const MAX_BPM = 240;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;

const TIME_SIGNATURES: TimeSignature[] = ["4/4", "3/4", "2/4", "6/8"];

function getBeatsPerMeasure(ts: TimeSignature): number {
  const map: Record<TimeSignature, number> = {
    "4/4": 4,
    "3/4": 3,
    "2/4": 2,
    "6/8": 6,
  };
  return map[ts];
}

function getBpmLabel(bpm: number): string {
  if (bpm <= 66) return "Largo";
  if (bpm <= 108) return "Andante";
  if (bpm <= 132) return "Moderato";
  if (bpm <= 168) return "Allegro";
  return "Presto";
}

// ─── Tap Tempo ───────────────────────────────────────────────────────────────

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function calcBpmFromTaps(timestamps: number[]): number | null {
  if (timestamps.length < 2) return null;
  const intervals = timestamps.slice(1).map((t, i) => t - timestamps[i]);
  // Filter outliers: ±50% from mean
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const filtered = intervals.filter(
    (iv) => iv >= avg * 0.5 && iv <= avg * 1.5
  );
  if (filtered.length === 0) return null;
  const medianInterval = median(filtered);
  const bpm = Math.round(60000 / medianInterval);
  if (bpm < MIN_BPM || bpm > MAX_BPM) return null;
  return bpm;
}

// ─── Web Audio click ─────────────────────────────────────────────────────────

function scheduleClick(
  audioCtx: AudioContext,
  time: number,
  isAccent: boolean,
  volume: number,
  isSubdiv = false
): void {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "sine";
  if (isSubdiv) {
    osc.frequency.setValueAtTime(600, time);
    gain.gain.setValueAtTime(volume * 0.3, time);
  } else {
    osc.frequency.setValueAtTime(isAccent ? 1000 : 800, time);
    gain.gain.setValueAtTime(volume * 0.8, time);
  }
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  osc.start(time);
  osc.stop(time + 0.06);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BpmTool() {
  // State
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>("4/4");
  const [volume, setVolume] = useState(0.7);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [tapCount, setTapCount] = useState(0);
  const [tapMessage, setTapMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [subdivision, setSubdivision] = useState<SubDiv>(1);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [editingBpm, setEditingBpm] = useState(false);
  const [inputBpm, setInputBpm] = useState("120");
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bpmInputRef = useRef<HTMLInputElement>(null);

  // Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextBeatTimeRef = useRef(0);
  const currentBeatRef = useRef(0);
  const schedulerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tapTimestampsRef = useRef<number[]>([]);
  const tapResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bpmRef = useRef(bpm);
  const volumeRef = useRef(volume);
  const timeSignatureRef = useRef(timeSignature);
  const subdivisionRef = useRef<SubDiv>(1);
  const isPlayingRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { timeSignatureRef.current = timeSignature; }, [timeSignature]);
  useEffect(() => { subdivisionRef.current = subdivision; }, [subdivision]);

  // Load from URL or localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const param = new URLSearchParams(window.location.search).get("c");
      if (param) {
        const p = decodeState<{ bpm?: number; ts?: TimeSignature; vol?: number; sub?: SubDiv }>(param);
        if (p) {
          if (p.bpm && p.bpm >= MIN_BPM && p.bpm <= MAX_BPM) setBpm(p.bpm);
          if (p.ts && TIME_SIGNATURES.includes(p.ts)) setTimeSignature(p.ts);
          if (typeof p.vol === "number" && p.vol >= 0 && p.vol <= 1) setVolume(p.vol);
          if (p.sub && [1, 2, 3, 4].includes(p.sub)) { setSubdivision(p.sub); subdivisionRef.current = p.sub; }
          return;
        }
      }
    } catch { /* ignore */ }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state: BpmState = JSON.parse(saved);
        if (state.bpm >= MIN_BPM && state.bpm <= MAX_BPM) setBpm(state.bpm);
        if (TIME_SIGNATURES.includes(state.timeSignature))
          setTimeSignature(state.timeSignature);
        if (state.volume >= 0 && state.volume <= 1) setVolume(state.volume);
        if (state.subdivision && [1, 2, 3, 4].includes(state.subdivision)) { setSubdivision(state.subdivision); subdivisionRef.current = state.subdivision; }
      }
    } catch { /* ignore */ }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      const state: BpmState = { bpm, timeSignature, volume, subdivision };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [mounted, bpm, timeSignature, volume]);

  // Scheduler
  const scheduler = useCallback(() => {
    const audioCtx = audioCtxRef.current;
    if (!audioCtx) return;
    const beats = getBeatsPerMeasure(timeSignatureRef.current);
    const secondsPerBeat = 60 / bpmRef.current;
    const sub = subdivisionRef.current;
    const interval = secondsPerBeat / sub;

    while (nextBeatTimeRef.current < audioCtx.currentTime + SCHEDULE_AHEAD_S) {
      const subPos = currentBeatRef.current % sub;
      const beatPos = Math.floor(currentBeatRef.current / sub) % beats;
      const isMainBeat = subPos === 0;
      const isAccent = beatPos === 0 && isMainBeat;

      scheduleClick(audioCtx, nextBeatTimeRef.current, isAccent, volumeRef.current, !isMainBeat);

      if (isMainBeat) {
        const delay = (nextBeatTimeRef.current - audioCtx.currentTime) * 1000;
        const capturedBeat = beatPos;
        setTimeout(() => {
          if (isPlayingRef.current) setCurrentBeat(capturedBeat);
        }, Math.max(0, delay));
      }

      nextBeatTimeRef.current += interval;
      currentBeatRef.current += 1;
    }
  }, []);

  const startMetronome = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const audioCtx = audioCtxRef.current;
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    currentBeatRef.current = 0;
    nextBeatTimeRef.current = audioCtx.currentTime + 0.05;
    isPlayingRef.current = true;
    schedulerTimerRef.current = setInterval(scheduler, LOOKAHEAD_MS);
  }, [scheduler]);

  const stopMetronome = useCallback(() => {
    isPlayingRef.current = false;
    if (schedulerTimerRef.current) {
      clearInterval(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    setCurrentBeat(-1);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    startMetronome();
  }, [startMetronome]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    stopMetronome();
  }, [stopMetronome]);

  const togglePlay = useCallback(() => {
    if (isPlaying) handleStop();
    else handlePlay();
  }, [isPlaying, handlePlay, handleStop]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopMetronome();
      if (tapResetTimerRef.current) clearTimeout(tapResetTimerRef.current);
    };
  }, [stopMetronome]);

  const handleSubdivisionChange = useCallback((sub: SubDiv) => {
    subdivisionRef.current = sub;
    setSubdivision(sub);
    if (isPlayingRef.current) {
      stopMetronome();
      startMetronome();
    }
  }, [stopMetronome, startMetronome]);

  const handleShare = useCallback(() => {
    const url = generateShareUrl({ bpm, ts: timeSignature, vol: volume, sub: subdivision });
    navigator.clipboard.writeText(url)
      .then(() => {
        toast("URLをコピーしました");
        setShareSuccess(true);
        if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
        shareTimerRef.current = setTimeout(() => setShareSuccess(false), 2000);
      })
      .catch(() => toast("コピーに失敗しました"));
  }, [bpm, timeSignature, volume, subdivision]);

  const commitBpm = useCallback(() => {
    const n = parseInt(inputBpm, 10);
    if (!isNaN(n)) setBpm(Math.min(MAX_BPM, Math.max(MIN_BPM, n)));
    setEditingBpm(false);
  }, [inputBpm]);

  // BPM change helpers
  const clampBpm = (v: number) => Math.min(MAX_BPM, Math.max(MIN_BPM, v));

  const changeBpm = (delta: number) => {
    setBpm((prev) => clampBpm(prev + delta));
  };

  // Tap tempo
  const handleTap = useCallback(() => {
    const now = performance.now();

    // Reset if >3s since last tap
    if (tapResetTimerRef.current) clearTimeout(tapResetTimerRef.current);
    const timestamps = tapTimestampsRef.current;
    if (timestamps.length > 0 && now - timestamps[timestamps.length - 1] > 3000) {
      tapTimestampsRef.current = [];
    }

    tapTimestampsRef.current = [...tapTimestampsRef.current.slice(-8), now];
    const count = tapTimestampsRef.current.length;
    setTapCount(count);

    const calcBpm = calcBpmFromTaps(tapTimestampsRef.current);
    if (calcBpm !== null) {
      setBpm(calcBpm);
      setTapMessage(count >= 5 ? "精度: 高 ✓" : "タップ中...");
    } else {
      setTapMessage("もう一度タップしてください");
    }

    tapResetTimerRef.current = setTimeout(() => {
      tapTimestampsRef.current = [];
      setTapCount(0);
      setTapMessage("測定を終了しました");
      setTimeout(() => setTapMessage(""), 1000);
    }, 3000);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowUp":
          e.preventDefault();
          changeBpm(1);
          break;
        case "ArrowDown":
          e.preventDefault();
          changeBpm(-1);
          break;
        case "ArrowRight":
          e.preventDefault();
          changeBpm(5);
          break;
        case "ArrowLeft":
          e.preventDefault();
          changeBpm(-5);
          break;
        case "KeyT":
          e.preventDefault();
          handleTap();
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [togglePlay, handleTap]);

  // Page title sync
  useEffect(() => {
    if (!isPlaying) {
      document.title = "メトロノーム | タダtools";
      return;
    }
    const symbols = ["♩", "●"];
    let idx = 0;
    const interval = setInterval(() => {
      document.title = `${symbols[idx % 2]} BPM ${bpm} | メトロノーム`;
      idx++;
    }, (60 / bpm) * 1000);
    return () => clearInterval(interval);
  }, [isPlaying, bpm]);

  // Beat indicator
  const beats = getBeatsPerMeasure(timeSignature);

  if (!mounted) return null;

  return (
    <ToolLayout title="メトロノーム" adVisible>
      <div className="flex flex-col items-center gap-6 py-4">
        {/* BPM label */}
        <p className="text-sm text-muted-foreground font-medium tracking-wide">
          {getBpmLabel(bpm)}
        </p>

        {/* BPM number — タップで直接入力 */}
        {editingBpm ? (
          <input
            ref={bpmInputRef}
            type="number"
            value={inputBpm}
            onChange={(e) => setInputBpm(e.target.value)}
            onBlur={commitBpm}
            onKeyDown={(e) => { if (e.key === "Enter") commitBpm(); if (e.key === "Escape") setEditingBpm(false); }}
            className="text-6xl sm:text-7xl font-bold w-full max-w-xs text-center bg-transparent border-b-2 border-accent focus:outline-none tabular-nums font-[var(--font-inter)] leading-tight py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="BPMを入力"
            autoFocus
          />
        ) : (
          <button
            onClick={() => { setInputBpm(String(bpm)); setEditingBpm(true); }}
            className="text-8xl sm:text-9xl font-bold tabular-nums font-[var(--font-inter)] leading-none hover:text-accent/80 transition-colors cursor-text"
            aria-label={`BPM ${bpm}、タップして入力`}
          >
            {bpm}
          </button>
        )}

        {/* Adjust buttons */}
        <div className="flex gap-2">
          {[-5, -1, +1, +5].map((delta) => (
            <button
              key={delta}
              onClick={() => changeBpm(delta)}
              className="w-16 h-10 rounded-md border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
            >
              {delta > 0 ? `+${delta}` : delta}
            </button>
          ))}
        </div>

        {/* Slider */}
        <div className="flex items-center gap-2 w-full max-w-xs">
          <span className="text-xs text-muted-foreground tabular-nums w-7 text-right">{MIN_BPM}</span>
          <input
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="flex-1 accent-[var(--accent)]"
          />
          <span className="text-xs text-muted-foreground tabular-nums w-7">{MAX_BPM}</span>
        </div>

        {/* Beat indicator + time signature */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {Array.from({ length: beats }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: currentBeat === i ? 1.15 : 1,
                  opacity: currentBeat === i ? 1 : currentBeat === ((i + beats - 1) % beats) && currentBeat !== -1 ? 0.5 : 1,
                  backgroundColor:
                    currentBeat === i
                      ? "var(--accent)"
                      : "var(--border)",
                }}
                transition={{ duration: 0.05 }}
                className={`rounded-full ${i === 0 ? "w-6 h-6" : "w-4 h-4"} bg-border`}
              />
            ))}
          </div>
          <select
            value={timeSignature}
            onChange={(e) => setTimeSignature(e.target.value as TimeSignature)}
            className="h-9 px-2 rounded-md border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            {TIME_SIGNATURES.map((ts) => (
              <option key={ts} value={ts}>
                {ts}
              </option>
            ))}
          </select>
        </div>

        {/* Subdivision */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">細分割</span>
          <div className="flex gap-1">
            {([1, 2, 3, 4] as SubDiv[]).map((sub) => (
              <button
                key={sub}
                onClick={() => handleSubdivisionChange(sub)}
                className={`w-9 h-7 rounded text-xs font-medium transition-colors ${
                  subdivision === sub
                    ? "bg-accent text-accent-foreground"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
                aria-pressed={subdivision === sub}
                aria-label={`細分割×${sub}`}
              >
                ×{sub}
              </button>
            ))}
          </div>
        </div>

        {/* Play button */}
        <button
          onClick={togglePlay}
          className="w-full sm:w-64 h-16 rounded-xl text-xl font-bold transition-colors"
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--accent-foreground)",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={isPlaying ? "stop" : "play"}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center gap-2"
            >
              {isPlaying ? "■ 停止" : "▶ 再生"}
            </motion.span>
          </AnimatePresence>
        </button>

        {/* Tap tempo */}
        <Button
          variant="outline"
          onClick={handleTap}
          className="w-full sm:w-64 h-14 rounded-xl text-lg"
        >
          TAP BPM
          {tapCount >= 2 && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({tapCount}tap)
            </span>
          )}
        </Button>

        {tapMessage && (
          <motion.p
            key={tapMessage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-muted-foreground"
          >
            {tapMessage}
          </motion.p>
        )}

        {/* Volume */}
        <div className="flex items-center gap-3 w-full max-w-xs">
          <span className="text-sm text-muted-foreground">🔊</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1 accent-[var(--accent)]"
          />
          <span className="text-sm text-muted-foreground w-8">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* 共有 + ? */}
        <div className="flex items-center gap-2 justify-center relative">
          <button onClick={handleShare} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="URLで共有">
            {shareSuccess ? <Check className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
          </button>
          {showShortcuts && (
            <div className="absolute bottom-full right-0 mb-2 w-64 rounded-lg border border-border bg-background shadow-lg p-3 z-50 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-2">キーボードショートカット</p>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Space</span><span>再生 / 停止</span></div>
                <div className="flex justify-between"><span>↑ / ↓</span><span>BPM ±1</span></div>
                <div className="flex justify-between"><span>← / →</span><span>BPM ±5</span></div>
                <div className="flex justify-between"><span>T</span><span>タップテンポ</span></div>
              </div>
            </div>
          )}
          <button onClick={() => setShowShortcuts(v => !v)} className="w-7 h-7 flex items-center justify-center rounded-md border border-border bg-card text-xs font-bold text-muted-foreground hover:bg-muted transition-colors" aria-label="キーボードショートカット">?</button>
        </div>
      </div>
    </ToolLayout>
  );
}
