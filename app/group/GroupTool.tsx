"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, RotateCcw, Copy, Share2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { toast } from "sonner";
import { decodeState, generateShareUrl } from "@/lib/share";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type SplitMode = "byGroupCount" | "byMemberCount";

interface Group {
  id: string;
  name: string;
  members: string[];
}

interface GroupState {
  phase: "setup" | "result";
  members: string[];
  splitMode: SplitMode;
  groupCount: number;
  memberCount: number;
  groups: Group[];
}

interface SharePayload {
  members: string[];
  mode: SplitMode;
  value: number;
  groups: string[][];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "phase1-group-settings";

const GROUP_PALETTE = [
  { text: "text-sky-600 dark:text-sky-400",     bg: "from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/20",             border: "border-sky-200/80 dark:border-sky-700/30",       grad: "from-sky-400 to-blue-400"       },
  { text: "text-violet-600 dark:text-violet-400",bg: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20",   border: "border-violet-200/80 dark:border-violet-700/30", grad: "from-violet-400 to-purple-400"  },
  { text: "text-rose-600 dark:text-rose-400",    bg: "from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20",           border: "border-rose-200/80 dark:border-rose-700/30",     grad: "from-rose-400 to-pink-400"      },
  { text: "text-emerald-600 dark:text-emerald-400",bg: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20",  border: "border-emerald-200/80 dark:border-emerald-700/30",grad: "from-emerald-400 to-teal-400"  },
  { text: "text-orange-600 dark:text-orange-400",bg: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20",     border: "border-orange-200/80 dark:border-orange-700/30", grad: "from-orange-400 to-amber-400"   },
  { text: "text-amber-600 dark:text-amber-500",  bg: "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20",     border: "border-amber-200/80 dark:border-amber-700/30",   grad: "from-amber-400 to-yellow-400"   },
  { text: "text-fuchsia-600 dark:text-fuchsia-400",bg: "from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/30 dark:to-pink-950/20",  border: "border-fuchsia-200/80 dark:border-fuchsia-700/30",grad: "from-fuchsia-400 to-pink-400"  },
  { text: "text-teal-600 dark:text-teal-400",    bg: "from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/20",           border: "border-teal-200/80 dark:border-teal-700/30",     grad: "from-teal-400 to-cyan-400"      },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try { return crypto.randomUUID(); } catch { /* fallback */ }
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function splitIntoGroups(members: string[], numGroups: number): Group[] {
  const shuffled = shuffle(members);
  const groups: Group[] = Array.from({ length: numGroups }, (_, i) => ({
    id: genId(),
    name: `グループ ${i + 1}`,
    members: [],
  }));
  shuffled.forEach((member, i) => {
    groups[i % numGroups].members.push(member);
  });
  return groups;
}

function calcGroupCount(totalMembers: number, mode: SplitMode, value: number): number {
  if (mode === "byGroupCount") return value;
  return Math.ceil(totalMembers / value);
}

function parseMembers(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

// ─── GroupTool (main) ─────────────────────────────────────────────────────────

export function GroupTool() {
  const [memberText, setMemberText] = useState(
    "1\n2\n3\n4\n5\n6"
  );
  const [splitMode, setSplitMode] = useState<SplitMode>("byGroupCount");
  const [groupCount, setGroupCount] = useState(3);
  const [memberCount, setMemberCount] = useState(2);
  const [groups, setGroups] = useState<Group[]>([]);
  const [phase, setPhase] = useState<GroupState["phase"]>("setup");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mounted, setMounted] = useState(false);

  const members = useMemo(() => parseMembers(memberText), [memberText]);
  const computedGroupCount = calcGroupCount(members.length, splitMode, splitMode === "byGroupCount" ? groupCount : memberCount);

  // Load from URL or localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const param = new URLSearchParams(window.location.search).get("c");
    if (param) {
      const payload = decodeState<SharePayload>(param);
      if (payload) {
        setMemberText(payload.members.join("\n"));
        setSplitMode(payload.mode);
        if (payload.mode === "byGroupCount") setGroupCount(payload.value);
        else setMemberCount(payload.value);
        if (payload.groups && payload.groups.length > 0) {
          setGroups(payload.groups.map((members, i) => ({ id: genId(), name: `グループ ${i + 1}`, members })));
          setPhase("result");
        }
      }
    } else {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.lastMembers) setMemberText(saved.lastMembers.join("\n"));
          if (saved.splitMode) setSplitMode(saved.splitMode);
          if (saved.groupCount) setGroupCount(saved.groupCount);
          if (saved.memberCount) setMemberCount(saved.memberCount);
        }
      } catch { /* ignore */ }
    }
    setMounted(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        lastMembers: members,
        splitMode,
        groupCount,
        memberCount,
      }));
    } catch { /* ignore */ }
  }, [members, splitMode, groupCount, memberCount, mounted]);

  const handleSplit = useCallback(() => {
    if (members.length < 2) return;
    const numGroups = Math.min(computedGroupCount, members.length);
    const result = splitIntoGroups(members, numGroups);
    setGroups(result);
    setPhase("result");
  }, [members, computedGroupCount]);

  const handleReshuffle = useCallback(async () => {
    setIsShuffling(true);
    await new Promise((r) => setTimeout(r, 200));
    const numGroups = Math.min(computedGroupCount, members.length);
    const result = splitIntoGroups(members, numGroups);
    setGroups(result);
    setIsShuffling(false);
  }, [members, computedGroupCount]);

  const handleCopyResult = useCallback(() => {
    const lines = [
      "グループ分けの結果",
      "──────────────────",
      ...groups.flatMap((g) => [`${g.name}`, `  ${g.members.join("、")}`, ""]),
      "──────────────────",
      "タダtools で作成",
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(
      () => toast("結果をコピーしました"),
      () => toast("コピーに失敗しました")
    );
  }, [groups]);

  const handleShare = useCallback(() => {
    const payload: SharePayload = {
      members,
      mode: splitMode,
      value: splitMode === "byGroupCount" ? groupCount : memberCount,
      groups: groups.map((g) => g.members),
    };
    const url = generateShareUrl(payload);
    navigator.clipboard.writeText(url).then(
      () => toast("共有URLをコピーしました"),
      () => toast("URLのコピーに失敗しました")
    );
  }, [members, splitMode, groupCount, memberCount, groups]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (phase === "result") {
        if (e.key === "r" || e.key === "R") handleReshuffle();
        if (e.key === "Escape" || e.key === "Backspace") setPhase("setup");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, handleReshuffle]);

  return (
    <ToolLayout title="グループ分け" adVisible>
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {phase === "setup" ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* ヘッダービジュアル */}
              <div className="relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/20 border border-violet-200/60 dark:border-violet-700/30">
                <img src="/uploads/kawaii-blob-lavender.svg" alt="" aria-hidden="true" className="absolute -right-6 -bottom-6 w-28 h-28 opacity-20 pointer-events-none select-none" />
                <div className="w-16 h-16 flex-shrink-0 relative z-10 bg-white/50 rounded-xl p-1">
                  <img src="/assets/icon-group.png" alt="" aria-hidden="true" className="w-full h-full object-contain" />
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-bold text-violet-700 dark:text-violet-300">グループ分け</p>
                  <p className="text-xs text-violet-600/70 dark:text-violet-400/70 mt-0.5">メンバーを入力して、公平にランダムでチーム分け！</p>
                </div>
              </div>

              {/* Member input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">メンバーを入力</label>
                  <span className="text-xs text-muted-foreground">{members.length}人</span>
                </div>
                <textarea
                  value={memberText}
                  onChange={(e) => setMemberText(e.target.value)}
                  placeholder="1&#10;2&#10;3&#10;（1行に1人）"
                  className="w-full h-40 rounded-xl border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    disabled={memberText === ""}
                  >
                    クリア
                  </button>
                </div>
              </div>

              {/* Split mode */}
              <div className="space-y-3">
                <p className="text-sm font-bold">🔀 分け方を選択</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSplitMode("byGroupCount")}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      splitMode === "byGroupCount"
                        ? "border-violet-400 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    <span className="text-xl">🏢</span>
                    <p className="text-xs font-bold mt-1">グループ数で分ける</p>
                    <p className="text-xs text-muted-foreground">○グループに振り分け</p>
                  </button>
                  <button
                    onClick={() => setSplitMode("byMemberCount")}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      splitMode === "byMemberCount"
                        ? "border-violet-400 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    <span className="text-xl">👥</span>
                    <p className="text-xs font-bold mt-1">人数で分ける</p>
                    <p className="text-xs text-muted-foreground">1グループ○人ずつ</p>
                  </button>
                </div>
                <div className="space-y-2">
                  {splitMode === "byGroupCount" && (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2">
                      <input
                        type="number"
                        min={2}
                        max={Math.max(2, members.length)}
                        value={groupCount}
                        onChange={(e) => setGroupCount(Math.max(2, Math.min(members.length || 2, parseInt(e.target.value) || 2)))}
                        className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <span className="text-sm text-muted-foreground">グループに分ける</span>
                    </div>
                  )}
                  {splitMode === "byMemberCount" && (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2">
                      <span className="text-sm text-muted-foreground">1グループ</span>
                      <input
                        type="number"
                        min={1}
                        max={Math.max(1, members.length - 1)}
                        value={memberCount}
                        onChange={(e) => setMemberCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <span className="text-sm text-muted-foreground">人</span>
                    </div>
                  )}
                </div>

                {members.length >= 2 && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
                    → グループ数: {Math.min(computedGroupCount, members.length)}
                    {splitMode === "byMemberCount" && members.length % memberCount !== 0 &&
                      "（端数は最終グループへ）"}
                  </p>
                )}
              </div>

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={members.length < 2}
                onClick={handleSplit}
                className="w-full h-12 rounded-2xl text-sm font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 text-white shadow-md disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Shuffle className="size-4" />
                グループを分ける
              </motion.button>

              {members.length < 2 && (
                <p className="text-xs text-center text-muted-foreground">2人以上入力してください</p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div>
                <h2 className="text-base font-bold">グループ分けの結果</h2>
                <p className="text-sm text-muted-foreground">{members.length}人 → {groups.length}グループ</p>
              </div>

              {/* Group cards */}
              <AnimatePresence mode="wait">
                {!isShuffling && (
                  <motion.div
                    key="cards"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                  >
                    {groups.map((group, i) => {
                      const c = GROUP_PALETTE[i % GROUP_PALETTE.length];
                      return (
                        <motion.div
                          key={group.id}
                          initial={{ opacity: 0, y: 12, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 22, delay: i * 0.07 }}
                          className={`rounded-2xl shadow-sm border ${c.border} bg-gradient-to-br ${c.bg} overflow-hidden`}
                        >
                          <div className={`px-4 py-2.5 bg-gradient-to-r ${c.grad}`}>
                            <p className="text-sm font-bold text-white">{group.name}</p>
                            <p className="text-xs text-white/70">{group.members.length}人</p>
                          </div>
                          <div className="px-4 py-3 space-y-1">
                            {group.members.map((member, j) => (
                              <p key={j} className="text-sm py-0.5">{member}</p>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleReshuffle}
                  disabled={isShuffling}
                  className="h-10 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 text-white shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Shuffle className="size-4" />
                  もう一度シャッフル
                </motion.button>
                <Button variant="outline" onClick={() => setPhase("setup")} className="gap-2">
                  <ChevronLeft className="size-4" />
                  設定に戻る
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyResult} className="gap-2">
                  <Copy className="size-3.5" />
                  結果をコピー
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                  <Share2 className="size-3.5" />
                  URLシェア
                </Button>
              </div>

              {/* Keyboard hints */}
              <div className="relative flex">
                {showShortcuts && (
                  <div className="absolute bottom-full mb-2 w-64 rounded-lg border border-border bg-background shadow-lg p-3 z-50 text-xs text-muted-foreground text-left">
                    <p className="font-semibold text-foreground mb-2">キーボードショートカット</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span>R</span><span>再シャッフル（結果画面）</span></div>
                      <div className="flex justify-between"><span>Esc</span><span>設定に戻る</span></div>
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
        </AnimatePresence>
      </div>

      {/* Clear confirm */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>クリア</DialogTitle>
            <DialogDescription>メンバー一覧をすべて削除します。</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false}>
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>キャンセル</Button>
            <Button variant="destructive" onClick={() => { setMemberText(""); setShowClearConfirm(false); }}>クリア</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ToolLayout>
  );
}
