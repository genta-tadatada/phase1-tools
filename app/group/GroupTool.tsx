"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, RotateCcw, Copy, Share2, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { toast } from "sonner";
import { encodeState, decodeState, generateShareUrl } from "@/lib/share";
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

const GROUP_COLORS = [
  "text-sky-500",
  "text-violet-500",
  "text-rose-500",
  "text-emerald-500",
  "text-orange-500",
  "text-yellow-600",
  "text-fuchsia-500",
  "text-teal-500",
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
  const [mounted, setMounted] = useState(false);

  const members = parseMembers(memberText);
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
    <ToolLayout title="グループ分け">
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
                <p className="text-sm font-medium">分け方を選択</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={splitMode === "byGroupCount"}
                      onChange={() => setSplitMode("byGroupCount")}
                      className="accent-sky-500"
                    />
                    <span className="text-sm">グループ数で分ける</span>
                  </label>
                  {splitMode === "byGroupCount" && (
                    <div className="ml-6 flex items-center gap-2">
                      <input
                        type="number"
                        min={2}
                        max={Math.max(2, members.length)}
                        value={groupCount}
                        onChange={(e) => setGroupCount(Math.max(2, Math.min(members.length || 2, parseInt(e.target.value) || 2)))}
                        className="w-16 rounded-lg border border-border bg-card px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <span className="text-sm text-muted-foreground">グループに分ける</span>
                    </div>
                  )}

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={splitMode === "byMemberCount"}
                      onChange={() => setSplitMode("byMemberCount")}
                      className="accent-sky-500"
                    />
                    <span className="text-sm">人数で分ける</span>
                  </label>
                  {splitMode === "byMemberCount" && (
                    <div className="ml-6 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">1グループ</span>
                      <input
                        type="number"
                        min={1}
                        max={Math.max(1, members.length - 1)}
                        value={memberCount}
                        onChange={(e) => setMemberCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 rounded-lg border border-border bg-card px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
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
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className="w-full gap-2 bg-sky-500 hover:bg-sky-600 text-white"
                  disabled={members.length < 2}
                  onClick={handleSplit}
                >
                  <Shuffle className="size-4" />
                  グループを分ける
                </Button>
              </motion.div>

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
                    {groups.map((group, i) => (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.08 }}
                        className="rounded-xl shadow-sm border border-border bg-card p-4"
                      >
                        <p className={`text-base font-bold mb-2 ${GROUP_COLORS[i % GROUP_COLORS.length]}`}>
                          {group.name}
                        </p>
                        <div className="h-px bg-border/60 mb-2" />
                        {group.members.map((member, j) => (
                          <p key={j} className="text-sm py-0.5">{member}</p>
                        ))}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleReshuffle} disabled={isShuffling} className="gap-2 bg-sky-500 hover:bg-sky-600 text-white">
                  <Shuffle className="size-4" />
                  もう一度シャッフル
                </Button>
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
              <p className="text-xs text-muted-foreground/50">R: 再シャッフル　Esc: 設定に戻る</p>
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
