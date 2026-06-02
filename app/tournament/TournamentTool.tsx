"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Share2, Printer, RotateCcw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { Button } from "@/components/ui/button";

// ---- 型定義 ----
interface Participant {
  id: string;
  name: string;
  isBye: boolean;
}

interface Match {
  id: string;
  round: number;
  matchIndex: number;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
}

interface Tournament {
  participants: Participant[];
  matches: Match[][];
  totalRounds: number;
  winnerId: string | null;
  createdAt: number;
}

const STORAGE_KEY = "phase1-tournament-last";

// ---- ラウンド名 ----
function getRoundName(roundIndex: number, totalRounds: number): string {
  const fromFinal = totalRounds - 1 - roundIndex;
  switch (fromFinal) {
    case 0: return "決勝";
    case 1: return "準決勝";
    case 2: return "準々決勝";
    default: return `ベスト${Math.pow(2, fromFinal + 1)}`;
  }
}

// ---- 参加者数を2のべき乗に補完 ----
function calcTotalSlots(n: number): number {
  let slots = 4;
  while (slots < n) slots *= 2;
  return slots;
}

// ---- Fisher-Yates shuffle ----
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- トーナメント初期化 ----
function buildTournament(names: string[], randomSeed: boolean): Tournament {
  const slots = calcTotalSlots(names.length);
  const totalRounds = Math.log2(slots);

  let realParticipants: Participant[] = names.map((name, i) => ({
    id: `p${i}`,
    name,
    isBye: false,
  }));
  if (randomSeed) realParticipants = shuffle(realParticipants);

  // Byeを均等に分散
  const participants: Participant[] = Array.from({ length: slots }, (_, i) => {
    if (i < realParticipants.length) return realParticipants[i];
    return { id: `bye${i}`, name: "Bye", isBye: true };
  });

  // ラウンドごとに試合を生成
  const matches: Match[][] = [];
  for (let r = 0; r < totalRounds; r++) {
    const matchCount = Math.pow(2, totalRounds - 1 - r);
    matches.push(
      Array.from({ length: matchCount }, (_, mi) => ({
        id: `r${r}-m${mi}`,
        round: r,
        matchIndex: mi,
        player1Id: r === 0 ? participants[mi * 2].id : null,
        player2Id: r === 0 ? participants[mi * 2 + 1].id : null,
        winnerId: null,
      }))
    );
  }

  // 1回戦のBye自動処理
  const initialTournament: Tournament = {
    participants,
    matches,
    totalRounds,
    winnerId: null,
    createdAt: Date.now(),
  };
  return processAllByes(initialTournament);
}

// ---- Byeを自動処理 ----
function processAllByes(tournament: Tournament): Tournament {
  let t = { ...tournament, matches: tournament.matches.map((r) => [...r]) };
  for (let r = 0; r < t.totalRounds; r++) {
    for (let mi = 0; mi < t.matches[r].length; mi++) {
      const match = t.matches[r][mi];
      if (match.winnerId) continue;
      const p1 = t.participants.find((p) => p.id === match.player1Id);
      const p2 = t.participants.find((p) => p.id === match.player2Id);
      if (p1?.isBye && p2 && !p2.isBye) {
        t = advanceWinner(t, r, mi, p2.id);
      } else if (p2?.isBye && p1 && !p1.isBye) {
        t = advanceWinner(t, r, mi, p1.id);
      } else if (p1?.isBye && p2?.isBye) {
        // 両方Bye → 仮でp1を勝者に（後で正規化）
        if (p1) t = advanceWinner(t, r, mi, p1.id);
      }
    }
  }
  return t;
}

// ---- 勝者を次ラウンドに進める ----
function advanceWinner(
  tournament: Tournament,
  round: number,
  matchIndex: number,
  winnerId: string
): Tournament {
  const matches = tournament.matches.map((r) => r.map((m) => ({ ...m })));
  matches[round][matchIndex].winnerId = winnerId;

  // 最終ラウンドなら優勝
  if (round === tournament.totalRounds - 1) {
    return { ...tournament, matches, winnerId };
  }

  // 次ラウンドの試合を更新
  const nextMatchIndex = Math.floor(matchIndex / 2);
  const isPlayer1Slot = matchIndex % 2 === 0;
  if (isPlayer1Slot) {
    matches[round + 1][nextMatchIndex].player1Id = winnerId;
  } else {
    matches[round + 1][nextMatchIndex].player2Id = winnerId;
  }

  return { ...tournament, matches };
}

// ---- 勝者選択 ----
function selectWinner(
  tournament: Tournament,
  round: number,
  matchIndex: number,
  winnerId: string
): Tournament {
  return processAllByes(advanceWinner(tournament, round, matchIndex, winnerId));
}

// ---- MatchCard コンポーネント ----
function MatchCard({
  match,
  participants,
  onSelectWinner,
  roundIndex,
  totalRounds,
}: {
  match: Match;
  participants: Participant[];
  onSelectWinner: (round: number, matchIndex: number, winnerId: string) => void;
  roundIndex: number;
  totalRounds: number;
}) {
  const p1 = participants.find((p) => p.id === match.player1Id);
  const p2 = participants.find((p) => p.id === match.player2Id);
  const isFinal = roundIndex === totalRounds - 1;

  const renderSlot = (
    player: Participant | undefined,
    isWinner: boolean,
    isLoser: boolean,
    onClick: () => void,
    label: string
  ) => {
    if (!player) {
      return (
        <div className="px-3 py-2 text-sm text-muted-foreground italic min-w-0">
          <span className="truncate block max-w-[80px]">待機中</span>
        </div>
      );
    }
    if (player.isBye) {
      return (
        <div className="px-3 py-2 text-sm text-muted-foreground italic min-w-0">
          <span className="truncate block max-w-[80px]">—（Bye）</span>
        </div>
      );
    }

    const canClick = !match.winnerId && p1 && p2 && !p1.isBye && !p2.isBye;

    return (
      <motion.button
        whileTap={canClick ? { scale: 0.97 } : {}}
        transition={{ duration: 0.1 }}
        onClick={canClick ? onClick : undefined}
        disabled={!canClick}
        aria-label={`${label}: ${player.name}`}
        className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors min-w-0 ${
          isWinner
            ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
            : isLoser
            ? "text-muted-foreground opacity-50"
            : canClick
            ? "hover:bg-muted cursor-pointer"
            : "cursor-default"
        }`}
      >
        <span className="truncate block max-w-[80px]">
          {player.name.length > 8 ? `${player.name.slice(0, 7)}…` : player.name}
        </span>
      </motion.button>
    );
  };

  return (
    <div
      className={`rounded-xl border overflow-hidden shadow-sm ${
        isFinal ? "border-[var(--accent)]/50" : "border-border"
      } bg-card`}
      style={{ minWidth: 88 }}
    >
      {renderSlot(
        p1,
        match.winnerId === match.player1Id,
        match.winnerId !== null && match.winnerId !== match.player1Id,
        () => match.player1Id && onSelectWinner(match.round, match.matchIndex, match.player1Id),
        "上"
      )}
      <div className="h-px bg-border" />
      {renderSlot(
        p2,
        match.winnerId === match.player2Id,
        match.winnerId !== null && match.winnerId !== match.player2Id,
        () => match.player2Id && onSelectWinner(match.round, match.matchIndex, match.player2Id),
        "下"
      )}
    </div>
  );
}

// ---- セットアップ画面 ----
function SetupScreen({ onStart }: { onStart: (names: string[], randomSeed: boolean) => void }) {
  const [input, setInput] = useState("");
  const [randomSeed, setRandomSeed] = useState(true);

  const names = input
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const count = names.length;
  const isPowerOf2 = count > 0 && (count & (count - 1)) === 0;
  const canStart = count >= 4 && count <= 32;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-2">
          参加者名を入力（改行区切り）
        </label>
        <textarea
          className="w-full min-h-[240px] rounded-xl border border-border bg-card p-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-muted-foreground resize-y"
          placeholder={"1\n2\n3\n4"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">
            {count}人入力
          </span>
          {count > 0 && !isPowerOf2 && count <= 32 && (
            <span className="text-xs text-amber-500">
              ⚠ 4/8/16/32人推奨。{calcTotalSlots(count)}人枠でBye処理します
            </span>
          )}
          {count > 32 && (
            <span className="text-xs text-destructive">32人以内で入力してください</span>
          )}
          {count < 4 && count > 0 && (
            <span className="text-xs text-destructive">4人以上必要です</span>
          )}
        </div>
      </div>

      {/* シード選択 */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="radio"
            className="accent-[var(--accent)]"
            checked={randomSeed}
            onChange={() => setRandomSeed(true)}
          />
          ランダム抽選
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="radio"
            className="accent-[var(--accent)]"
            checked={!randomSeed}
            onChange={() => setRandomSeed(false)}
          />
          入力順を使用
        </label>
      </div>

      <Button
        onClick={() => onStart(names, randomSeed)}
        disabled={!canStart}
        className="h-12 text-base hover:opacity-90"
        style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}
      >
        トーナメント表を作る
      </Button>
    </div>
  );
}

// ---- トーナメントビュー ----
function TournamentView({
  tournament,
  onSelectWinner,
  onReset,
  onBack,
}: {
  tournament: Tournament;
  onSelectWinner: (round: number, matchIndex: number, winnerId: string) => void;
  onReset: () => void;
  onBack: () => void;
}) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const winner = tournament.participants.find((p) => p.id === tournament.winnerId);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("URLをコピーしました");
    } catch {
      toast.error("コピーに失敗しました");
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="flex flex-col gap-4">
      {/* 優勝者表示 */}
      <AnimatePresence>
        {winner && !winner.isBye && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 12 }}
            className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/30"
          >
            <Trophy className="size-7 text-[var(--accent)] flex-shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">優勝</div>
              <div className="text-xl font-bold">{winner.name}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ブラケット */}
      <div className="overflow-x-auto tournament-bracket">
        <div
          className="flex gap-6 pb-4"
          style={{ minWidth: tournament.totalRounds * 120 }}
        >
          {tournament.matches.map((roundMatches, ri) => (
            <motion.div
              key={ri}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: ri * 0.1, duration: 0.2 }}
              className="flex flex-col"
              style={{ minWidth: 100 }}
            >
              <div className="text-xs font-medium text-muted-foreground mb-3 text-center">
                {getRoundName(ri, tournament.totalRounds)}
              </div>
              <div
                className="flex flex-col"
                style={{
                  gap: `${Math.pow(2, ri) * 8}px`,
                  paddingTop: ri > 0 ? `${(Math.pow(2, ri) - 1) * 4}px` : 0,
                }}
              >
                {roundMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    participants={tournament.participants}
                    onSelectWinner={onSelectWinner}
                    roundIndex={ri}
                    totalRounds={tournament.totalRounds}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-2 flex-wrap action-buttons">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="size-3.5" />
          設定に戻る
        </Button>
        <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5">
          <RotateCcw className="size-3.5" />
          再抽選
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
          <Share2 className="size-3.5" />
          URLシェア
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
          <Printer className="size-3.5" />
          印刷
        </Button>
      </div>

      {/* キーボードショートカット */}
      <div className="relative flex">
        {showShortcuts && (
          <div className="absolute bottom-full mb-2 w-64 rounded-lg border border-border bg-background shadow-lg p-3 z-50 text-xs text-muted-foreground text-left">
            <p className="font-semibold text-foreground mb-2">キーボードショートカット</p>
            <div className="space-y-1">
              <div className="flex justify-between"><span>Esc</span><span>リセット（設定に戻る）</span></div>
              <div className="flex justify-between"><span>P</span><span>印刷</span></div>
              <div className="flex justify-between"><span>R</span><span>再抽選</span></div>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowShortcuts(v => !v)}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-border bg-card text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
          aria-label="キーボードショートカット"
        >?</button>
      </div>
    </div>
  );
}

// ---- メインコンポーネント ----
export function TournamentTool() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [mounted, setMounted] = useState(false);
  const namesRef = useRef<string[]>([]);
  const randomSeedRef = useRef(true);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const t: Tournament = JSON.parse(saved);
        setTournament(t);
      }
    } catch {
      // ignore
    }

    // キーボードショートカット
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (e.key === "Escape") setTournament(null);
      if (e.key === "p" || e.key === "P") window.print();
      if (e.key === "r" || e.key === "R") {
        if (namesRef.current.length > 0) {
          const t = buildTournament(namesRef.current, randomSeedRef.current);
          setTournament(t);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch { /* ignore */ }
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleStart = useCallback((names: string[], randomSeed: boolean) => {
    namesRef.current = names;
    randomSeedRef.current = randomSeed;
    const t = buildTournament(names, randomSeed);
    setTournament(t);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch { /* ignore */ }
  }, []);

  const handleSelectWinner = useCallback(
    (round: number, matchIndex: number, winnerId: string) => {
      if (!tournament) return;
      const next = selectWinner(tournament, round, matchIndex, winnerId);
      setTournament(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    },
    [tournament]
  );

  const handleReset = useCallback(() => {
    if (namesRef.current.length === 0 && tournament) {
      // 参加者名を復元
      namesRef.current = tournament.participants
        .filter((p) => !p.isBye)
        .map((p) => p.name);
    }
    const t = buildTournament(namesRef.current, randomSeedRef.current);
    setTournament(t);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch { /* ignore */ }
  }, [tournament]);

  const handleBack = useCallback(() => {
    if (tournament) {
      namesRef.current = tournament.participants
        .filter((p) => !p.isBye)
        .map((p) => p.name);
    }
    setTournament(null);
  }, [tournament]);

  return (
    <ToolLayout title="トーナメント表" wide>
      <AnimatePresence mode="wait">
        {!tournament ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <SetupScreen onStart={handleStart} />
          </motion.div>
        ) : (
          <motion.div
            key="tournament"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <TournamentView
              tournament={tournament}
              onSelectWinner={handleSelectWinner}
              onReset={handleReset}
              onBack={handleBack}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </ToolLayout>
  );
}
