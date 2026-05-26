"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";

// ─── Types ───────────────────────────────────────────────────────────────────

type Hand = "rock" | "scissors" | "paper";
type Result = "win" | "lose" | "draw";
type Mode = "cpu" | "multiplayer";
type GamePhase = "setup" | "selecting" | "countdown" | "result";

interface Player {
  id: string;
  name: string;
  hand: Hand | null;
  result: Result | null;
}

interface SessionStats {
  wins: number;
  losses: number;
  draws: number;
}

interface JankenSettings {
  autoRetryOnDraw: boolean;
  countdownSpeed: "normal" | "fast";
  lastPlayers: string[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "phase1-janken-settings";

const HAND_EMOJI: Record<Hand, string> = {
  rock: "✊",
  scissors: "✌️",
  paper: "✋",
};

const HAND_LABEL: Record<Hand, string> = {
  rock: "グー",
  scissors: "チョキ",
  paper: "パー",
};

const BEATS: Record<Hand, Hand> = {
  rock: "scissors",
  scissors: "paper",
  paper: "rock",
};

const HANDS: Hand[] = ["rock", "scissors", "paper"];
const COUNTDOWN_STEPS = ["3", "2", "1", "じゃんけん！"] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function judgeResult(myHand: Hand, opponentHand: Hand): Result {
  if (myHand === opponentHand) return "draw";
  if (BEATS[myHand] === opponentHand) return "win";
  return "lose";
}

function judgeMultiplayer(players: Player[]): { winners: string[]; isDraw: boolean } {
  const hands = players.map((p) => p.hand!);
  const uniqueHands = new Set(hands);
  if (uniqueHands.size === 1 || uniqueHands.size === 3) {
    return { winners: [], isDraw: true };
  }
  const winningHand = [...uniqueHands].find((h) => uniqueHands.has(BEATS[h]))!;
  return {
    winners: players.filter((p) => p.hand === winningHand).map((p) => p.id),
    isDraw: false,
  };
}

function randomHand(): Hand {
  return HANDS[Math.floor(Math.random() * 3)];
}

// ─── Result label ─────────────────────────────────────────────────────────────

function ResultLabel({ result }: { result: Result }) {
  const labels: Record<Result, { text: string; cls: string }> = {
    win: { text: "あなたの勝ち！", cls: "text-green-500" },
    lose: { text: "あなたの負け", cls: "text-red-500" },
    draw: { text: "あいこ！", cls: "text-blue-500" },
  };
  const { text, cls } = labels[result];
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className={`text-4xl font-bold text-center ${cls}`}
    >
      {text}
    </motion.p>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function JankenTool() {
  const [mode, setMode] = useState<Mode>("cpu");
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [players, setPlayers] = useState<Player[]>([
    { id: "player", name: "あなた", hand: null, result: null },
    { id: "cpu", name: "CPU", hand: null, result: null },
  ]);
  const [countdownStep, setCountdownStep] = useState(0);
  const [stats, setStats] = useState<SessionStats>({ wins: 0, losses: 0, draws: 0 });
  const [settings, setSettings] = useState<JankenSettings>({
    autoRetryOnDraw: true,
    countdownSpeed: "normal",
    lastPlayers: [],
  });
  const [adVisible, setAdVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  // Multiplayer setup
  const [mpPlayers, setMpPlayers] = useState<string[]>(["プレイヤー1", "プレイヤー2"]);
  const [mpCurrentIdx, setMpCurrentIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const s: JankenSettings = JSON.parse(saved);
        setSettings(s);
        if (Array.isArray(s.lastPlayers) && s.lastPlayers.length >= 2) {
          setMpPlayers(s.lastPlayers);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Save settings
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch { /* ignore */ }
  }, [mounted, settings]);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // Countdown then reveal
  const startCountdown = useCallback(
    (pendingPlayers: Player[]) => {
      setAdVisible(false);
      setPhase("countdown");
      setCountdownStep(0);
      const stepMs = settings.countdownSpeed === "fast" ? 500 : 1000;

      let step = 0;
      const advance = () => {
        step++;
        if (step < COUNTDOWN_STEPS.length) {
          setCountdownStep(step);
          timerRef.current = setTimeout(advance, stepMs);
        } else {
          // Reveal
          setPhase("result");
          setPlayers(pendingPlayers);
          setAdVisible(true);

          // Stats update for CPU mode
          if (mode === "cpu") {
            const me = pendingPlayers.find((p) => p.id === "player");
            if (me?.result === "win") setStats((s) => ({ ...s, wins: s.wins + 1 }));
            else if (me?.result === "lose") setStats((s) => ({ ...s, losses: s.losses + 1 }));
            else setStats((s) => ({ ...s, draws: s.draws + 1 }));

            // Auto-retry on draw
            if (me?.result === "draw" && settings.autoRetryOnDraw) {
              timerRef.current = setTimeout(() => {
                const newCpuHand = randomHand();
                const myHand = me.hand!;
                const result = judgeResult(myHand, newCpuHand);
                const newPlayers: Player[] = [
                  { id: "player", name: "あなた", hand: myHand, result },
                  { id: "cpu", name: "CPU", hand: newCpuHand, result: judgeResult(newCpuHand, myHand) },
                ];
                startCountdown(newPlayers);
              }, 1000);
            }
          }
        }
      };

      timerRef.current = setTimeout(advance, stepMs);
    },
    [mode, settings]
  );

  // CPU mode: player picks hand
  const handleCpuPick = useCallback(
    (hand: Hand) => {
      if (phase !== "setup") return;
      const cpuHand = randomHand();
      const result = judgeResult(hand, cpuHand);
      const newPlayers: Player[] = [
        { id: "player", name: "あなた", hand, result },
        { id: "cpu", name: "CPU", hand: cpuHand, result: judgeResult(cpuHand, hand) },
      ];
      startCountdown(newPlayers);
    },
    [phase, startCountdown]
  );

  // Multiplayer: record hand for current player
  const handleMpPick = useCallback(
    (hand: Hand) => {
      if (phase !== "selecting") return;
      const currentPlayer = mpPlayers[mpCurrentIdx];
      const nextPlayers = players.map((p) =>
        p.id === currentPlayer ? { ...p, hand } : p
      );

      if (mpCurrentIdx < mpPlayers.length - 1) {
        setPlayers(nextPlayers);
        setMpCurrentIdx((i) => i + 1);
      } else {
        // All picked — judge
        const judged = nextPlayers.map((p) => ({ ...p, result: null as Result | null }));
        const { winners, isDraw } = judgeMultiplayer(judged);
        const final = judged.map((p) => ({
          ...p,
          result: isDraw ? ("draw" as Result) : winners.includes(p.id) ? ("win" as Result) : ("lose" as Result),
        }));
        startCountdown(final);
      }
    },
    [phase, players, mpPlayers, mpCurrentIdx, startCountdown]
  );

  // Start multiplayer game
  const startMpGame = () => {
    if (mpPlayers.length < 2) return;
    const ps: Player[] = mpPlayers.map((name) => ({
      id: name,
      name,
      hand: null,
      result: null,
    }));
    setPlayers(ps);
    setMpCurrentIdx(0);
    setPhase("selecting");
    setSettings((s) => ({ ...s, lastPlayers: mpPlayers }));
  };

  const reset = () => {
    clearTimer();
    setPhase("setup");
    setCountdownStep(0);
    setMpCurrentIdx(0);
    setAdVisible(true);
    if (mode === "cpu") {
      setPlayers([
        { id: "player", name: "あなた", hand: null, result: null },
        { id: "cpu", name: "CPU", hand: null, result: null },
      ]);
    }
  };

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (phase === "setup" && mode === "cpu") {
        if (e.code === "KeyG") handleCpuPick("rock");
        if (e.code === "KeyC") handleCpuPick("scissors");
        if (e.code === "KeyP") handleCpuPick("paper");
      }
      if (phase === "result" && e.code === "Enter") reset();
      if (e.code === "Escape") reset();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, mode, handleCpuPick, reset]);

  useEffect(() => () => clearTimer(), []);

  if (!mounted) return null;

  const playerMe = players.find((p) => p.id === "player");
  const playerCpu = players.find((p) => p.id === "cpu");

  return (
    <ToolLayout title="じゃんけん" adVisible={adVisible}>
      {/* Mode tabs */}
      <div className="flex rounded-lg border border-border bg-muted p-1 mb-6">
        {(["cpu", "multiplayer"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              reset();
            }}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === m ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "cpu" ? "1人対CPU" : "多人数"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Countdown ── */}
        {phase === "countdown" && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center min-h-[300px]"
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={countdownStep}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.5, 1.2, 1.0], opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-9xl font-bold text-center"
              >
                {COUNTDOWN_STEPS[countdownStep]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── CPU mode: setup / result ── */}
        {mode === "cpu" && phase !== "countdown" && (
          <motion.div
            key="cpu-game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Hands display */}
            <div className="rounded-xl border border-border bg-card shadow-sm p-6 flex items-center justify-around">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-muted-foreground">CPU</span>
                <motion.span
                  key={`cpu-${playerCpu?.hand}`}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-8xl"
                >
                  {phase === "result" && playerCpu?.hand
                    ? HAND_EMOJI[playerCpu.hand]
                    : "❓"}
                </motion.span>
              </div>

              <span className="text-2xl font-bold text-muted-foreground">VS</span>

              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-muted-foreground">あなた</span>
                <motion.span
                  key={`me-${playerMe?.hand}`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-8xl"
                >
                  {phase === "result" && playerMe?.hand
                    ? HAND_EMOJI[playerMe.hand]
                    : "❓"}
                </motion.span>
              </div>
            </div>

            {/* Result */}
            {phase === "result" && playerMe?.result && (
              <ResultLabel result={playerMe.result} />
            )}

            {/* Hand buttons */}
            {phase === "setup" && (
              <div className="grid grid-cols-3 gap-3">
                {HANDS.map((hand) => (
                  <motion.button
                    key={hand}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCpuPick(hand)}
                    className="flex flex-col items-center justify-center h-[120px] rounded-xl border border-border bg-card shadow-sm hover:bg-muted hover:border-accent/40 transition-colors"
                  >
                    <span className="text-6xl">{HAND_EMOJI[hand]}</span>
                    <span className="text-sm font-medium mt-1">{HAND_LABEL[hand]}</span>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Replay */}
            {phase === "result" && (
              <button
                onClick={reset}
                className="w-full h-12 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                もう一度 (Enter)
              </button>
            )}

            {/* Stats */}
            <p className="text-sm text-muted-foreground text-center tabular-nums">
              勝: {stats.wins} &nbsp; 負: {stats.losses} &nbsp; あいこ: {stats.draws}
            </p>

            {/* Settings */}
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>G: グー ・ C: チョキ ・ P: パー ・ Esc: リセット</p>
              <label className="flex items-center justify-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoRetryOnDraw}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, autoRetryOnDraw: e.target.checked }))
                  }
                  className="accent-[var(--accent)]"
                />
                あいこ自動再戦
              </label>
            </div>
          </motion.div>
        )}

        {/* ── Multiplayer: setup ── */}
        {mode === "multiplayer" && phase === "setup" && (
          <motion.div
            key="mp-setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            <p className="text-sm font-medium">参加者名を入力（2〜6人）</p>
            <div className="flex flex-col gap-2">
              {mpPlayers.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setMpPlayers((prev) =>
                        prev.map((n, idx) => (idx === i ? e.target.value : n))
                      )
                    }
                    className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                  <button
                    onClick={() => setMpPlayers((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-destructive text-sm transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {mpPlayers.length < 6 && (
              <button
                onClick={() => setMpPlayers((prev) => [...prev, `プレイヤー${prev.length + 1}`])}
                className="text-sm text-accent hover:underline text-left"
              >
                + 参加者を追加
              </button>
            )}

            <button
              onClick={startMpGame}
              disabled={mpPlayers.length < 2}
              className="w-full h-12 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}
            >
              じゃんけんスタート！
            </button>
          </motion.div>
        )}

        {/* ── Multiplayer: selecting ── */}
        {mode === "multiplayer" && phase === "selecting" && (
          <motion.div
            key={`mp-select-${mpCurrentIdx}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6"
          >
            <p className="text-xl font-bold text-center">
              {mpPlayers[mpCurrentIdx]} さんのターン
            </p>
            <p className="text-xs text-muted-foreground text-center">
              他の人は画面を見ないでね
            </p>
            <div className="grid grid-cols-3 gap-3">
              {HANDS.map((hand) => (
                <motion.button
                  key={hand}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMpPick(hand)}
                  className="flex flex-col items-center justify-center h-[120px] rounded-xl border border-border bg-card shadow-sm hover:bg-muted hover:border-accent/40 transition-colors"
                >
                  <span className="text-6xl">{HAND_EMOJI[hand]}</span>
                  <span className="text-sm font-medium mt-1">{HAND_LABEL[hand]}</span>
                </motion.button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {mpCurrentIdx + 1} / {mpPlayers.length} 人が選択済み
            </p>
          </motion.div>
        )}

        {/* ── Multiplayer: result ── */}
        {mode === "multiplayer" && phase === "result" && (
          <motion.div
            key="mp-result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {players[0]?.result === "draw" ? (
              <p className="text-4xl font-bold text-center text-blue-500">あいこ！</p>
            ) : (
              <p className="text-2xl font-bold text-center text-green-500">
                勝者:{" "}
                {players
                  .filter((p) => p.result === "win")
                  .map((p) => p.name)
                  .join(", ")}
              </p>
            )}

            <div className="flex flex-col gap-2">
              {players.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                    p.result === "win" ? "border-green-500 bg-green-500/10" : "border-border bg-card"
                  }`}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-2xl">{p.hand ? HAND_EMOJI[p.hand] : "❓"}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setPhase("setup");
                setMpCurrentIdx(0);
              }}
              className="w-full h-12 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              もう一度
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </ToolLayout>
  );
}
