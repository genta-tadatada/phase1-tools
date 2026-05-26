"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { Button } from "@/components/ui/button";

// ---- 型定義 ----
type TimerMode = "work" | "short-break" | "long-break";
type TimerStatus = "idle" | "running" | "paused";

interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
  soundEnabled: boolean;
  autoStart: boolean;
  notificationEnabled: boolean;
}

interface PomodoroSession {
  id: string;
  taskName: string;
  completedAt: number;
  mode: TimerMode;
}

interface StoredState {
  settings: PomodoroSettings;
  sessionCount: number;
  completedSessions: PomodoroSession[];
  lastResetDate: string;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  soundEnabled: true,
  autoStart: false,
  notificationEnabled: false,
};

const STORAGE_KEY = "phase1-pomodoro-state";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---- Web Audio チャイム ----
function playChime(audioCtxRef: React.MutableRefObject<AudioContext | null>) {
  try {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.3);
      osc.type = "sine";
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.3);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.3 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.5);
      osc.start(ctx.currentTime + i * 0.3);
      osc.stop(ctx.currentTime + i * 0.3 + 0.5);
    });
  } catch {
    // ignore
  }
}

const MODE_LABELS: Record<TimerMode, string> = {
  work: "作業",
  "short-break": "短休憩",
  "long-break": "長休憩",
};

// ---- SVG 円形プログレスバー ----
function CircularTimer({
  remainSeconds,
  totalSeconds,
  mode,
  displayText,
}: {
  remainSeconds: number;
  totalSeconds: number;
  mode: TimerMode;
  displayText: string;
}) {
  const radius = 96;
  const cx = 120;
  const cy = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? remainSeconds / totalSeconds : 1;
  const strokeDashoffset = circumference * (1 - progress);

  const strokeColor =
    mode === "work"
      ? "#0ea5e9"
      : mode === "short-break"
      ? "#22c55e"
      : "#16a34a";

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width="240"
        height="240"
        viewBox="0 0 240 240"
        aria-hidden="true"
        className="rotate-[-90deg]"
      >
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.5s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={displayText}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-5xl font-bold tabular-nums"
            aria-live="polite"
          >
            {displayText}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---- メインコンポーネント ----
export function PomodoroTool() {
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [sessionCount, setSessionCount] = useState(0);
  const [completedSessions, setCompletedSessions] = useState<PomodoroSession[]>([]);
  const [mode, setMode] = useState<TimerMode>("work");
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [remainSeconds, setRemainSeconds] = useState(DEFAULT_SETTINGS.workMinutes * 60);
  const [taskName, setTaskName] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedSecondsRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = useMemo(() => {
    if (mode === "work") return settings.workMinutes * 60;
    if (mode === "short-break") return settings.shortBreakMinutes * 60;
    return settings.longBreakMinutes * 60;
  }, [mode, settings]);

  // SSR対策：マウント後にlocalStorageから復元
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: StoredState = JSON.parse(saved);
        const today = todayStr();
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.lastResetDate === today) {
          setSessionCount(parsed.sessionCount ?? 0);
          setCompletedSessions(parsed.completedSessions ?? []);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // モード変更時：残り秒数をリセット（idle時のみ）
  useEffect(() => {
    if (status !== "idle") return;
    setRemainSeconds(totalSeconds);
  }, [totalSeconds, status]);

  // タイマーtick
  useEffect(() => {
    if (status !== "running") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current === null) return;
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remain = totalSeconds - pausedSecondsRef.current - elapsed;
      if (remain <= 0) {
        clearInterval(intervalRef.current!);
        setRemainSeconds(0);
        setStatus("idle");
        startTimeRef.current = null;
        pausedSecondsRef.current = 0;
        // 完了処理はセッション終了を通知するためにseparateで行う
        setCompletionPending(true);
      } else {
        setRemainSeconds(remain);
      }
    }, 500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, totalSeconds]);

  const [completionPending, setCompletionPending] = useState(false);

  useEffect(() => {
    if (!completionPending) return;
    setCompletionPending(false);

    if (settings.soundEnabled) playChime(audioCtxRef);

    if (settings.notificationEnabled && typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("ポモドーロ完了！", {
        body: mode === "work" ? "お疲れさまです。休憩しましょう。" : "休憩終了。作業を再開しましょう。",
      });
    }

    if (mode === "work") {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      const newSession: PomodoroSession = {
        id: `${Date.now()}`,
        taskName,
        completedAt: Date.now(),
        mode: "work",
      };
      const newSessions = [newSession, ...completedSessions].slice(0, 50);
      setCompletedSessions(newSessions);

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            settings,
            sessionCount: newCount,
            completedSessions: newSessions,
            lastResetDate: todayStr(),
          })
        );
      } catch {
        // ignore
      }

      const nextMode: TimerMode =
        newCount % settings.longBreakInterval === 0 ? "long-break" : "short-break";
      setMode(nextMode);
    } else {
      setMode("work");
    }
  }, [completionPending]); // eslint-disable-line react-hooks/exhaustive-deps

  // ブラウザタブタイトル更新
  useEffect(() => {
    if (!mounted) return;
    if (status === "running") {
      const m = String(Math.floor(remainSeconds / 60)).padStart(2, "0");
      const s = String(remainSeconds % 60).padStart(2, "0");
      document.title = `[${m}:${s}] ポモドーロ | タダtools`;
    } else {
      document.title = "ポモドーロタイマー | タダtools";
    }
    return () => {
      document.title = "ポモドーロタイマー | タダtools";
    };
  }, [remainSeconds, status, mounted]);

  const handleStart = useCallback(() => {
    startTimeRef.current = Date.now();
    pausedSecondsRef.current = 0;
    setStatus("running");
  }, []);

  const handlePause = useCallback(() => {
    if (startTimeRef.current !== null) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      pausedSecondsRef.current += elapsed;
    }
    startTimeRef.current = null;
    setStatus("paused");
  }, []);

  const handleResume = useCallback(() => {
    startTimeRef.current = Date.now();
    setStatus("running");
  }, []);

  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    startTimeRef.current = null;
    pausedSecondsRef.current = 0;
    setStatus("idle");
    setRemainSeconds(totalSeconds);
  }, [totalSeconds]);

  const handleModeChange = useCallback(
    (newMode: TimerMode) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      startTimeRef.current = null;
      pausedSecondsRef.current = 0;
      setStatus("idle");
      setMode(newMode);
    },
    []
  );

  const handleSettingsSave = useCallback((next: PomodoroSettings) => {
    setSettings(next);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const base = saved ? JSON.parse(saved) : {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...base, settings: next }));
    } catch {
      // ignore
    }
  }, []);

  const requestNotification = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      handleSettingsSave({ ...settings, notificationEnabled: true });
    }
  };

  const mm = String(Math.floor(remainSeconds / 60)).padStart(2, "0");
  const ss = String(remainSeconds % 60).padStart(2, "0");
  const displayText = `${mm}:${ss}`;

  const sessionDots = Array.from({ length: settings.longBreakInterval });
  const filledDots = sessionCount % settings.longBreakInterval;

  const bgClass =
    status === "running"
      ? mode === "work"
        ? "bg-sky-50 dark:bg-sky-950/30"
        : "bg-green-50 dark:bg-green-950/30"
      : "";

  return (
    <ToolLayout title="ポモドーロタイマー" adVisible={status !== "running"}>
      <div className={`rounded-2xl transition-colors duration-500 ${bgClass}`}>
        <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-6 items-center">
          {/* モード切替タブ */}
          <div role="tablist" className="flex gap-1 bg-muted rounded-xl p-1 w-full">
            {(["work", "short-break", "long-break"] as TimerMode[]).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => handleModeChange(m)}
                className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                  mode === m
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          {/* 円形タイマー */}
          <CircularTimer
            remainSeconds={remainSeconds}
            totalSeconds={totalSeconds}
            mode={mode}
            displayText={displayText}
          />

          {/* セッションドット */}
          <div className="flex gap-2 items-center">
            {sessionDots.map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i < filledDots ? "bg-[#0ea5e9]" : "bg-border"
                }`}
              />
            ))}
          </div>

          {/* メインボタン */}
          <div className="flex gap-3 items-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.08 }}
              onClick={handleReset}
              className="flex items-center justify-center w-11 h-11 rounded-xl border border-border bg-background hover:bg-muted transition-colors"
              aria-label="リセット"
            >
              <RotateCcw className="size-4 text-muted-foreground" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.08 }}
              onClick={
                status === "idle"
                  ? handleStart
                  : status === "paused"
                  ? handleResume
                  : handlePause
              }
              className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0ea5e9] text-white hover:bg-[#0ea5e9]/90 transition-colors shadow-sm"
              aria-label={status === "running" ? "一時停止" : "開始"}
            >
              {status === "running" ? (
                <Pause className="size-6 fill-white" />
              ) : (
                <Play className="size-6 fill-white" />
              )}
            </motion.button>
          </div>

          {/* タスク名 */}
          <div className="w-full">
            <input
              type="text"
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 placeholder:text-muted-foreground"
              placeholder="今取り組んでいるタスク（任意）"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />
          </div>

          {/* 今日の完了リスト */}
          {completedSessions.length > 0 && (
            <div className="w-full">
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {historyOpen ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
                今日の完了（{completedSessions.filter((s) => s.mode === "work").length}）
              </button>
              {historyOpen && (
                <div className="mt-2 rounded-xl border border-border bg-card divide-y divide-border max-h-48 overflow-y-auto">
                  {completedSessions.map((s) => (
                    <div key={s.id} className="px-4 py-2 flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {new Date(s.completedAt).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="flex-1 truncate">
                        {s.taskName || "（タスク名なし）"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 設定パネル */}
          <div className="w-full">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {settingsOpen ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
              設定
            </button>
            {settingsOpen && (
              <div className="mt-2 rounded-xl border border-border bg-card p-4 flex flex-col gap-3 text-sm">
                {(
                  [
                    { key: "workMinutes" as const, label: "作業時間（分）", max: 60 },
                    { key: "shortBreakMinutes" as const, label: "短休憩（分）", max: 60 },
                    { key: "longBreakMinutes" as const, label: "長休憩（分）", max: 60 },
                    { key: "longBreakInterval" as const, label: "長休憩まで（回）", max: 8 },
                  ]
                ).map(({ key, label, max }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">{label}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleSettingsSave({
                            ...settings,
                            [key]: Math.max(1, (settings[key] as number) - 1),
                          })
                        }
                        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        aria-label="減らす"
                      >
                        −
                      </button>
                      <span className="w-8 text-center tabular-nums font-medium">
                        {settings[key] as number}
                      </span>
                      <button
                        onClick={() =>
                          handleSettingsSave({
                            ...settings,
                            [key]: Math.min(max, (settings[key] as number) + 1),
                          })
                        }
                        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        aria-label="増やす"
                      >
                        ＋
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">通知音</span>
                  <button
                    onClick={() =>
                      handleSettingsSave({ ...settings, soundEnabled: !settings.soundEnabled })
                    }
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.soundEnabled ? "bg-[#0ea5e9]" : "bg-muted"
                    }`}
                    role="switch"
                    aria-checked={settings.soundEnabled}
                    aria-label="通知音"
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        settings.soundEnabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">自動開始</span>
                  <button
                    onClick={() =>
                      handleSettingsSave({ ...settings, autoStart: !settings.autoStart })
                    }
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.autoStart ? "bg-[#0ea5e9]" : "bg-muted"
                    }`}
                    role="switch"
                    aria-checked={settings.autoStart}
                    aria-label="自動開始"
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        settings.autoStart ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ブラウザ通知</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestNotification}
                    disabled={settings.notificationEnabled}
                  >
                    {settings.notificationEnabled ? "許可済み" : "許可する"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
