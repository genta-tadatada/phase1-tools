"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, SkipForward,
  Volume2, VolumeX, Settings, RefreshCw,
} from "lucide-react";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";

// ─── Constants ──────────────────────────────────────────────────────────────

const PRESETS_SECS = [60, 180, 300, 600, 1500, 3600];
const PRESET_LABELS = ["1分", "3分", "5分", "10分", "25分", "60分"];

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

function playFinish(ctx: AudioContext) {
  const schedule: [number, number][] = [[880, 0], [1100, 0.25], [1320, 0.5]];
  schedule.forEach(([freq, delay]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0.3, t);
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
};

// ─── Component ───────────────────────────────────────────────────────────────

export function TimerTool() {
  const [mounted, setMounted] = useState(false);
  const [mainMode, setMainMode] = useState<MainMode>("countdown");

  // Shared
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ── Countdown ────────────────────────────────────────────────────────────
  const [cdH, setCdH] = useState(0);
  const [cdM, setCdM] = useState(25);
  const [cdS, setCdS] = useState(0);
  const [cdTotalSecs, setCdTotalSecs] = useState(1500);
  const [cdRemaining, setCdRemaining] = useState(1500);
  const [cdStatus, setCdStatus] = useState<TimerStatus>("idle");
  const [cdLoop, setCdLoop] = useState(false);
  const [cdActivePreset, setCdActivePreset] = useState(4);
  const cdEndRef = useRef<number | null>(null);
  const cdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cdFinishTick, setCdFinishTick] = useState(0);
  // ref copy of cdTotalSecs for use inside finish effect
  const cdTotalSecsRef = useRef(1500);
  const cdLoopRef = useRef(false);
  useEffect(() => { cdTotalSecsRef.current = cdTotalSecs; }, [cdTotalSecs]);
  useEffect(() => { cdLoopRef.current = cdLoop; }, [cdLoop]);

  // ── Pomodoro ─────────────────────────────────────────────────────────────
  const [pomSettings, setPomSettings] = useState<PomSettings>(DEFAULT_POM);
  const [pomPhase, setPomPhase] = useState<PomPhase>("focus");
  const [pomCycleCount, setPomCycleCount] = useState(0);
  const [pomRemaining, setPomRemaining] = useState(DEFAULT_POM.focusMinutes * 60);
  const [pomStatus, setPomStatus] = useState<TimerStatus>("idle");
  const [pomSettingsOpen, setPomSettingsOpen] = useState(false);
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

    // Load prefs
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) setPrefs(JSON.parse(raw));
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
    if (!prefsRef.current.soundEnabled) return;
    const ctx = ensureAudioCtx();
    if (ctx) playFinish(ctx);
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
    if (cdIntervalRef.current) clearInterval(cdIntervalRef.current);
    cdEndRef.current = null;
    setCdStatus("idle");
    const total = cdH * 3600 + cdM * 60 + cdS;
    setCdTotalSecs(total);
    setCdRemaining(total);
  }, [cdH, cdM, cdS]);

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
    <ToolLayout title="タイマー" adVisible={!isRunning}>
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
            {/* Presets */}
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
                  <div key={label} className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <div className="flex flex-col">
                      <button
                        onClick={() => setter(Math.min(max, value + 1))}
                        className="w-10 h-7 flex items-center justify-center rounded-t-lg border border-border bg-background hover:bg-muted transition-colors text-muted-foreground text-sm"
                        aria-label={`${label}を増やす`}
                      >▴</button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={max}
                        value={String(value).padStart(2, "0")}
                        onChange={(e) => setter(Math.max(0, Math.min(max, parseInt(e.target.value) || 0)))}
                        className="w-10 h-12 text-center text-xl font-bold tabular-nums border-x border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        aria-label={`${label}の入力`}
                      />
                      <button
                        onClick={() => setter(Math.max(0, value - 1))}
                        className="w-10 h-7 flex items-center justify-center rounded-b-lg border border-border bg-background hover:bg-muted transition-colors text-muted-foreground text-sm"
                        aria-label={`${label}を減らす`}
                      >▾</button>
                    </div>
                  </div>
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

            {/* Loop + Mute */}
            <div className="flex items-center gap-5">
              <button
                onClick={() => setCdLoop((l) => !l)}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  cdLoop ? "text-accent" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={cdLoop}
              >
                <RefreshCw className="size-4" />
                ループ
              </button>
              <button
                onClick={() => savePrefs({ ...prefs, soundEnabled: !prefs.soundEnabled })}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={prefs.soundEnabled ? "音をオフにする" : "音をオンにする"}
              >
                {prefs.soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
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

            {/* Sound + Settings + Notification */}
            <div className="flex items-center gap-5">
              <button
                onClick={() => savePrefs({ ...prefs, soundEnabled: !prefs.soundEnabled })}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={prefs.soundEnabled ? "音をオフにする" : "音をオンにする"}
              >
                {prefs.soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </button>
              <button
                onClick={() => setPomSettingsOpen((o) => !o)}
                className={`flex items-center gap-1.5 text-sm transition-colors ${pomSettingsOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Settings className="size-4" />
                設定
              </button>
              {typeof Notification !== "undefined" &&
                Notification.permission !== "denied" &&
                !prefs.notificationEnabled && (
                  <button
                    onClick={requestNotification}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    通知を許可
                  </button>
                )}
            </div>

            {/* Settings panel */}
            <AnimatePresence>
              {pomSettingsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full overflow-hidden"
                >
                  <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 text-sm">
                    {(
                      [
                        { key: "focusMinutes" as const, label: "集中時間（分）", min: 1, max: 60 },
                        { key: "shortBreakMinutes" as const, label: "短休憩（分）", min: 1, max: 30 },
                        { key: "longBreakMinutes" as const, label: "長休憩（分）", min: 1, max: 60 },
                        { key: "longBreakInterval" as const, label: "長休憩まで（回）", min: 1, max: 8 },
                      ] as const
                    ).map(({ key, label, min, max }) => (
                      <div key={key} className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">{label}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => savePomSettings({ ...pomSettings, [key]: Math.max(min, pomSettings[key] - 1) })}
                            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                            aria-label={`${label}を減らす`}
                          >−</button>
                          <span className="w-8 text-center tabular-nums font-medium">{pomSettings[key]}</span>
                          <button
                            onClick={() => savePomSettings({ ...pomSettings, [key]: Math.min(max, pomSettings[key] + 1) })}
                            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                            aria-label={`${label}を増やす`}
                          >＋</button>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">自動進行</span>
                      <button
                        onClick={() => savePomSettings({ ...pomSettings, autoAdvance: !pomSettings.autoAdvance })}
                        className={`relative w-11 h-6 rounded-full transition-colors ${pomSettings.autoAdvance ? "bg-accent" : "bg-muted"}`}
                        role="switch"
                        aria-checked={pomSettings.autoAdvance}
                        aria-label="自動進行"
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${pomSettings.autoAdvance ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
  );
}
