"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";

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
  countdownSpeed: "normal" | "fast";
  lastPlayers: string[];
}

const STORAGE_KEY = "phase1-janken-settings";
const STATS_KEY   = "phase1-janken-stats";

const HAND_EMOJI: Record<Hand, string> = { rock: "✊", scissors: "✌️", paper: "✋" };
const HAND_LABEL: Record<Hand, string> = { rock: "グー", scissors: "チョキ", paper: "パー" };
const BEATS: Record<Hand, Hand> = { rock: "scissors", scissors: "paper", paper: "rock" };
const HANDS: Hand[] = ["rock", "scissors", "paper"];

const JANKEN_WORDS  = ["じゃん", "けん", "ポン！"] as const;
const JANKEN_COLORS = ["from-rose-400 to-pink-400", "from-amber-400 to-yellow-400", "from-violet-400 to-purple-400"];
const AIKO_WORDS    = ["あい", "こで", "しょ！"] as const;
const AIKO_COLORS   = ["from-sky-400 to-cyan-400", "from-violet-400 to-purple-400", "from-rose-400 to-pink-400"];

const HAND_THEME: Record<Hand, {
  bg: string; activeBg: string; border: string; grad: string; glow: string;
}> = {
  rock:     { bg: "from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20",       activeBg: "from-rose-400 to-pink-500",     border: "border-rose-200/80 dark:border-rose-700/30",     grad: "from-rose-400 to-pink-500",     glow: "shadow-rose-200 dark:shadow-rose-900/50"    },
  scissors: { bg: "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20", activeBg: "from-amber-400 to-yellow-400", border: "border-amber-200/80 dark:border-amber-700/30", grad: "from-amber-400 to-yellow-400",  glow: "shadow-amber-200 dark:shadow-amber-900/50"  },
  paper:    { bg: "from-sky-50 to-teal-50 dark:from-sky-950/30 dark:to-teal-950/20",         activeBg: "from-sky-400 to-teal-400",      border: "border-sky-200/80 dark:border-sky-700/30",       grad: "from-sky-400 to-teal-400",      glow: "shadow-sky-200 dark:shadow-sky-900/50"      },
};

const RESULT_THEME: Record<Result, { label: string; grad: string; emoji: string }> = {
  win:  { label: "あなたの勝ち！", grad: "from-emerald-400 to-green-400",  emoji: "🎉" },
  lose: { label: "あなたの負け",   grad: "from-rose-400 to-red-400",       emoji: "😢" },
  draw: { label: "あいこ！",       grad: "from-sky-400 to-violet-400",     emoji: "🤝" },
};

function judgeResult(my: Hand, opp: Hand): Result {
  if (my === opp) return "draw";
  return BEATS[my] === opp ? "win" : "lose";
}

function judgeMultiplayer(players: Player[]): { winners: string[]; isDraw: boolean } {
  const hands = players.map((p) => p.hand!);
  const unique = new Set(hands);
  if (unique.size === 1 || unique.size === 3) return { winners: [], isDraw: true };
  const winHand = [...unique].find((h) => unique.has(BEATS[h]))!;
  return { winners: players.filter((p) => p.hand === winHand).map((p) => p.id), isDraw: false };
}

function randomHand(): Hand { return HANDS[Math.floor(Math.random() * 3)]; }

// ─── ResultBanner ──────────────────────────────────────────────────────────────

function ResultBanner({ result }: { result: Result }) {
  const t = RESULT_THEME[result];
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      className={`py-4 rounded-2xl bg-gradient-to-r ${t.grad} text-white text-center shadow-lg`}
    >
      <span className="text-3xl mr-2">{t.emoji}</span>
      <span className="text-2xl font-bold">{t.label}</span>
    </motion.div>
  );
}

// ─── HandButton ────────────────────────────────────────────────────────────────

function HandButton({ hand, onClick, selected = false, disabled = false }: {
  hand: Hand; onClick: () => void; selected?: boolean; disabled?: boolean;
}) {
  const t = HAND_THEME[hand];
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center h-[120px] rounded-2xl border transition-all duration-200 disabled:cursor-not-allowed ${
        selected
          ? `bg-gradient-to-br ${t.activeBg} border-transparent text-white shadow-lg ${t.glow}`
          : `bg-gradient-to-br ${t.bg} ${t.border} hover:shadow-md hover:${t.glow}`
      }`}
    >
      <motion.span
        className="text-5xl"
        animate={selected ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {HAND_EMOJI[hand]}
      </motion.span>
      <span className={`text-sm font-bold mt-2 ${selected ? "text-white" : ""}`}>{HAND_LABEL[hand]}</span>
    </motion.button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function JankenTool() {
  const [mode, setMode] = useState<Mode>("cpu");
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [players, setPlayers] = useState<Player[]>([
    { id: "player", name: "あなた", hand: null, result: null },
    { id: "cpu",    name: "CPU",   hand: null, result: null },
  ]);
  const [countdownStep, setCountdownStep] = useState(0);
  const [stats, setStats] = useState<SessionStats>({ wins: 0, losses: 0, draws: 0 });
  const [settings, setSettings] = useState<JankenSettings>({ countdownSpeed: "normal", lastPlayers: [] });
  const [mounted, setMounted] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mpPlayers, setMpPlayers] = useState<string[]>(["プレイヤー1", "プレイヤー2"]);
  const [mpCurrentIdx, setMpCurrentIdx] = useState(0);
  // CPUモード用：選択中の手を即時表示
  const [pickedHand, setPickedHand] = useState<Hand | null>(null);
  const [pendingCpuHand, setPendingCpuHand] = useState<Hand | null>(null);
  const [isAikoRound, setIsAikoRound] = useState(false);
  const [activeWords, setActiveWords] = useState<readonly string[]>(JANKEN_WORDS);
  const [activeColors, setActiveColors] = useState<readonly string[]>(JANKEN_COLORS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const s: JankenSettings = JSON.parse(saved);
        setSettings(s);
        if (Array.isArray(s.lastPlayers) && s.lastPlayers.length >= 2) setMpPlayers(s.lastPlayers);
      }
    } catch { /* ignore */ }
    try {
      const ss = localStorage.getItem(STATS_KEY);
      if (ss) setStats(JSON.parse(ss));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch { /* ignore */ }
  }, [stats, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
  }, [mounted, settings]);

  const clearTimer = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  const startCountdown = useCallback((pendingPlayers: Player[], isAiko = false) => {
    const words  = isAiko ? AIKO_WORDS  : JANKEN_WORDS;
    const colors = isAiko ? AIKO_COLORS : JANKEN_COLORS;
    setActiveWords(words);
    setActiveColors(colors);
    setPhase("countdown");
    setCountdownStep(0);
    const stepMs = settings.countdownSpeed === "fast" ? 400 : 650;
    let step = 0;
    const advance = () => {
      step++;
      if (step < JANKEN_WORDS.length) {
        setCountdownStep(step);
        timerRef.current = setTimeout(advance, stepMs);
      } else {
        // ポン！が出揃ってから結果へ
        timerRef.current = setTimeout(() => {
          setPhase("result");
          setPlayers(pendingPlayers);
          if (mode === "cpu") {
            const me = pendingPlayers.find((p) => p.id === "player");
            if (me?.result === "win")  setStats((s) => ({ ...s, wins: s.wins + 1 }));
            else if (me?.result === "lose") setStats((s) => ({ ...s, losses: s.losses + 1 }));
            else setStats((s) => ({ ...s, draws: s.draws + 1 }));
          }
        }, 700);
      }
    };
    timerRef.current = setTimeout(advance, stepMs);
  }, [mode, settings]);

  const handleCpuPick = useCallback((hand: Hand) => {
    const meResult = players.find((p) => p.id === "player")?.result;
    if (phase !== "setup" && !(phase === "result" && meResult === "draw")) return;
    const isAiko = phase === "result" && meResult === "draw";
    const cpuHand = randomHand();
    setPickedHand(hand);
    setPendingCpuHand(cpuHand);
    const r = judgeResult(hand, cpuHand);
    startCountdown([
      { id: "player", name: "あなた", hand, result: r },
      { id: "cpu",    name: "CPU",    hand: cpuHand, result: judgeResult(cpuHand, hand) },
    ], isAiko);
  }, [phase, players, startCountdown]);

  const handleMpPick = useCallback((hand: Hand) => {
    if (phase !== "selecting") return;
    const cur = mpPlayers[mpCurrentIdx];
    const next = players.map((p) => p.id === cur ? { ...p, hand } : p);
    if (mpCurrentIdx < mpPlayers.length - 1) {
      setPlayers(next);
      setMpCurrentIdx((i) => i + 1);
    } else {
      const { winners, isDraw } = judgeMultiplayer(next);
      const final = next.map((p) => ({
        ...p,
        result: isDraw ? ("draw" as Result) : winners.includes(p.id) ? ("win" as Result) : ("lose" as Result),
      }));
      startCountdown(final, isAikoRound);
      setIsAikoRound(false);
    }
  }, [phase, players, mpPlayers, mpCurrentIdx, startCountdown, isAikoRound]);

  const startMpGame = () => {
    if (mpPlayers.length < 2) return;
    setPlayers(mpPlayers.map((name) => ({ id: name, name, hand: null, result: null })));
    setMpCurrentIdx(0);
    setPhase("selecting");
    setSettings((s) => ({ ...s, lastPlayers: mpPlayers }));
  };

  const reset = useCallback(() => {
    clearTimer();
    setPhase("setup");
    setCountdownStep(0);
    setMpCurrentIdx(0);
    setPickedHand(null);
    setPendingCpuHand(null);
    setIsAikoRound(false);
    setActiveWords(JANKEN_WORDS);
    setActiveColors(JANKEN_COLORS);
    if (mode === "cpu") {
      setPlayers([
        { id: "player", name: "あなた", hand: null, result: null },
        { id: "cpu",    name: "CPU",   hand: null, result: null },
      ]);
    }
  }, [mode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const meResult = players.find((p) => p.id === "player")?.result;
      const canPick = (phase === "setup" || (phase === "result" && meResult === "draw")) && mode === "cpu";
      if (canPick) {
        if (e.code === "KeyG") handleCpuPick("rock");
        if (e.code === "KeyC") handleCpuPick("scissors");
        if (e.code === "KeyP") handleCpuPick("paper");
      }
      if (phase === "result" && meResult !== "draw" && e.code === "Enter") reset();
      if (e.code === "Escape") reset();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, mode, players, handleCpuPick, reset]);

  useEffect(() => () => clearTimer(), []);

  if (!mounted) return null;

  const playerMe  = players.find((p) => p.id === "player");
  const playerCpu = players.find((p) => p.id === "cpu");
  const isDraw = phase === "result" && playerMe?.result === "draw";

  // CPUの手を表示するタイミング：countdownStep >= 2（ポン！）or result
  const showCpuHand = (phase === "countdown" && countdownStep >= 2) || phase === "result";

  return (
    <ToolLayout title="じゃんけん" adVisible>
      {/* モードタブ */}
      <div className="flex rounded-xl border border-border bg-muted/50 p-1 mb-6 gap-1">
        {(["cpu", "multiplayer"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); reset(); }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              mode === m
                ? "bg-gradient-to-r from-violet-400 to-purple-400 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "cpu" ? "👤 1人対CPU" : "👥 多人数"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── CPU モード ── */}
        {mode === "cpu" && (
          <motion.div
            key="cpu-game"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-5"
          >
            {/* 手表示カード */}
            <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-muted/30 shadow-sm p-6 flex items-center justify-around">
                {/* CPU */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-muted">CPU</span>
                  <motion.span
                    key={showCpuHand ? `cpu-revealed-${pendingCpuHand}` : "cpu-hidden"}
                    initial={{ y: -24, opacity: 0, scale: 0.7 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 350, damping: 18 }}
                    className="text-7xl"
                  >
                    {showCpuHand && pendingCpuHand ? HAND_EMOJI[pendingCpuHand] : "❓"}
                  </motion.span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                    VS
                  </span>
                </div>

                {/* あなた */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-muted">あなた</span>
                  <motion.span
                    key={pickedHand ?? "player-empty"}
                    initial={{ y: 24, opacity: 0, scale: 0.7 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 350, damping: 18 }}
                    className="text-7xl"
                  >
                    {pickedHand ? HAND_EMOJI[pickedHand] : "❓"}
                  </motion.span>
                </div>
              </div>
            {/* 結果バナー */}
            <AnimatePresence>
              {phase === "result" && playerMe?.result && (
                <ResultBanner result={playerMe.result} />
              )}
            </AnimatePresence>

            {/* 手選択ボタン + じゃんけん言葉オーバーレイ（同じエリア） */}
            <div className="relative min-h-[130px]">
              {/* じゃん・けん・ポン！オーバーレイ */}
              <AnimatePresence>
                {phase === "countdown" && (
                  <motion.div
                    key="janken-words"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.3 } }}
                    className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                  >
                    <div className="flex items-end justify-center gap-1 sm:gap-3 flex-wrap">
                      {activeWords.map((word, i) =>
                        countdownStep >= i ? (
                          <motion.span
                            key={i}
                            initial={{ scale: 0.3, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 420, damping: 16 }}
                            className={`text-6xl sm:text-7xl font-black bg-gradient-to-r ${activeColors[i]} bg-clip-text text-transparent drop-shadow-sm`}
                          >
                            {word}
                          </motion.span>
                        ) : null
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 手選択ボタン（setup時 OR あいこ時） */}
              {(phase === "setup" || isDraw) && (
                <motion.div
                  key={isDraw ? "redraw" : "first"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-3 gap-3"
                >
                  {isDraw && (
                    <p className="col-span-3 text-center text-sm text-muted-foreground mb-1">
                      もう一度選んでね！
                    </p>
                  )}
                  {HANDS.map((hand) => (
                    <HandButton key={hand} hand={hand} onClick={() => handleCpuPick(hand)} />
                  ))}
                </motion.div>
              )}
            </div>

            {/* もう一度ボタン（draw以外の結果） */}
            {phase === "result" && !isDraw && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.97 }}
                onClick={reset}
                className="w-full h-12 rounded-xl border border-border bg-card hover:bg-muted text-sm font-semibold transition-colors"
              >
                もう一度 (Enter)
              </motion.button>
            )}

            {/* 統計 */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {[
                { label: "勝", value: stats.wins,   color: "bg-emerald-500" },
                { label: "負", value: stats.losses, color: "bg-rose-500"    },
                { label: "△",  value: stats.draws,  color: "bg-sky-500"     },
              ].map(({ label, value, color }) => (
                <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${color}/10 border border-current/20`}>
                  <span className={`text-xs font-bold ${color.replace("bg-", "text-")}`}>{label}</span>
                  <span className="text-sm font-bold tabular-nums">{value}</span>
                </div>
              ))}
              {(stats.wins > 0 || stats.losses > 0 || stats.draws > 0) && (
                <button
                  onClick={() => setStats({ wins: 0, losses: 0, draws: 0 })}
                  className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  リセット
                </button>
              )}
            </div>

            {/* ショートカット */}
            <div className="relative flex justify-center">
              {showShortcuts && (
                <div className="absolute bottom-full mb-2 w-64 rounded-lg border border-border bg-background shadow-lg p-3 z-50 text-xs text-muted-foreground text-left">
                  <p className="font-semibold text-foreground mb-2">キーボードショートカット</p>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>G</span><span>グー</span></div>
                    <div className="flex justify-between"><span>C</span><span>チョキ</span></div>
                    <div className="flex justify-between"><span>P</span><span>パー</span></div>
                    <div className="flex justify-between"><span>Enter</span><span>もう一度（結果後）</span></div>
                    <div className="flex justify-between"><span>Esc</span><span>リセット</span></div>
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

        {/* ── 多人数: セットアップ ── */}
        {mode === "multiplayer" && phase === "setup" && (
          <motion.div key="mp-setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
            <p className="text-sm font-semibold">参加者名を入力（2〜6人）</p>
            <div className="flex flex-col gap-2">
              {mpPlayers.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setMpPlayers((prev) => prev.map((n, idx) => idx === i ? e.target.value : n))}
                    className="flex-1 h-9 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50"
                  />
                  <button
                    onClick={() => setMpPlayers((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-destructive text-sm transition-colors px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {mpPlayers.length < 6 && (
              <button onClick={() => setMpPlayers((prev) => [...prev, `プレイヤー${prev.length + 1}`])} className="text-sm text-violet-500 hover:underline text-left">
                ＋ 参加者を追加
              </button>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={startMpGame}
              disabled={mpPlayers.length < 2}
              className="w-full h-12 rounded-xl font-bold text-sm transition-all disabled:opacity-50 bg-gradient-to-r from-violet-400 to-purple-400 text-white shadow-md"
            >
              じゃんけんスタート！
            </motion.button>
          </motion.div>
        )}

        {/* ── 多人数: 選択中 ── */}
        {mode === "multiplayer" && phase === "selecting" && (
          <motion.div
            key={`mp-select-${mpCurrentIdx}`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-5"
          >
            <div className="text-center">
              <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-400 to-purple-400 text-white text-sm font-bold mb-2">
                {mpCurrentIdx + 1} / {mpPlayers.length}
              </span>
              <p className="text-xl font-bold">{mpPlayers[mpCurrentIdx]} さんのターン</p>
              <p className="text-xs text-muted-foreground mt-1">他の人は画面を見ないでね 🙈</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {HANDS.map((hand) => (
                <HandButton key={hand} hand={hand} onClick={() => handleMpPick(hand)} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── 多人数: カウントダウン ── */}
        {mode === "multiplayer" && phase === "countdown" && (
          <motion.div
            key="mp-countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center min-h-[300px]"
          >
            <div className="flex items-end justify-center gap-1 sm:gap-3 flex-wrap">
              {JANKEN_WORDS.map((word, i) =>
                countdownStep >= i ? (
                  <motion.span
                    key={i}
                    initial={{ scale: 0.3, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 16 }}
                    className={`text-6xl sm:text-7xl font-black bg-gradient-to-r ${JANKEN_COLORS[i]} bg-clip-text text-transparent`}
                  >
                    {word}
                  </motion.span>
                ) : null
              )}
            </div>
          </motion.div>
        )}

        {/* ── 多人数: 結果 ── */}
        {mode === "multiplayer" && phase === "result" && (
          <motion.div key="mp-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
            {players[0]?.result === "draw" ? (
              <div className="py-4 rounded-2xl bg-gradient-to-r from-sky-400 to-violet-400 text-white text-center shadow-lg">
                <span className="text-3xl">🤝</span>
                <span className="text-2xl font-bold ml-2">あいこ！</span>
              </div>
            ) : (
              <div className="py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-400 text-white text-center shadow-lg">
                <span className="text-2xl font-bold">
                  🎉 {players.filter((p) => p.result === "win").map((p) => p.name).join(", ")} の勝ち！
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {players.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                    p.result === "win"
                      ? "border-emerald-300 dark:border-emerald-700/50 bg-emerald-50 dark:bg-emerald-950/20"
                      : "border-border bg-card"
                  }`}
                >
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-2xl">{p.hand ? HAND_EMOJI[p.hand] : "❓"}</span>
                </motion.div>
              ))}
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setIsAikoRound(players[0]?.result === "draw");
                setPhase("setup");
                setMpCurrentIdx(0);
              }}
              className="w-full h-12 rounded-xl border border-border bg-card hover:bg-muted text-sm font-semibold transition-colors"
            >
              もう一度
            </motion.button>
          </motion.div>
        )}

      </AnimatePresence>
    </ToolLayout>
  );
}
