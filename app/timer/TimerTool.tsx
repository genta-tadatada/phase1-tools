"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, SkipForward,
  Volume2, VolumeX, Volume1, Maximize2, X, RefreshCw, Share2, Check,
} from "lucide-react";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { DarkModeToggle } from "@/components/tool-layout/DarkModeToggle";
import { useLongPress } from "@/hooks/useLongPress";
import { toast } from "sonner";
import { decodeState, generateShareUrl } from "@/lib/share";

// ─── Constants ──────────────────────────────────────────────────────────────

const PRESETS_SECS = [60, 300, 600, 900, 1800, 3600];
const PRESET_LABELS = ["1分", "5分", "10分", "15分", "30分", "60分"];

const PREFS_KEY = "phase1-timer-preferences";
const POM_SETTINGS_KEY = "phase1-pomodoro-settings";
const DAILY_FOCUS_KEY = "phase1-timer-daily-focus";
const POM_PROGRESS_KEY = "phase1-pomodoro-progress";

// ─── Types ───────────────────────────────────────────────────────────────────

type MainMode = "countdown" | "pomodoro";
type TimerStatus = "idle" | "running" | "paused" | "finished";
type PomPhase = "focus" | "shortBreak" | "longBreak";

interface PomSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
  autoAdvance: boolean;
}

interface Prefs {
  soundEnabled: boolean;
  notificationEnabled: boolean;
  volume: number;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function fmtTime(totalSecs: number): string {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function pomPhaseLabel(p: PomPhase) {
  if (p === "focus") return "集中中";
  if (p === "shortBreak") return "短休憩";
  return "長休憩";
}

function getPhaseSecs(p: PomPhase, s: PomSettings) {
  if (p === "focus") return s.focusMinutes * 60;
  if (p === "shortBreak") return s.shortBreakMinutes * 60;
  return s.longBreakMinutes * 60;
}

function playFinish(ctx: AudioContext, vol: number) {
  const schedule: [number, number][] = [[880, 0], [1100, 0.25], [1320, 0.5]];
  schedule.forEach(([freq, delay]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(vol * 0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_POM: PomSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoAdvance: true,
};

const DEFAULT_PREFS: Prefs = {
  soundEnabled: true,
  notificationEnabled: false,
  volume: 0.7,
};

// ─── SpinnerField ────────────────────────────────────────────────────────────

function SpinnerField({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);
  const { suppressClick: upSuppress, ...upEvents } = useLongPress(() => onChange(Math.min(max, valueRef.current + 1)));
  const { suppressClick: dnSuppress, ...dnEvents } = useLongPress(() => onChange(Math.max(0, valueRef.current - 1)));
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-col">
        <button
          onClick={() => { if (!upSuppress()) onChange(Math.min(max, value + 1)); }}
          {...upEvents}
          className="w-10 h-7 flex items-center justify-center rounded-t-lg border border-border bg-background hover:bg-muted transition-colors text-muted-foreground text-sm touch-manipulation"
          aria-label={`${label}を増やす`}
        >▴</button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          value={String(value).padStart(2, "0")}
          onChange={(e) => onChange(Math.max(0, Math.min(max, parseInt(e.target.value) || 0)))}
          className="w-10 h-12 text-center text-xl font-bold tabular-nums border-x border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label={`${label}の入力`}
        />
        <button
          onClick={() => { if (!dnSuppress()) onChange(Math.max(0, value - 1)); }}
          {...dnEvents}
          className="w-10 h-7 flex items-center justify-center rounded-b-lg border border-border bg-background hover:bg-muted transition-colors text-muted-foreground text-sm touch-manipulation"
          aria-label={`${label}を減らす`}
        >▾</button>
      </div>
    </div>
  );
}

// ─── TimerFocusMode ──────────────────────────────────────────────────────────

interface TimerFocusModeProps {
  timeStr: string;
  progress: number;
  isRunning: boolean;
  isFinished: boolean;
  phaseLabel?: string;
  phaseDots?: { total: number; filled: number };
  onToggle: () => void;
  onReset: () => void;
  onExit: () => void;
}

function TimerFocusMode({ timeStr, progress, isRunning, isFinished, phaseLabel, phaseDots, onToggle, onReset, onExit }: TimerFocusModeProps) {
  const startRef = useRef({ x: 0, y: 0 });
  const isExcludedRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    isExcludedRef.current = !!(e.target as HTMLElement).closest("[data-timer-btn]");
    startRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || isExcludedRef.current) return;
    const dx = Math.abs(e.clientX - startRef.current.x);
    const dy = Math.abs(e.clientY - startRef.current.y);
    if (dx <= 12 && dy <= 12) onToggle();
  };

  return (
    <div
      className="fixed inset-0 bg-background dark:bg-zinc-950 z-50 flex flex-col select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* 終了ボタン */}
      <div className="absolute top-4 left-4" data-timer-btn>
        <button data-timer-btn onClick={onExit}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors touch-manipulation pointer-events-auto"
          aria-label="フルスクリーンを終了"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* フェーズバッジ */}
      {phaseLabel && (
        <div className="absolute top-4 right-4 pointer-events-none">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-accent/20 text-accent">{phaseLabel}</span>
        </div>
      )}

      {/* メイン表示 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 pointer-events-none">
        {phaseDots && (
          <div className="flex gap-2">
            {Array.from({ length: phaseDots.total }).map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i < phaseDots.filled ? "bg-accent" : "bg-border"}`} />
            ))}
          </div>
        )}

        {/* 角丸四角カード（枠が消えていくプログレス） */}
        {(() => {
          const W = 320, H = 192, R = 24, stroke = 6;
          const perimeter = 2 * (W - 2*R) + 2 * (H - 2*R) + 2 * Math.PI * R;
          const p = Math.max(0, Math.min(1, progress));
          return (
            <div className="relative" style={{ width: W, height: H, maxWidth: "90vw" }}>
              {/* SVG枠 */}
              <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${W} ${H}`}>
                {/* 背景トラック */}
                <rect x={stroke/2} y={stroke/2} width={W-stroke} height={H-stroke} rx={R} ry={R}
                  fill="none" stroke="var(--border)" strokeWidth={stroke} />
                {/* プログレス枠（消えていく） */}
                <rect x={stroke/2} y={stroke/2} width={W-stroke} height={H-stroke} rx={R} ry={R}
                  fill="none" stroke="var(--accent)" strokeWidth={stroke}
                  strokeDasharray={perimeter}
                  strokeDashoffset={perimeter * (1 - p)}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s linear", transformOrigin: "center" }}
                />
              </svg>
              {/* 時間テキスト */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
                {phaseLabel && (
                  <span className="text-xs font-medium text-muted-foreground/60 tracking-widest uppercase">{phaseLabel}</span>
                )}
                <span className={`text-7xl sm:text-8xl font-black tabular-nums leading-none ${isFinished ? "text-accent" : ""}`}>
                  {timeStr}
                </span>
              </div>
            </div>
          );
        })()}

        {/* タップヒント */}
        <span className="text-sm text-foreground/50 font-medium">
          {isFinished ? "終了しました" : isRunning ? "タップで一時停止" : "タップで再開"}
        </span>
      </div>

      {/* リセットボタン */}
      <div className="pb-10 flex justify-center" data-timer-btn>
        <button data-timer-btn onClick={onReset}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground/5 hover:bg-foreground/10 text-muted-foreground/50 hover:text-muted-foreground transition-all touch-manipulation pointer-events-auto"
          aria-label="リセット"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>

      {/* ダークモード */}
      <div className="absolute bottom-4 right-4 opacity-40 hover:opacity-90 transition-opacity pointer-events-auto" data-timer-btn>
        <DarkModeToggle />
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TimerTool() {
  const [mounted, setMounted] = useState(false);
  const [mainMode, setMainMode] = useState<MainMode>("countdown");

  // Shared
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ── Countdown ────────────────────────────────────────────────────────────
  const [cdH, setCdH] = useState(0);
  const [cdM, setCdM] = useState(3);
  const [cdS, setCdS] = useState(0);
  const [cdTotalSecs, setCdTotalSecs] = useState(180);
  const [cdRemaining, setCdRemaining] = useState(180);
  const [cdStatus, setCdStatus] = useState<TimerStatus>("idle");
  const [cdLoop, setCdLoop] = useState(false);
  const [cdActivePreset, setCdActivePreset] = useState(-1);
  const cdEndRef = useRef<number | null>(null);
  const cdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cdFinishTick, setCdFinishTick] = useState(0);
  // ref copy of cdTotalSecs for use inside finish effect
  const cdTotalSecsRef = useRef(180);
  const cdLoopRef = useRef(false);
  useEffect(() => { cdTotalSecsRef.current = cdTotalSecs; }, [cdTotalSecs]);
  useEffect(() => { cdLoopRef.current = cdLoop; }, [cdLoop]);

  // ── Pomodoro ─────────────────────────────────────────────────────────────
  const [pomSettings, setPomSettings] = useState<PomSettings>(DEFAULT_POM);
  const [pomPhase, setPomPhase] = useState<PomPhase>("focus");
  const [pomCycleCount, setPomCycleCount] = useState(0);
  const [pomRemaining, setPomRemaining] = useState(DEFAULT_POM.focusMinutes * 60);
  const [pomStatus, setPomStatus] = useState<TimerStatus>("idle");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pomShareSuccess, setPomShareSuccess] = useState(false);
  const pomShareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dailyFocusSecs, setDailyFocusSecs] = useState(0);
  const pomEndRef = useRef<number | null>(null);
  const pomIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pomFinishTick, setPomFinishTick] = useState(0);
  // shadow refs for pomodoro state — read inside finish effect without stale closure
  const pomPhaseRef = useRef<PomPhase>("focus");
  const pomCycleCountRef = useRef(0);
  const pomSettingsRef = useRef<PomSettings>(DEFAULT_POM);
  useEffect(() => { pomPhaseRef.current = pomPhase; }, [pomPhase]);
  useEffect(() => { pomCycleCountRef.current = pomCycleCount; }, [pomCycleCount]);
  useEffect(() => { pomSettingsRef.current = pomSettings; }, [pomSettings]);

  // ── Flash overlay ────────────────────────────────────────────────────────
  const [flashStep, setFlashStep] = useState(0);
  useEffect(() => {
    if (flashStep === 0) return;
    if (flashStep > 6) { setFlashStep(0); return; }
    const t = setTimeout(() => setFlashStep((s) => s + 1), 200);
    return () => clearTimeout(t);
  }, [flashStep]);
  const showFlash = flashStep > 0 && flashStep % 2 === 1;

  // ─── Mount ────────────────────────────────────────────────────────────────

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    // Migrate legacy "phase1-pomodoro-state" key
    try {
      const old = localStorage.getItem("phase1-pomodoro-state");
      if (old) {
        const p = JSON.parse(old);
        if (p?.settings) {
          const migrated: PomSettings = {
            focusMinutes: p.settings.workMinutes ?? DEFAULT_POM.focusMinutes,
            shortBreakMinutes: p.settings.shortBreakMinutes ?? DEFAULT_POM.shortBreakMinutes,
            longBreakMinutes: p.settings.longBreakMinutes ?? DEFAULT_POM.longBreakMinutes,
            longBreakInterval: p.settings.longBreakInterval ?? DEFAULT_POM.longBreakInterval,
            autoAdvance: DEFAULT_POM.autoAdvance,
          };
          localStorage.setItem(POM_SETTINGS_KEY, JSON.stringify(migrated));
          if (typeof p.settings.soundEnabled === "boolean") {
            localStorage.setItem(PREFS_KEY, JSON.stringify({
              soundEnabled: p.settings.soundEnabled,
              notificationEnabled: p.settings.notificationEnabled ?? false,
            }));
          }
          if (typeof p.sessionCount === "number" && p.lastResetDate === todayStr()) {
            const secs = p.sessionCount * (p.settings.workMinutes ?? 25) * 60;
            localStorage.setItem(DAILY_FOCUS_KEY, JSON.stringify({ date: todayStr(), focusSeconds: secs }));
          }
        }
        localStorage.removeItem("phase1-pomodoro-state");
      }
    } catch { /* ignore */ }

    // Load from URL params
    try {
      const params = new URLSearchParams(window.location.search);
      const param = params.get("c");
      if (param) {
        const p = decodeState<{ mode?: string; secs?: number }>(param);
        if (p?.mode === "cd" && typeof p.secs === "number") {
          const secs = Math.max(1, Math.min(86399, p.secs));
          setCdH(Math.floor(secs / 3600));
          setCdM(Math.floor((secs % 3600) / 60));
          setCdS(secs % 60);
          setCdTotalSecs(secs);
          setCdRemaining(secs);
          cdTotalSecsRef.current = secs;
        }
      }
      if (params.get("tab") === "pom") setMainMode("pomodoro");
    } catch { /* ignore */ }

    // Load prefs (merge with defaults to handle missing fields from old saves)
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch { /* ignore */ }

    // Load pomodoro settings
    try {
      const raw = localStorage.getItem(POM_SETTINGS_KEY);
      if (raw) {
        const s: PomSettings = JSON.parse(raw);
        setPomSettings(s);
        pomSettingsRef.current = s;
        setPomRemaining(s.focusMinutes * 60);
      }
    } catch { /* ignore */ }

    // Load daily focus
    try {
      const raw = localStorage.getItem(DAILY_FOCUS_KEY);
      if (raw) {
        const d: { date: string; focusSeconds: number } = JSON.parse(raw);
        if (d.date === todayStr()) setDailyFocusSecs(d.focusSeconds);
      }
    } catch { /* ignore */ }

    // Load pomodoro progress
    try {
      const raw = localStorage.getItem(POM_PROGRESS_KEY);
      if (raw) {
        const prog: { phase?: PomPhase; cycleCount?: number } = JSON.parse(raw);
        if (prog.phase) { setPomPhase(prog.phase); pomPhaseRef.current = prog.phase; }
        if (typeof prog.cycleCount === "number") { setPomCycleCount(prog.cycleCount); pomCycleCountRef.current = prog.cycleCount; }
      }
    } catch { /* ignore */ }
  }, []);

  // Reset pomRemaining when phase/settings change while idle
  useEffect(() => {
    if (pomStatus !== "idle") return;
    setPomRemaining(getPhaseSecs(pomPhase, pomSettings));
  }, [pomPhase, pomSettings, pomStatus]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const savePrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    if (typeof window !== "undefined") {
      try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    }
  }, []);

  const ensureAudioCtx = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  // refs for prefs — used inside effects to avoid stale closures
  const prefsRef = useRef<Prefs>(DEFAULT_PREFS);
  useEffect(() => { prefsRef.current = prefs; }, [prefs]);

  const fireSound = useCallback(() => {
    const vol = prefsRef.current.volume ?? DEFAULT_PREFS.volume;
    if (vol <= 0) return;
    const ctx = ensureAudioCtx();
    if (ctx) playFinish(ctx, vol);
  }, [ensureAudioCtx]);

  const fireNotification = useCallback((title: string, body: string) => {
    if (!prefsRef.current.notificationEnabled) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    new Notification(title, { body });
  }, []);

  // ─── Countdown logic ──────────────────────────────────────────────────────

  const cdTick = useCallback(() => {
    if (cdEndRef.current === null) return;
    const rem = Math.max(0, Math.round((cdEndRef.current - Date.now()) / 1000));
    setCdRemaining(rem);
    if (rem === 0) {
      if (cdIntervalRef.current) clearInterval(cdIntervalRef.current);
      cdEndRef.current = null;
      setCdStatus("finished");
      setCdFinishTick((n) => n + 1);
    }
  }, []);

  useEffect(() => {
    if (cdStatus !== "running") {
      if (cdIntervalRef.current) clearInterval(cdIntervalRef.current);
      return;
    }
    cdIntervalRef.current = setInterval(cdTick, 250);
    return () => { if (cdIntervalRef.current) clearInterval(cdIntervalRef.current); };
  }, [cdStatus, cdTick]);

  // Countdown finish side-effects
  useEffect(() => {
    if (cdFinishTick === 0) return;
    fireSound();
    fireNotification("タイマー終了", fmtTime(cdTotalSecsRef.current) + " 経過しました");
    setFlashStep(1);
    if (cdLoopRef.current) {
      const total = cdTotalSecsRef.current;
      const endTs = Date.now() + total * 1000;
      cdEndRef.current = endTs;
      setCdRemaining(total);
      setCdStatus("running");
    }
  }, [cdFinishTick, fireSound, fireNotification]);

  const cdStart = useCallback(() => {
    const total = cdH * 3600 + cdM * 60 + cdS;
    if (total === 0) return;
    ensureAudioCtx();
    const endTs = Date.now() + total * 1000;
    cdEndRef.current = endTs;
    setCdTotalSecs(total);
    setCdRemaining(total);
    setCdStatus("running");
  }, [cdH, cdM, cdS, ensureAudioCtx]);

  const cdPause = useCallback(() => {
    if (cdIntervalRef.current) clearInterval(cdIntervalRef.current);
    cdEndRef.current = null;
    setCdStatus("paused");
  }, []);

  const cdResume = useCallback(() => {
    setCdRemaining((rem) => {
      const endTs = Date.now() + rem * 1000;
      cdEndRef.current = endTs;
      return rem;
    });
    setCdStatus("running");
  }, []);

  const cdReset = useCallback(() => {
    const prevRemaining = cdRemaining;
    const prevStatus = cdStatus;
    const prevTotal = cdTotalSecs;
    if (cdIntervalRef.current) clearInterval(cdIntervalRef.current);
    cdEndRef.current = null;
    setCdStatus("idle");
    const total = cdH * 3600 + cdM * 60 + cdS;
    setCdTotalSecs(total);
    setCdRemaining(total);
    if (prevStatus !== "idle" && prevRemaining > 0) {
      toast("タイマーをリセットしました", {
        duration: 3000,
        action: {
          label: "元に戻す",
          onClick: () => {
            setCdRemaining(prevRemaining);
            setCdTotalSecs(prevTotal);
            if (prevStatus === "running") {
              cdEndRef.current = Date.now() + prevRemaining * 1000;
              setCdStatus("running");
            } else {
              setCdStatus(prevStatus);
            }
          },
        },
      });
    }
  }, [cdH, cdM, cdS, cdRemaining, cdStatus, cdTotalSecs]);

  const cdSkip = useCallback((deltaSecs: number) => {
    if (cdStatus === "idle") return;
    setCdRemaining((prev) => {
      const next = Math.max(0, Math.min(cdTotalSecs, prev + deltaSecs));
      if (cdEndRef.current !== null) cdEndRef.current = Date.now() + next * 1000;
      return next;
    });
  }, [cdStatus, cdTotalSecs]);

  const pomSkipSecs = useCallback((deltaSecs: number) => {
    if (pomStatus === "idle") return;
    setPomRemaining((prev) => {
      const total = getPhaseSecs(pomPhaseRef.current, pomSettingsRef.current);
      const next = Math.max(0, Math.min(total, prev + deltaSecs));
      if (pomEndRef.current !== null) pomEndRef.current = Date.now() + next * 1000;
      return next;
    });
  }, [pomStatus]);

  const cdSelectPreset = useCallback((idx: number) => {
    const secs = PRESETS_SECS[idx];
    if (cdIntervalRef.current) clearInterval(cdIntervalRef.current);
    cdEndRef.current = null;
    setCdActivePreset(idx);
    setCdH(Math.floor(secs / 3600));
    setCdM(Math.floor((secs % 3600) / 60));
    setCdS(secs % 60);
    setCdTotalSecs(secs);
    setCdRemaining(secs);
    setCdStatus("idle");
  }, []);

  // Sync total/remaining from spinners when idle
  useEffect(() => {
    if (cdStatus !== "idle") return;
    const total = cdH * 3600 + cdM * 60 + cdS;
    setCdTotalSecs(total);
    setCdRemaining(total);
    setCdActivePreset(PRESETS_SECS.indexOf(total));
  }, [cdH, cdM, cdS, cdStatus]);

  // ─── Pomodoro logic ───────────────────────────────────────────────────────

  const pomTick = useCallback(() => {
    if (pomEndRef.current === null) return;
    const rem = Math.max(0, Math.round((pomEndRef.current - Date.now()) / 1000));
    setPomRemaining(rem);
    if (rem === 0) {
      if (pomIntervalRef.current) clearInterval(pomIntervalRef.current);
      pomEndRef.current = null;
      setPomStatus("finished");
      setPomFinishTick((n) => n + 1);
    }
  }, []);

  useEffect(() => {
    if (pomStatus !== "running") {
      if (pomIntervalRef.current) clearInterval(pomIntervalRef.current);
      return;
    }
    pomIntervalRef.current = setInterval(pomTick, 250);
    return () => { if (pomIntervalRef.current) clearInterval(pomIntervalRef.current); };
  }, [pomStatus, pomTick]);

  // Pomodoro finish side-effects — reads current values from refs, no stale closures
  useEffect(() => {
    if (pomFinishTick === 0) return;

    const phase = pomPhaseRef.current;
    const cycle = pomCycleCountRef.current;
    const settings = pomSettingsRef.current;

    fireSound();
    setFlashStep(1);

    let nextPhase: PomPhase;
    let nextCycle: number;

    if (phase === "focus") {
      // Clamp to longBreakInterval so all dots light up before long break
      nextCycle = Math.min(cycle + 1, settings.longBreakInterval);
      nextPhase = nextCycle >= settings.longBreakInterval ? "longBreak" : "shortBreak";
      fireNotification("集中セッション完了！", "休憩しましょう");
      const added = settings.focusMinutes * 60;
      setDailyFocusSecs((prev) => {
        const next = prev + added;
        try { localStorage.setItem(DAILY_FOCUS_KEY, JSON.stringify({ date: todayStr(), focusSeconds: next })); } catch { /* ignore */ }
        return next;
      });
    } else {
      nextPhase = "focus";
      nextCycle = phase === "longBreak" ? 0 : cycle;
      fireNotification("休憩終了", "作業を再開しましょう");
    }

    const nextTotal = getPhaseSecs(nextPhase, settings);

    setPomPhase(nextPhase);
    pomPhaseRef.current = nextPhase;
    setPomCycleCount(nextCycle);
    pomCycleCountRef.current = nextCycle;
    setPomRemaining(nextTotal);

    try { localStorage.setItem(POM_PROGRESS_KEY, JSON.stringify({ phase: nextPhase, cycleCount: nextCycle })); } catch { /* ignore */ }

    if (settings.autoAdvance) {
      const endTs = Date.now() + nextTotal * 1000;
      pomEndRef.current = endTs;
      setPomStatus("running");
    } else {
      setPomStatus("idle");
    }
  }, [pomFinishTick, fireSound, fireNotification]);

  const pomStart = useCallback(() => {
    ensureAudioCtx();
    setPomRemaining((rem) => {
      const endTs = Date.now() + rem * 1000;
      pomEndRef.current = endTs;
      return rem;
    });
    setPomStatus("running");
  }, [ensureAudioCtx]);

  const pomPause = useCallback(() => {
    if (pomIntervalRef.current) clearInterval(pomIntervalRef.current);
    pomEndRef.current = null;
    setPomStatus("paused");
  }, []);

  const pomResume = useCallback(() => {
    setPomRemaining((rem) => {
      const endTs = Date.now() + rem * 1000;
      pomEndRef.current = endTs;
      return rem;
    });
    setPomStatus("running");
  }, []);

  const pomReset = useCallback(() => {
    if (pomIntervalRef.current) clearInterval(pomIntervalRef.current);
    pomEndRef.current = null;
    setPomStatus("idle");
    // remaining resets via the idle useEffect
  }, []);

  const pomSkip = useCallback(() => {
    if (pomIntervalRef.current) clearInterval(pomIntervalRef.current);
    pomEndRef.current = null;

    const phase = pomPhaseRef.current;
    const cycle = pomCycleCountRef.current;
    const settings = pomSettingsRef.current;

    let nextPhase: PomPhase;
    let nextCycle: number;

    if (phase === "focus") {
      nextCycle = Math.min(cycle + 1, settings.longBreakInterval);
      nextPhase = nextCycle >= settings.longBreakInterval ? "longBreak" : "shortBreak";
    } else {
      nextPhase = "focus";
      nextCycle = phase === "longBreak" ? 0 : cycle;
    }

    setPomPhase(nextPhase);
    pomPhaseRef.current = nextPhase;
    setPomCycleCount(nextCycle);
    pomCycleCountRef.current = nextCycle;
    setPomRemaining(getPhaseSecs(nextPhase, settings));
    setPomStatus("idle");

    try { localStorage.setItem(POM_PROGRESS_KEY, JSON.stringify({ phase: nextPhase, cycleCount: nextCycle })); } catch { /* ignore */ }
  }, []);

  const savePomSettings = useCallback((next: PomSettings) => {
    if (pomIntervalRef.current) clearInterval(pomIntervalRef.current);
    pomEndRef.current = null;
    setPomSettings(next);
    pomSettingsRef.current = next;
    setPomStatus("idle");
    try { localStorage.setItem(POM_SETTINGS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  // ─── Page Visibility API ──────────────────────────────────────────────────

  useEffect(() => {
    if (!mounted) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;

      if (cdEndRef.current !== null) {
        const rem = Math.max(0, Math.round((cdEndRef.current - Date.now()) / 1000));
        setCdRemaining(rem);
        if (rem === 0) {
          if (cdIntervalRef.current) clearInterval(cdIntervalRef.current);
          cdEndRef.current = null;
          setCdStatus("finished");
          setCdFinishTick((n) => n + 1);
        }
      }

      if (pomEndRef.current !== null) {
        const rem = Math.max(0, Math.round((pomEndRef.current - Date.now()) / 1000));
        setPomRemaining(rem);
        if (rem === 0) {
          if (pomIntervalRef.current) clearInterval(pomIntervalRef.current);
          pomEndRef.current = null;
          setPomStatus("finished");
          setPomFinishTick((n) => n + 1);
        }
      }

      audioCtxRef.current?.resume();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [mounted]);

  // ─── Tab title ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mounted) return;
    const rem = mainMode === "countdown" ? cdRemaining : pomRemaining;
    const running = cdStatus === "running" || pomStatus === "running";
    document.title = running ? `[${fmtTime(rem)}] タイマー | タダtools` : "タイマー | タダtools";
    return () => { document.title = "タイマー | タダtools"; };
  }, [mounted, mainMode, cdStatus, pomStatus, cdRemaining, pomRemaining]);

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        if (mainMode === "countdown") {
          if (cdStatus === "running") cdPause();
          else if (cdStatus === "paused") cdResume();
          else cdStart();
        } else {
          if (pomStatus === "running") pomPause();
          else if (pomStatus === "paused") pomResume();
          else pomStart();
        }
      } else if (e.key === "r" || e.key === "R" || e.key === "Escape") {
        if (mainMode === "countdown") cdReset(); else pomReset();
      } else if (e.key === "m" || e.key === "M") {
        savePrefs({ ...prefsRef.current, soundEnabled: !prefsRef.current.soundEnabled });
      } else if (e.key === "t" || e.key === "T") {
        setMainMode((m) => m === "countdown" ? "pomodoro" : "countdown");
      } else if (mainMode === "countdown") {
        const n = parseInt(e.key);
        if (n >= 1 && n <= 6) cdSelectPreset(n - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, mainMode, cdStatus, pomStatus, cdStart, cdPause, cdResume, cdReset, pomStart, pomPause, pomResume, pomReset, cdSelectPreset, savePrefs]);

  // ─── Notification request ─────────────────────────────────────────────────

  const handleShare = useCallback(() => {
    const payload = { mode: "cd", secs: cdTotalSecs };
    const url = generateShareUrl(payload);
    navigator.clipboard.writeText(url)
      .then(() => {
        toast("URLをコピーしました");
        setShareSuccess(true);
        if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
        shareTimerRef.current = setTimeout(() => setShareSuccess(false), 2000);
      })
      .catch(() => toast("コピーに失敗しました"));
  }, [cdTotalSecs]);

  const handlePomShare = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("tab", "pom");
    navigator.clipboard.writeText(url.toString())
      .then(() => {
        toast("URLをコピーしました");
        setPomShareSuccess(true);
        if (pomShareTimerRef.current) clearTimeout(pomShareTimerRef.current);
        pomShareTimerRef.current = setTimeout(() => setPomShareSuccess(false), 2000);
      })
      .catch(() => toast("コピーに失敗しました"));
  }, []);

  const requestNotification = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    if (perm === "granted") savePrefs({ ...prefsRef.current, notificationEnabled: true });
  }, [savePrefs]);

  // ─── Derived values ───────────────────────────────────────────────────────

  const isRunning = cdStatus === "running" || pomStatus === "running";
  const cdInputTotal = cdH * 3600 + cdM * 60 + cdS;
  const cdProgress = cdTotalSecs > 0 ? cdRemaining / cdTotalSecs : 1;
  const pomTotalSecs = getPhaseSecs(pomPhase, pomSettings);
  const pomProgress = pomTotalSecs > 0 ? pomRemaining / pomTotalSecs : 1;
  const cdAlert = cdStatus === "running" && cdRemaining <= 10;
  const pomAlert = pomStatus === "running" && pomRemaining <= 10;
  const cdPulse = cdStatus === "running" && cdRemaining <= 3;
  const pomPulse = pomStatus === "running" && pomRemaining <= 3;
  const dailyH = Math.floor(dailyFocusSecs / 3600);
  const dailyM = Math.floor((dailyFocusSecs % 3600) / 60);
  const dailyLabel = dailyH > 0 ? `${dailyH}時間${dailyM}分` : `${dailyM}分`;

  if (!mounted) {
    return (
      <ToolLayout title="タイマー" adVisible>
        <div className="h-96" />
      </ToolLayout>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
    {/* フルスクリーンオーバーレイ */}
    <AnimatePresence>
      {isFocusMode && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="fixed inset-0 z-50">
          <TimerFocusMode
            timeStr={fmtTime(mainMode === "countdown" ? cdRemaining : pomRemaining)}
            progress={mainMode === "countdown" ? cdProgress : pomProgress}
            isRunning={mainMode === "countdown" ? cdStatus === "running" : pomStatus === "running"}
            isFinished={mainMode === "countdown" ? cdStatus === "finished" : pomStatus === "finished"}
            phaseLabel={mainMode === "pomodoro" ? pomPhaseLabel(pomPhase) : undefined}
            phaseDots={mainMode === "pomodoro" ? { total: pomSettings.longBreakInterval, filled: pomCycleCount } : undefined}
            onToggle={() => {
              if (mainMode === "countdown") {
                if (cdStatus === "running") cdPause();
                else if (cdStatus === "paused") cdResume();
                else cdStart();
              } else {
                if (pomStatus === "running") pomPause();
                else if (pomStatus === "paused") pomResume();
                else pomStart();
              }
            }}
            onReset={() => { if (mainMode === "countdown") cdReset(); else pomReset(); }}
            onExit={() => setIsFocusMode(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>

    <ToolLayout title="タイマー" adVisible>
      {showFlash && (
        <div className="fixed inset-0 bg-accent/20 pointer-events-none z-50" aria-hidden="true" />
      )}

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6 items-center">

        {/* Mode tab */}
        <div role="tablist" aria-label="タイマーモード" className="flex bg-muted rounded-xl p-1 w-full max-w-xs">
          {(["countdown", "pomodoro"] as MainMode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mainMode === m}
              onClick={() => setMainMode(m)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                mainMode === m
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "countdown" ? "カウントダウン" : "ポモドーロ"}
            </button>
          ))}
        </div>

        {mainMode === "countdown" ? (
          /* ─────────── Countdown Panel ─────────── */
          <>
            {/* プリセット・スピナー — idle時のみ表示 */}
            {cdStatus === "idle" && (
            <div role="group" aria-label="時間プリセット" className="flex gap-2 flex-wrap justify-center">
              {PRESET_LABELS.map((label, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => cdSelectPreset(i)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    cdActivePreset === i
                      ? "bg-accent/10 border-accent text-accent"
                      : "bg-muted border-transparent text-foreground hover:bg-muted/80"
                  }`}
                >
                  {label}
                </motion.button>
              ))}
            </div>
            )}

            {/* Time display */}
            <motion.div
              animate={cdPulse ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={cdPulse ? { duration: 1, repeat: Infinity } : {}}
            >
              <span
                className={`text-6xl lg:text-7xl font-bold tabular-nums transition-colors ${
                  cdAlert ? "text-accent" : "text-foreground"
                }`}
                aria-live="polite"
                aria-atomic="true"
                aria-label={`残り ${fmtTime(cdRemaining)}`}
              >
                {fmtTime(cdRemaining)}
              </span>
            </motion.div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${cdProgress * 100}%` }}
              />
            </div>

            {/* H/M/S spinners (idle only) */}
            {cdStatus === "idle" && (
              <div className="flex items-end gap-4">
                {(
                  [
                    { label: "時", value: cdH, max: 23, setter: setCdH },
                    { label: "分", value: cdM, max: 59, setter: setCdM },
                    { label: "秒", value: cdS, max: 59, setter: setCdS },
                  ] as const
                ).map(({ label, value, max, setter }) => (
                  <SpinnerField key={label} label={label} value={value} max={max} onChange={setter} />
                ))}
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.08 }}
                onClick={cdReset}
                className="flex items-center justify-center w-11 h-11 rounded-xl border border-border bg-background hover:bg-muted transition-colors"
                aria-label="リセット"
              >
                <RotateCcw className="size-4 text-muted-foreground" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.08 }}
                disabled={cdStatus === "idle" && cdInputTotal === 0}
                onClick={
                  cdStatus === "running" ? cdPause
                  : cdStatus === "paused" ? cdResume
                  : cdStart
                }
                className="flex items-center justify-center gap-2 px-8 h-14 rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors shadow-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={cdStatus === "running" ? "一時停止" : cdStatus === "paused" ? "再開" : "スタート"}
              >
                {cdStatus === "running"
                  ? <><Pause className="size-5 fill-white" /><span>一時停止</span></>
                  : cdStatus === "paused"
                  ? <><Play className="size-5 fill-white" /><span>再開</span></>
                  : <><Play className="size-5 fill-white" /><span>スタート</span></>}
              </motion.button>
            </div>

            {/* スキップボタン（動作中 or 一時停止中のみ） */}
            {cdStatus !== "idle" && (
              <div className="flex items-center gap-1.5">
                {[[-60, "-1分"], [-30, "-30秒"], [-10, "-10秒"], [10, "+10秒"], [30, "+30秒"], [60, "+1分"]].map(([secs, label]) => (
                  <button
                    key={secs}
                    onClick={() => cdSkip(secs as number)}
                    className="h-7 px-2 rounded-lg text-xs border border-border bg-card hover:bg-muted transition-colors tabular-nums"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* ループ・音量・共有・?・フルスクリーン */}
            <div className="flex items-center gap-3 flex-wrap justify-center relative">
              <button
                onClick={() => setCdLoop((l) => !l)}
                className={`flex items-center gap-1.5 text-sm transition-colors ${cdLoop ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
                aria-pressed={cdLoop}
              >
                <RefreshCw className="size-4" />
                ループ
              </button>
              {/* 音量 */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => savePrefs({ ...prefs, volume: prefs.volume > 0 ? 0 : 0.7 })}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={prefs.volume === 0 ? "音をオンにする" : "音をオフにする"}
                >
                  {prefs.volume === 0 ? <VolumeX className="size-4" /> : prefs.volume < 0.4 ? <Volume1 className="size-4" /> : <Volume2 className="size-4" />}
                </button>
                <input type="range" min="0" max="1" step="0.05" value={prefs.volume}
                  onChange={(e) => savePrefs({ ...prefs, volume: parseFloat(e.target.value) })}
                  className="w-20 accent-[var(--accent)]"
                  aria-label="音量"
                />
              </div>
              {/* 共有 */}
              <button onClick={handleShare} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="URLで共有">
                {shareSuccess ? <Check className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
              </button>
              {/* 通知 */}
              {typeof Notification !== "undefined" && Notification.permission !== "denied" && !prefs.notificationEnabled && (
                <button onClick={requestNotification} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  通知でお知らせ
                </button>
              )}
              {/* ? ショートカット */}
              {showShortcuts && (
                <div className="absolute bottom-full right-0 mb-2 w-64 rounded-lg border border-border bg-background shadow-lg p-3 z-50 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground mb-2">キーボードショートカット</p>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>Space</span><span>スタート / 一時停止 / 再開</span></div>
                    <div className="flex justify-between"><span>R / Esc</span><span>リセット</span></div>
                    <div className="flex justify-between"><span>M</span><span>音量オン/オフ</span></div>
                    <div className="flex justify-between"><span>T</span><span>モード切替</span></div>
                    <div className="flex justify-between"><span>1〜6</span><span>プリセット選択</span></div>
                  </div>
                </div>
              )}
              <button onClick={() => setShowShortcuts(v => !v)} className="w-7 h-7 flex items-center justify-center rounded-md border border-border bg-card text-xs font-bold text-muted-foreground hover:bg-muted transition-colors" aria-label="キーボードショートカット">?</button>
              {/* フルスクリーン */}
              <button onClick={() => setIsFocusMode(true)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="フルスクリーン">
                <Maximize2 className="size-4" />
              </button>
            </div>
          </>
        ) : (
          /* ─────────── Pomodoro Panel ─────────── */
          <>
            {/* Phase + dots */}
            <div className="flex flex-col items-center gap-2">
              <span className={`text-sm font-medium tracking-wide ${pomPhase === "focus" ? "text-accent" : "text-muted-foreground"}`}>
                {pomPhaseLabel(pomPhase)}
              </span>
              <div
                className="flex gap-2"
                aria-label={`${pomCycleCount}/${pomSettings.longBreakInterval} セッション完了`}
              >
                {Array.from({ length: pomSettings.longBreakInterval }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${i < pomCycleCount ? "bg-accent" : "bg-border"}`}
                  />
                ))}
              </div>
            </div>

            {/* Time display */}
            <motion.div
              animate={pomPulse ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={pomPulse ? { duration: 1, repeat: Infinity } : {}}
            >
              <span
                className={`text-6xl lg:text-7xl font-bold tabular-nums transition-colors ${pomAlert ? "text-accent" : "text-foreground"}`}
                aria-live="polite"
                aria-atomic="true"
                aria-label={`残り ${fmtTime(pomRemaining)}`}
              >
                {fmtTime(pomRemaining)}
              </span>
            </motion.div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${pomProgress * 100}%` }}
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.08 }}
                onClick={pomReset}
                className="flex items-center justify-center w-11 h-11 rounded-xl border border-border bg-background hover:bg-muted transition-colors"
                aria-label="リセット"
              >
                <RotateCcw className="size-4 text-muted-foreground" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.08 }}
                onClick={
                  pomStatus === "running" ? pomPause
                  : pomStatus === "paused" ? pomResume
                  : pomStart
                }
                className="flex items-center justify-center gap-2 px-8 h-14 rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors shadow-sm font-medium"
                aria-label={pomStatus === "running" ? "一時停止" : pomStatus === "paused" ? "再開" : "スタート"}
              >
                {pomStatus === "running"
                  ? <><Pause className="size-5 fill-white" /><span>一時停止</span></>
                  : pomStatus === "paused"
                  ? <><Play className="size-5 fill-white" /><span>再開</span></>
                  : <><Play className="size-5 fill-white" /><span>スタート</span></>}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.08 }}
                onClick={pomSkip}
                className="flex items-center justify-center w-11 h-11 rounded-xl border border-border bg-background hover:bg-muted transition-colors"
                aria-label="フェーズをスキップ"
              >
                <SkipForward className="size-4 text-muted-foreground" />
              </motion.button>
            </div>

            {/* スキップボタン（動作中 or 一時停止中） */}
            {pomStatus !== "idle" && (
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {[[-60, "-1分"], [-30, "-30秒"], [-10, "-10秒"], [10, "+10秒"], [30, "+30秒"], [60, "+1分"]].map(([secs, label]) => (
                  <button
                    key={secs}
                    onClick={() => pomSkipSecs(secs as number)}
                    className="h-7 px-2 rounded-lg text-xs border border-border bg-card hover:bg-muted transition-colors tabular-nums"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* 設定パネル — 停止中・一時停止中のみ表示 */}
            {pomStatus !== "running" && <div className="w-full rounded-xl border border-border/60 bg-card/50 p-4 flex flex-col gap-3 text-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">タイマー設定</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                {(
                  [
                    { key: "focusMinutes" as const, label: "集中", min: 1, max: 60, unit: "分" },
                    { key: "shortBreakMinutes" as const, label: "短休憩", min: 1, max: 30, unit: "分" },
                    { key: "longBreakMinutes" as const, label: "長休憩", min: 1, max: 60, unit: "分" },
                    { key: "longBreakInterval" as const, label: "長休憩まで", min: 1, max: 8, unit: "回" },
                  ] as const
                ).map(({ key, label, min, max, unit }) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs whitespace-nowrap">{label}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => savePomSettings({ ...pomSettings, [key]: Math.max(min, pomSettings[key] - 1) })}
                        className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors text-sm"
                      >−</button>
                      <span className="w-10 text-center tabular-nums font-semibold text-sm">{pomSettings[key]}{unit}</span>
                      <button
                        onClick={() => savePomSettings({ ...pomSettings, [key]: Math.min(max, pomSettings[key] + 1) })}
                        className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors text-sm"
                      >＋</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                <span className="text-xs text-muted-foreground">自動進行</span>
                <button
                  onClick={() => savePomSettings({ ...pomSettings, autoAdvance: !pomSettings.autoAdvance })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${pomSettings.autoAdvance ? "bg-accent" : "bg-zinc-300 dark:bg-zinc-600"}`}
                  role="switch" aria-checked={pomSettings.autoAdvance}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${pomSettings.autoAdvance ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>}

            {/* 音量・通知・フルスクリーン */}
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => savePrefs({ ...prefs, volume: prefs.volume > 0 ? 0 : 0.7 })}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={prefs.volume === 0 ? "音をオンにする" : "音をオフにする"}
                >
                  {prefs.volume === 0 ? <VolumeX className="size-4" /> : prefs.volume < 0.4 ? <Volume1 className="size-4" /> : <Volume2 className="size-4" />}
                </button>
                <input type="range" min="0" max="1" step="0.05" value={prefs.volume}
                  onChange={(e) => savePrefs({ ...prefs, volume: parseFloat(e.target.value) })}
                  className="w-20 accent-[var(--accent)]"
                  aria-label="音量"
                />
              </div>
              {/* 共有 */}
              <button onClick={handlePomShare} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="URLで共有">
                {pomShareSuccess ? <Check className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
              </button>
              {typeof Notification !== "undefined" && Notification.permission !== "denied" && !prefs.notificationEnabled && (
                <button onClick={requestNotification} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  通知でお知らせ
                </button>
              )}
              <button onClick={() => setShowShortcuts(v => !v)} className="w-7 h-7 flex items-center justify-center rounded-md border border-border bg-card text-xs font-bold text-muted-foreground hover:bg-muted transition-colors" aria-label="キーボードショートカット">?</button>
              <button onClick={() => setIsFocusMode(true)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="フルスクリーン">
                <Maximize2 className="size-4" />
              </button>
            </div>

            {/* Daily focus */}
            {dailyFocusSecs > 0 && (
              <p className="text-sm text-muted-foreground">
                今日の集中時間: <span className="font-medium text-foreground">{dailyLabel}</span>
              </p>
            )}
          </>
        )}
      </div>
    </ToolLayout>
    </>
  );
}
