"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Share2, Printer, RotateCcw, ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import { Button } from "@/components/ui/button";

// ---- 型定義 ----
interface Participant {
  id: string;
  name: string;
  isBye: boolean;
  seedNumber?: number; // シード対戦モードのみ
}

interface Match {
  id: string;
  round: number;
  matchIndex: number;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
}

interface ThirdPlaceMatch {
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
  seededMode: boolean;
  name: string;
  twoSided: boolean;
  has3rdPlace: boolean;
  thirdPlaceMatch: ThirdPlaceMatch | null;
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

// ---- シードブラケット配置 ----
// result[スロット番号] = シード番号(0始まり)
// 1位と2位は決勝まで当たらない、3/4位は準決勝まで当たらない
function seededBracketOrder(slots: number): number[] {
  if (slots === 1) return [0];
  const half = seededBracketOrder(slots / 2);
  const result: number[] = new Array(slots);
  for (let i = 0; i < half.length; i++) {
    result[i * 2]     = half[i];
    result[i * 2 + 1] = slots - 1 - half[i];
  }
  return result;
}

// ---- トーナメント初期化 ----
function buildTournament(names: string[], mode: "seeded" | "random", tournamentName = "", has3rdPlace = false): Tournament {
  const slots = calcTotalSlots(names.length);
  const totalRounds = Math.log2(slots);

  const realParticipants: Participant[] = names.map((name, i) => ({
    id: `p${i}`,
    name,
    isBye: false,
    seedNumber: mode === "seeded" ? i + 1 : undefined,
  }));

  // スロット配置
  // どちらのモードでも seededBracketOrder で Bye 配置位置を決定する。
  // これにより Bye がシード順と同じ非隣接位置に分散し、Bye vs Bye が発生しない。
  const order = seededBracketOrder(slots);

  let participants: Participant[];
  if (mode === "random") {
    // 実プレイヤーをシャッフルし、Byeでない（seedIdx < 実人数）スロットへ順に詰める
    const shuffledPlayers = shuffle(realParticipants);
    let playerIdx = 0;
    participants = order.map((seedIdx, slotIdx) => {
      if (seedIdx >= realParticipants.length) {
        return { id: `bye${slotIdx}`, name: "Bye", isBye: true };
      }
      return shuffledPlayers[playerIdx++];
    });
  } else {
    // シード対戦：入力順がシード順
    participants = order.map((seedIdx, slotIdx) => {
      if (seedIdx < realParticipants.length) return realParticipants[seedIdx];
      return { id: `bye${slotIdx}`, name: "Bye", isBye: true };
    });
  }

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

  const initialTournament: Tournament = {
    participants, matches, totalRounds, winnerId: null,
    createdAt: Date.now(), seededMode: mode === "seeded",
    name: tournamentName,
    twoSided: names.length > 32,
    has3rdPlace,
    thirdPlaceMatch: has3rdPlace ? { player1Id: null, player2Id: null, winnerId: null } : null,
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

  if (round === tournament.totalRounds - 1) {
    return { ...tournament, matches, winnerId };
  }

  const nextMatchIndex = Math.floor(matchIndex / 2);
  const isPlayer1Slot = matchIndex % 2 === 0;
  if (isPlayer1Slot) {
    matches[round + 1][nextMatchIndex].player1Id = winnerId;
  } else {
    matches[round + 1][nextMatchIndex].player2Id = winnerId;
  }

  // 準決勝（finalの1つ前）完了時に3位決定戦プレイヤーをセット
  let thirdPlaceMatch = tournament.thirdPlaceMatch
    ? { ...tournament.thirdPlaceMatch }
    : null;
  const semiFinalRound = tournament.totalRounds - 2;
  if (tournament.has3rdPlace && thirdPlaceMatch && round === semiFinalRound) {
    const updatedMatch = matches[round][matchIndex];
    const loser = updatedMatch.player1Id === winnerId
      ? updatedMatch.player2Id
      : updatedMatch.player1Id;
    if (matchIndex % 2 === 0) {
      thirdPlaceMatch = { ...thirdPlaceMatch, player1Id: loser };
    } else {
      thirdPlaceMatch = { ...thirdPlaceMatch, player2Id: loser };
    }
  }

  return { ...tournament, matches, thirdPlaceMatch };
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

// ---- SVGスタイル定義 ----
type SvgStyleKey = "official" | "colorful" | "kawaii";

interface SvgStyleDef {
  bg: string;
  border: string;
  text: string;
  muted: string;
  line: string;
  accent: string;
  winBg: string;
  fontFamily: string;
  title: string;
  rx: number;
  roundColors?: string[];
  decorations?: string[];
  gradient?: boolean;
}

const SVG_STYLES: Record<SvgStyleKey, SvgStyleDef> = {
  official: {
    bg: "white",
    border: "#e2e8f0",
    text: "#1e293b",
    muted: "#94a3b8",
    line: "#cbd5e1",
    accent: "#1e293b",
    winBg: "#1e293b",
    fontFamily: "Georgia,serif",
    title: "TOURNAMENT BRACKET",
    rx: 6,
  },
  colorful: {
    bg: "#fafafa",
    border: "#e2e8f0",
    text: "#1e293b",
    muted: "#94a3b8",
    line: "#cbd5e1",
    accent: "#7c3aed",
    winBg: "#7c3aed",
    fontFamily: "system-ui,sans-serif",
    title: "🏆 TOURNAMENT",
    rx: 8,
    roundColors: ["#f43f5e", "#f97316", "#eab308", "#22c55e", "#0ea5e9", "#8b5cf6"],
    gradient: true,
  },
  kawaii: {
    bg: "#fdf2f8",
    border: "#f9a8d4",
    text: "#831843",
    muted: "#be185d",
    line: "#fbcfe8",
    accent: "#ec4899",
    winBg: "#ec4899",
    fontFamily: "system-ui,sans-serif",
    title: "✨ とーなめんと ✨",
    rx: 12,
    decorations: ["🌸", "⭐", "💖", "🌟", "🎀"],
  },
};

// ---- SVGブラケット生成（画像ダウンロード用） ----
function generateSVGBracket(tournament: Tournament, style: SvgStyleKey = "official"): string {
  const { participants, matches, totalRounds, winnerId } = tournament;
  const st = SVG_STYLES[style];

  const MATCH_W = 170, SLOT_H = 32, MATCH_H = SLOT_H * 2 + 1;
  const MATCH_GAP = 12, ROUND_GAP = 56, PAD = 28, LABEL_H = 30, TITLE_H = 34;
  const unitH = MATCH_H + MATCH_GAP;
  const firstCount = matches[0].length;

  const svgW = PAD * 2 + totalRounds * MATCH_W + (totalRounds - 1) * ROUND_GAP;
  const svgH = PAD * 2 + TITLE_H + LABEL_H + firstCount * unitH - MATCH_GAP + 8;

  const matchX = (r: number) => PAD + r * (MATCH_W + ROUND_GAP);
  const matchY = (r: number, mi: number): number => {
    if (r === 0) return PAD + TITLE_H + LABEL_H + mi * unitH;
    const gs = Math.pow(2, r);
    const fy = matchY(0, mi * gs) + MATCH_H / 2;
    const ly = matchY(0, (mi + 1) * gs - 1) + MATCH_H / 2;
    return (fy + ly) / 2 - MATCH_H / 2;
  };

  const getP = (id: string | null) => id ? participants.find(p => p.id === id) : undefined;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // ラウンドごとの色（colorful/kawaiiは末尾＝決勝が濃い色になるよう逆引き）
  const roundColor = (r: number): string => {
    if (style === "colorful" && st.roundColors) {
      return st.roundColors[r % st.roundColors.length];
    }
    if (style === "kawaii") return st.accent;
    return st.accent;
  };

  let defs = "";
  if (style === "kawaii") {
    defs += `<linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fdf2f8"/><stop offset="100%" stop-color="#f0fdf4"/></linearGradient>`;
  }
  if (style === "colorful" && st.roundColors) {
    st.roundColors.forEach((c, i) => {
      defs += `<linearGradient id="winGrad${i}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${c}" stop-opacity="0.22"/><stop offset="100%" stop-color="${c}" stop-opacity="0.08"/></linearGradient>`;
    });
  }

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">`;
  if (defs) s += `<defs>${defs}</defs>`;
  s += `<rect width="${svgW}" height="${svgH}" fill="${style === "kawaii" ? "url(#bgGrad)" : st.bg}"/>`;

  // タイトル
  const titleText = tournament.name ? tournament.name : st.title;
  s += `<text x="${svgW / 2}" y="${PAD + 18}" text-anchor="middle" font-size="18" font-family="${st.fontFamily}" fill="${st.accent}" font-weight="700" letter-spacing="${style === "official" ? 2 : 0}">${esc(titleText)}</text>`;

  // kawaii装飾（角に絵文字）
  if (style === "kawaii" && st.decorations) {
    s += `<text x="${PAD}" y="${PAD + 18}" font-size="16">${st.decorations[0]}</text>`;
    s += `<text x="${svgW - PAD - 14}" y="${PAD + 18}" font-size="16">${st.decorations[2]}</text>`;
  }

  // コネクター線: 2段構造 + 優勝者パスのみ赤ハイライト
  //   Level-1: 各スロット1本 → x1でbracket arm
  //   Level-2: 試合中心 → midXで合流 → 入口
  const S1_OFF = SLOT_H / 2;
  const S2_OFF = SLOT_H + 1 + S1_OFF;
  const TRAIL_COLOR = style === "official" ? "#ef4444" : style === "kawaii" ? st.accent : "#7c3aed";

  // 優勝者が各ラウンドでどの試合・スロットにいるかを追跡
  const champSlot: Array<{ mi: number; isP2: boolean } | null> = Array.from(
    { length: totalRounds }, (_, r) => {
      if (!winnerId) return null;
      const mi = matches[r].findIndex(
        m => m.player1Id === winnerId || m.player2Id === winnerId
      );
      if (mi < 0) return null;
      return { mi, isP2: matches[r][mi].player2Id === winnerId };
    }
  );

  for (let r = 0; r < totalRounds - 1; r++) {
    const exitX  = matchX(r) + MATCH_W;
    const x1     = exitX + 5;
    const midX   = exitX + ROUND_GAP / 2;
    const nextX  = matchX(r + 1);
    const baseLc = style === "colorful" ? roundColor(r) : st.line;

    for (let mi = 0; mi < matches[r].length; mi += 2) {
      const mi1     = mi + 1;
      const hasPair = mi1 < matches[r].length;

      const mTop0  = matchY(r, mi);
      const s1y0   = mTop0 + S1_OFF;
      const s2y0   = mTop0 + S2_OFF;
      const mc0    = mTop0 + MATCH_H / 2;
      const nextMc = matchY(r + 1, Math.floor(mi / 2)) + MATCH_H / 2;

      if (!hasPair) {
        // グレー下地
        s += `<line x1="${exitX}" y1="${s1y0}" x2="${x1}" y2="${s1y0}" stroke="${baseLc}" stroke-width="1.5" stroke-linecap="round"/>`;
        s += `<line x1="${exitX}" y1="${s2y0}" x2="${x1}" y2="${s2y0}" stroke="${baseLc}" stroke-width="1.5" stroke-linecap="round"/>`;
        s += `<line x1="${x1}" y1="${s1y0}" x2="${x1}" y2="${s2y0}" stroke="${baseLc}" stroke-width="1.5" stroke-linecap="round"/>`;
        s += `<line x1="${x1}" y1="${mc0}" x2="${nextX}" y2="${nextMc}" stroke="${baseLc}" stroke-width="1.5" stroke-linecap="round"/>`;
        // 優勝者パス赤
        const cs = champSlot[r];
        if (cs && cs.mi === mi) {
          const sy = cs.isP2 ? s2y0 : s1y0;
          s += `<line x1="${exitX}" y1="${sy}" x2="${x1}" y2="${sy}" stroke="${TRAIL_COLOR}" stroke-width="2.4" stroke-linecap="round"/>`;
          s += `<line x1="${x1}" y1="${sy}" x2="${x1}" y2="${mc0}" stroke="${TRAIL_COLOR}" stroke-width="2.4" stroke-linecap="round"/>`;
          s += `<line x1="${x1}" y1="${mc0}" x2="${nextX}" y2="${nextMc}" stroke="${TRAIL_COLOR}" stroke-width="2.4" stroke-linecap="round"/>`;
        }
        continue;
      }

      const mTop1 = matchY(r, mi1);
      const s1y1  = mTop1 + S1_OFF;
      const s2y1  = mTop1 + S2_OFF;
      const mc1   = mTop1 + MATCH_H / 2;

      // ── グレー下地 ──
      s += `<line x1="${exitX}" y1="${s1y0}" x2="${x1}" y2="${s1y0}" stroke="${baseLc}" stroke-width="1.5" stroke-linecap="round"/>`;
      s += `<line x1="${exitX}" y1="${s2y0}" x2="${x1}" y2="${s2y0}" stroke="${baseLc}" stroke-width="1.5" stroke-linecap="round"/>`;
      s += `<line x1="${x1}" y1="${s1y0}" x2="${x1}" y2="${s2y0}" stroke="${baseLc}" stroke-width="1.5" stroke-linecap="round"/>`;
      s += `<line x1="${exitX}" y1="${s1y1}" x2="${x1}" y2="${s1y1}" stroke="${baseLc}" stroke-width="1.5" stroke-linecap="round"/>`;
      s += `<line x1="${exitX}" y1="${s2y1}" x2="${x1}" y2="${s2y1}" stroke="${baseLc}" stroke-width="1.5" stroke-linecap="round"/>`;
      s += `<line x1="${x1}" y1="${s1y1}" x2="${x1}" y2="${s2y1}" stroke="${baseLc}" stroke-width="1.5" stroke-linecap="round"/>`;
      s += `<line x1="${x1}" y1="${mc0}" x2="${midX}" y2="${mc0}" stroke="${baseLc}" stroke-width="1.5" stroke-linecap="round"/>`;
      s += `<line x1="${x1}" y1="${mc1}" x2="${midX}" y2="${mc1}" stroke="${baseLc}" stroke-width="1.5" stroke-linecap="round"/>`;
      s += `<line x1="${midX}" y1="${mc0}" x2="${midX}" y2="${mc1}" stroke="${baseLc}" stroke-width="1.5" stroke-linecap="round"/>`;
      s += `<line x1="${midX}" y1="${nextMc}" x2="${nextX}" y2="${nextMc}" stroke="${baseLc}" stroke-width="1.5" stroke-linecap="round"/>`;

      // ── 優勝者パスのみ赤 ──
      // 各ラウンドで優勝者がいた試合を特定し、そのスロット出口→試合中心→nextMcまで赤
      const cs = champSlot[r];
      if (cs && (cs.mi === mi || cs.mi === mi1)) {
        const mTopC = cs.mi === mi ? mTop0 : mTop1;
        const sy    = cs.isP2 ? mTopC + S2_OFF : mTopC + S1_OFF;
        const mcC   = mTopC + MATCH_H / 2;
        s += `<line x1="${exitX}" y1="${sy}" x2="${x1}" y2="${sy}" stroke="${TRAIL_COLOR}" stroke-width="2.4" stroke-linecap="round"/>`;
        s += `<line x1="${x1}" y1="${sy}" x2="${x1}" y2="${mcC}" stroke="${TRAIL_COLOR}" stroke-width="2.4" stroke-linecap="round"/>`;
        s += `<line x1="${x1}" y1="${mcC}" x2="${midX}" y2="${mcC}" stroke="${TRAIL_COLOR}" stroke-width="2.4" stroke-linecap="round"/>`;
        s += `<line x1="${midX}" y1="${mcC}" x2="${midX}" y2="${nextMc}" stroke="${TRAIL_COLOR}" stroke-width="2.4" stroke-linecap="round"/>`;
        s += `<line x1="${midX}" y1="${nextMc}" x2="${nextX}" y2="${nextMc}" stroke="${TRAIL_COLOR}" stroke-width="2.4" stroke-linecap="round"/>`;
      }
    }
  }

  // 試合カード
  for (let r = 0; r < totalRounds; r++) {
    const x = matchX(r);
    const rc = roundColor(r);
    const labelDeco = style === "kawaii" && st.decorations ? `${st.decorations[(r + 1) % st.decorations.length]} ` : "";
    const labelColor = style === "colorful" ? rc : st.muted;
    s += `<text x="${x + MATCH_W / 2}" y="${PAD + TITLE_H + LABEL_H - 8}" text-anchor="middle" font-size="11" font-family="${st.fontFamily}" fill="${labelColor}" font-weight="600">${labelDeco}${esc(getRoundName(r, totalRounds))}</text>`;

    for (let mi = 0; mi < matches[r].length; mi++) {
      const match = matches[r][mi];
      const y = matchY(r, mi);
      const p1 = getP(match.player1Id);
      const p2 = getP(match.player2Id);
      const isFinal = r === totalRounds - 1;
      const cardStroke = isFinal ? st.accent : (style === "colorful" ? rc : st.border);

      s += `<rect x="${x}" y="${y}" width="${MATCH_W}" height="${MATCH_H}" rx="${st.rx}" fill="${style === "kawaii" ? "#ffffff" : "white"}" stroke="${cardStroke}" stroke-width="${isFinal ? 2 : 1.2}"/>`;
      s += `<line x1="${x}" y1="${y + SLOT_H}" x2="${x + MATCH_W}" y2="${y + SLOT_H}" stroke="${st.border}" stroke-width="0.5"/>`;

      const renderSlot = (p: Participant | undefined, slotY: number, isWin: boolean, isLose: boolean) => {
        const name = p ? (p.isBye ? "— Bye" : p.name.slice(0, 16)) : "?";
        const color = isWin ? (style === "official" ? st.accent : rc) : (isLose ? st.muted : st.text);
        const fw = isWin ? "700" : "400";
        if (isWin) {
          const winFill = style === "colorful" && st.roundColors
            ? `url(#winGrad${r % st.roundColors.length})`
            : `${style === "kawaii" ? st.accent : st.winBg}1f`;
          s += `<rect x="${x}" y="${slotY}" width="${MATCH_W}" height="${SLOT_H}" fill="${winFill}"/>`;
        }
        s += `<text x="${x + 8}" y="${slotY + SLOT_H / 2 + 4}" font-size="12" font-family="${st.fontFamily}" fill="${color}" font-weight="${fw}">${esc(name)}</text>`;
        if (p?.seedNumber) {
          s += `<text x="${x + MATCH_W - 6}" y="${slotY + SLOT_H / 2 + 4}" font-size="9" font-family="${st.fontFamily}" fill="${st.muted}" text-anchor="end">#${p.seedNumber}</text>`;
        }
      };

      renderSlot(p1, y, match.winnerId === match.player1Id, match.winnerId !== null && match.winnerId !== match.player1Id);
      renderSlot(p2, y + SLOT_H + 1, match.winnerId === match.player2Id, match.winnerId !== null && match.winnerId !== match.player2Id);
    }
  }

  // 優勝バナー
  const champion = participants.find(p => p.id === winnerId && !p.isBye);
  if (champion) {
    const by = svgH - 34;
    const deco = style === "kawaii" && st.decorations ? `${st.decorations[1]} ` : "";
    s += `<rect x="${PAD}" y="${by}" width="${svgW - PAD * 2}" height="28" rx="${st.rx}" fill="${st.winBg}14" stroke="${st.winBg}40" stroke-width="1.2"/>`;
    s += `<text x="${svgW / 2}" y="${by + 18}" text-anchor="middle" font-size="13" font-family="${st.fontFamily}" fill="${st.winBg}" font-weight="700">🏆 ${deco}${esc(champion.name)}${deco ? ` ${st.decorations![1]}` : ""}</text>`;
  }

  s += "</svg>";
  return s;
}

// ---- HTMLブラケット用コネクター線 ----
const MATCH_H_C      = 65;
const COL_W_C        = 112;
const COL_GAP_C      = 32;  // 20→32に拡大でコネクター線が見やすく
const UNIT_H_C       = MATCH_H_C + 13; // 78: カード高 + 隣接gap
const LABEL_OFFSET_C = 32;

const WIN_LINE_COLOR = "#ef4444";
const DEF_LINE_COLOR = "#cbd5e1";
const SLOT_HALF = Math.floor((MATCH_H_C - 1) / 4); // 16px — SVG保存の計算用

function BracketConnectors({ totalRounds, matchesPerRound }: {
  totalRounds: number;
  matchesPerRound: number[];
}) {
  const topPad  = (r: number) => r > 0 ? (Math.pow(2, r) - 1) * UNIT_H_C / 2 : 0;
  const matchCY = (r: number, mi: number) => topPad(r) + mi * Math.pow(2, r) * UNIT_H_C + MATCH_H_C / 2;
  const svgH = matchesPerRound[0] * UNIT_H_C + MATCH_H_C;
  const midX = COL_GAP_C / 2;

  return (
    <>
      {Array.from({ length: totalRounds - 1 }, (_, ri) => {
        const matchCount = matchesPerRound[ri];
        const leftX = (COL_W_C + COL_GAP_C) * ri + COL_W_C;
        return (
          <svg key={ri} className="absolute pointer-events-none" style={{ left: leftX, top: LABEL_OFFSET_C, width: COL_GAP_C, height: svgH }}>
            {Array.from({ length: matchCount }, (_, mi) => {
              const cy     = matchCY(ri, mi);
              const nextCy = matchCY(ri + 1, Math.floor(mi / 2));
              return (
                <g key={mi}>
                  {/* 出口: 試合右端 → midX */}
                  <line x1={0} y1={cy} x2={midX} y2={cy} stroke={DEF_LINE_COLOR} strokeWidth={1.5} strokeLinecap="round" />
                  {mi % 2 === 0 && mi + 1 < matchCount && (
                    <>
                      {/* 縦バー: 2試合を繋ぐ */}
                      <line x1={midX} y1={cy} x2={midX} y2={matchCY(ri, mi + 1)} stroke={DEF_LINE_COLOR} strokeWidth={1.5} strokeLinecap="round" />
                      {/* 入口: midX → 次ラウンド試合 */}
                      <line x1={midX} y1={nextCy} x2={COL_GAP_C} y2={nextCy} stroke={DEF_LINE_COLOR} strokeWidth={1.5} strokeLinecap="round" />
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        );
      })}
    </>
  );
}

// ---- 双方向ブラケット（33人以上）用コンポーネント ----
function TwoSidedBracket({
  tournament,
  onSelectWinner,
}: {
  tournament: Tournament;
  onSelectWinner: (round: number, matchIndex: number, winnerId: string) => void;
}) {
  const { matches, totalRounds, participants } = tournament;
  const halfRounds = totalRounds - 1; // 決勝前のラウンド数

  // 各ラウンドを左半分・右半分に分割（matches[r] の前半が左、後半が右）
  const leftMatchesByRound  = matches.slice(0, halfRounds).map((r) => r.slice(0, r.length / 2));
  const rightMatchesByRound = matches.slice(0, halfRounds).map((r) => r.slice(r.length / 2));
  const finalMatch = matches[totalRounds - 1][0];

  // 右側の表示列は「内側（決勝隣）→外側」の順（インデックス逆）
  // rightColumns[0] = halfRounds-1 ラウンド（試合数最少）
  // rightColumns[halfRounds-1] = ラウンド0（試合数最多）
  const rightColumns = [...rightMatchesByRound].reverse();

  // Y座標計算（両側共通）
  // depth = 0 が最外側（試合数最多）、depth = halfRounds-1 が最内側（試合数最少）
  const spacing = (depth: number) => Math.pow(2, depth) * UNIT_H_C - MATCH_H_C;
  const topPad  = (depth: number) => depth > 0 ? (Math.pow(2, depth) - 1) * UNIT_H_C / 2 : 0;
  // ピッチ = 2^depth * UNIT_H_C。BracketConnectors と同じ式
  const matchCY = (depth: number, mi: number) => topPad(depth) + mi * Math.pow(2, depth) * UNIT_H_C + MATCH_H_C / 2;

  const maxDepth = halfRounds - 1;
  const outerMatchCount = leftMatchesByRound[0]?.length ?? 1;
  // 外側列の底辺 + 余裕
  const svgH = outerMatchCount * UNIT_H_C + MATCH_H_C;

  const totalWidth = (2 * halfRounds + 1) * (COL_W_C + COL_GAP_C);

  return (
    <div className="relative" style={{ minWidth: totalWidth, height: svgH + 28 }}>
      {/* ── 左側コネクター ── */}
      {Array.from({ length: halfRounds - 1 }, (_, ri) => {
        const matchCount = leftMatchesByRound[ri].length;
        const leftX = (COL_W_C + COL_GAP_C) * ri + COL_W_C;
        const midX  = COL_GAP_C / 2;
        return (
          <svg key={`lc-${ri}`} className="absolute pointer-events-none" style={{ left: leftX, top: LABEL_OFFSET_C, width: COL_GAP_C, height: svgH }}>
            {Array.from({ length: matchCount }, (_, mi) => {
              const cy     = matchCY(ri, mi);
              const nextCy = matchCY(ri + 1, Math.floor(mi / 2));
              return (
                <g key={mi}>
                  <line x1={0} y1={cy} x2={midX} y2={cy} stroke={DEF_LINE_COLOR} strokeWidth={1.5} strokeLinecap="round" />
                  {mi % 2 === 0 && mi + 1 < matchCount && (
                    <>
                      <line x1={midX} y1={cy} x2={midX} y2={matchCY(ri, mi + 1)} stroke={DEF_LINE_COLOR} strokeWidth={1.5} strokeLinecap="round" />
                      <line x1={midX} y1={nextCy} x2={COL_GAP_C} y2={nextCy} stroke={DEF_LINE_COLOR} strokeWidth={1.5} strokeLinecap="round" />
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        );
      })}

      {/* ── 左側→決勝コネクター ── */}
      {(() => {
        const leftLastColX = (COL_W_C + COL_GAP_C) * (halfRounds - 1) + COL_W_C;
        const cy = matchCY(halfRounds - 1, 0);
        return (
          <svg key="lf" className="absolute pointer-events-none" style={{ left: leftLastColX, top: LABEL_OFFSET_C, width: COL_GAP_C, height: svgH }}>
            <line x1={0} y1={cy} x2={COL_GAP_C} y2={cy} stroke={DEF_LINE_COLOR} strokeWidth={1.5} strokeLinecap="round" />
          </svg>
        );
      })()}

      {/* ── 右側→決勝コネクター ── */}
      {(() => {
        const rightFirstColLeft = (COL_W_C + COL_GAP_C) * halfRounds + COL_W_C;
        const cy = matchCY(halfRounds - 1, 0);
        return (
          <svg key="rf" className="absolute pointer-events-none" style={{ left: rightFirstColLeft, top: LABEL_OFFSET_C, width: COL_GAP_C, height: svgH }}>
            <line x1={0} y1={cy} x2={COL_GAP_C} y2={cy} stroke={DEF_LINE_COLOR} strokeWidth={1.5} strokeLinecap="round" />
          </svg>
        );
      })()}

      {/* ── 右側コネクター（外→内、右→左） ── */}
      {Array.from({ length: halfRounds - 1 }, (_, ci) => {
        const innerDepth = halfRounds - 1 - ci;
        const outerDepth = halfRounds - 2 - ci;
        const outerCol   = rightColumns[ci + 1];
        const matchCount = outerCol.length;
        const finalColLeft = halfRounds * (COL_W_C + COL_GAP_C);
        const innerColLeft = finalColLeft + COL_W_C + COL_GAP_C + ci * (COL_W_C + COL_GAP_C);
        const svgLeft = innerColLeft + COL_W_C;
        const midX = COL_GAP_C / 2;
        return (
          <svg key={`rc-${ci}`} className="absolute pointer-events-none" style={{ left: svgLeft, top: LABEL_OFFSET_C, width: COL_GAP_C, height: svgH }}>
            {Array.from({ length: matchCount }, (_, mi) => {
              const cy     = matchCY(outerDepth, mi);
              const nextCy = matchCY(innerDepth, Math.floor(mi / 2));
              return (
                <g key={mi}>
                  <line x1={COL_GAP_C} y1={cy} x2={midX} y2={cy} stroke={DEF_LINE_COLOR} strokeWidth={1.5} strokeLinecap="round" />
                  {mi % 2 === 0 && mi + 1 < matchCount && (
                    <>
                      <line x1={midX} y1={cy} x2={midX} y2={matchCY(outerDepth, mi + 1)} stroke={DEF_LINE_COLOR} strokeWidth={1.5} strokeLinecap="round" />
                      <line x1={midX} y1={nextCy} x2={0} y2={nextCy} stroke={DEF_LINE_COLOR} strokeWidth={1.5} strokeLinecap="round" />
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        );
      })}

      {/* ── マッチカード列 ── */}
      <div className="absolute top-0 left-0 flex" style={{ gap: 0 }}>
        {/* 左側列（外→内） */}
        {leftMatchesByRound.map((roundMatches, ri) => {
          const depth = ri; // 外側(ri=0)=密、内側=疎
          const sp   = spacing(depth);
          const tp   = topPad(depth);
          return (
            <div key={`l-${ri}`} className="flex flex-col shrink-0 relative z-10" style={{ width: COL_W_C, marginRight: COL_GAP_C }}>
              <div className="text-xs font-bold text-muted-foreground mb-2 text-center bg-muted/50 rounded-lg py-1 px-2">
                {getRoundName(ri, totalRounds)}
              </div>
              <div className="flex flex-col" style={{ gap: `${sp}px`, paddingTop: `${tp}px` }}>
                {roundMatches.map((match) => (
                  <MatchCard key={match.id} match={match} participants={participants} onSelectWinner={onSelectWinner} roundIndex={ri} totalRounds={totalRounds} />
                ))}
              </div>
            </div>
          );
        })}

        {/* 決勝列 */}
        {(() => {
          const finalDepth = halfRounds - 1; // 内側列と同じ depth → 縦中央に揃う
          const tp = topPad(finalDepth);
          const winner = finalMatch.winnerId
            ? participants.find((p) => p.id === finalMatch.winnerId && !p.isBye)
            : null;
          return (
            <div key="final" className="flex flex-col shrink-0 relative z-10" style={{ width: COL_W_C, marginRight: COL_GAP_C }}>
              <div className="text-xs font-bold text-[var(--accent)] mb-2 text-center bg-[var(--accent)]/10 rounded-lg py-1 px-2 border border-[var(--accent)]/30">
                決勝
              </div>
              <div style={{ paddingTop: `${tp}px` }}>
                <div style={{ position: "relative" }}>
                  {/* 優勝者バナー（カード位置に影響しないよう absolute で浮かせる） */}
                  {winner && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "100%",
                        left: 0,
                        right: 0,
                        marginBottom: 4,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>🏆</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 900,
                          color: "var(--accent)",
                          textAlign: "center",
                          lineHeight: 1.2,
                          maxWidth: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          padding: "0 4px",
                        }}
                      >
                        {winner.name}
                      </span>
                    </div>
                  )}
                  <MatchCard match={finalMatch} participants={participants} onSelectWinner={onSelectWinner} roundIndex={totalRounds - 1} totalRounds={totalRounds} />
                </div>
              </div>
            </div>
          );
        })()}

        {/* 右側列（内→外） */}
        {rightColumns.map((colMatches, ci) => {
          const depth = halfRounds - 1 - ci; // 内側(ci=0)=疎、外側=密
          const sp   = spacing(depth);
          const tp   = topPad(depth);
          const origRoundIdx = halfRounds - 1 - ci; // 元のラウンドインデックス（ラベル用）
          return (
            <div key={`r-${ci}`} className="flex flex-col shrink-0 relative z-10" style={{ width: COL_W_C, marginRight: ci < halfRounds - 1 ? COL_GAP_C : 0 }}>
              <div className="text-xs font-bold text-muted-foreground mb-2 text-center bg-muted/50 rounded-lg py-1 px-2">
                {getRoundName(origRoundIdx, totalRounds)}
              </div>
              <div className="flex flex-col" style={{ gap: `${sp}px`, paddingTop: `${tp}px` }}>
                {colMatches.map((match) => (
                  <MatchCard key={match.id} match={match} participants={participants} onSelectWinner={onSelectWinner} roundIndex={origRoundIdx} totalRounds={totalRounds} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
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
  ) => {
    // 固定高 h-8 (32px) × 2 + divider 1px = 65px = MATCH_H_C。SVG座標と一致させる
    if (!player) {
      return (
        <div className="h-8 px-3 flex items-center text-sm text-muted-foreground italic">
          <span className="truncate">待機中</span>
        </div>
      );
    }
    if (player.isBye) {
      return (
        <div className="h-8 px-3 flex items-center text-sm text-muted-foreground italic">
          <span className="truncate">— Bye</span>
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
        className={`w-full h-8 px-3 text-left text-sm font-medium transition-colors flex items-center gap-1.5 min-w-0 ${
          isWinner
            ? "bg-[var(--accent)]/15 text-[var(--accent)] font-bold"
            : isLoser
            ? "text-muted-foreground opacity-50"
            : canClick
            ? "hover:bg-muted cursor-pointer"
            : "cursor-default"
        }`}
      >
        {player.seedNumber && (
          <span className="text-[10px] text-muted-foreground shrink-0 font-normal">#{player.seedNumber}</span>
        )}
        <span className="truncate">
          {player.name.length > 8 ? `${player.name.slice(0, 7)}…` : player.name}
        </span>
        {isWinner && <span className="ml-auto text-xs shrink-0">✓</span>}
      </motion.button>
    );
  };

  return (
    <div
      className={`rounded-xl border overflow-hidden shadow-sm transition-shadow hover:shadow-md ${
        isFinal ? "border-[var(--accent)]/50 shadow-[var(--accent)]/10" : "border-border"
      } bg-card`}
      style={{ minWidth: 96, width: 112 }}
    >
      {renderSlot(
        p1,
        match.winnerId === match.player1Id,
        match.winnerId !== null && match.winnerId !== match.player1Id,
        () => match.player1Id && onSelectWinner(match.round, match.matchIndex, match.player1Id),
      )}
      <div className="h-px bg-border/50" />
      {renderSlot(
        p2,
        match.winnerId === match.player2Id,
        match.winnerId !== null && match.winnerId !== match.player2Id,
        () => match.player2Id && onSelectWinner(match.round, match.matchIndex, match.player2Id),
      )}
    </div>
  );
}

// ---- セットアップ画面 ----
function SetupScreen({ onStart }: { onStart: (names: string[], mode: "seeded" | "random", tournamentName: string, has3rdPlace: boolean) => void }) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"seeded" | "random">("seeded");
  const [tournamentName, setTournamentName] = useState("");
  const [has3rdPlace, setHas3rdPlace] = useState(false);

  const names = input.split("\n").map((s) => s.trim()).filter(Boolean);
  const count = names.length;
  const isPowerOf2 = count > 0 && (count & (count - 1)) === 0;
  const canStart = count >= 4 && count <= 64;

  return (
    <div className="flex flex-col gap-5">
      {/* ヘッダービジュアル */}
      <div className="relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border border-amber-200/60 dark:border-amber-700/30">
        <img src="/uploads/kawaii-blob-mint.svg" alt="" aria-hidden="true" className="absolute -right-6 -bottom-6 w-28 h-28 opacity-20 pointer-events-none select-none" />
        <img src="/assets/icon-tournament.png" alt="" aria-hidden="true" className="w-16 h-16 object-contain flex-shrink-0 relative z-10" />
        <div className="relative z-10">
          <p className="text-sm font-bold text-amber-700 dark:text-amber-300">トーナメント表</p>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">参加者を入力してトーナメントを作成！シード設定もできる。</p>
        </div>
      </div>
      {/* トーナメント名 */}
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-2">
          トーナメント名（任意）
        </label>
        <input
          type="text"
          className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-muted-foreground"
          placeholder="例: 社内卓球大会 2025"
          value={tournamentName}
          onChange={(e) => setTournamentName(e.target.value)}
        />
      </div>
      {/* 人数テンプレート */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">人数テンプレートから入力</p>
        <div className="flex gap-2 flex-wrap">
          {[4, 8, 16, 32, 64].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setInput(Array.from({ length: n }, (_, i) => `参加者${i + 1}`).join("\n"))}
              className="text-xs rounded-full px-3 py-1 border border-border bg-card hover:bg-muted hover:border-[var(--accent)]/40 transition-all font-bold"
            >
              {n}人
            </button>
          ))}
          <button
            type="button"
            onClick={() => setInput("")}
            className="text-xs rounded-full px-3 py-1 border border-border bg-card hover:bg-muted transition-all text-muted-foreground"
          >
            クリア
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-2">
          参加者名を入力（改行区切り）
        </label>
        <textarea
          className="w-full min-h-[240px] rounded-xl border border-border bg-card p-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-muted-foreground resize-y"
          placeholder={"Aさん\nBさん\nCさん\nDさん"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">{count}人入力</span>
          {count > 0 && !isPowerOf2 && count <= 64 && (
            <span className="text-xs text-amber-500">
              ⚠ {calcTotalSlots(count)}人枠でBye補完します
            </span>
          )}
          {count > 32 && count <= 64 && (
            <span className="text-xs text-sky-500">33人以上は双方向ブラケットで表示されます</span>
          )}
          {count > 64 && (
            <span className="text-xs text-destructive">64人以内で入力してください</span>
          )}
          {count < 4 && count > 0 && (
            <span className="text-xs text-destructive">4人以上必要です</span>
          )}
        </div>
      </div>

      {/* 配置モード（カード型セレクター） */}
      <div className="space-y-2">
        <p className="text-sm font-medium">シード設定</p>
        <div className="grid grid-cols-2 gap-3">
          {([
            { key: "seeded" as const, emoji: "🏅", title: "シード対戦", desc: "入力順がシード順。1位と2位は決勝まで当たらない最適配置。" },
            { key: "random" as const, emoji: "🎲", title: "ランダム", desc: "完全無作為。誰が誰と当たるかは運次第。" },
          ]).map(({ key, emoji, title, desc }) => {
            const active = mode === key;
            return (
              <motion.button
                key={key}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setMode(key)}
                className={`text-left rounded-2xl border-2 p-4 transition-all ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 shadow-sm"
                    : "border-border bg-card hover:border-[var(--accent)]/40"
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <p className={`text-sm font-bold mt-1.5 ${active ? "text-[var(--accent)]" : ""}`}>{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 3位決定戦 */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card">
        <div>
          <p className="text-sm font-bold">3位決定戦</p>
          <p className="text-xs text-muted-foreground mt-0.5">準決勝の敗者同士で3位を決定</p>
        </div>
        <button
          type="button"
          onClick={() => setHas3rdPlace((v) => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors ${has3rdPlace ? "bg-[var(--accent)]" : "bg-muted"}`}
          aria-label="3位決定戦"
        >
          <span
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
            style={{ transform: has3rdPlace ? "translateX(20px)" : "translateX(0)" }}
          />
        </button>
      </div>

      <Button
        onClick={() => onStart(names, mode, tournamentName, has3rdPlace)}
        disabled={!canStart}
        className="h-12 text-base hover:opacity-90"
        style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}
      >
        🏆 トーナメント表を作る
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
  setTournament,
}: {
  tournament: Tournament;
  onSelectWinner: (round: number, matchIndex: number, winnerId: string) => void;
  onReset: () => void;
  onBack: () => void;
  setTournament: React.Dispatch<React.SetStateAction<Tournament | null>>;
}) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [svgStyle, setSvgStyle] = useState<SvgStyleKey>("official");
  const [bracketScale, setBracketScale] = useState(1);
  const bracketWrapRef = useRef<HTMLDivElement>(null);
  const bracketInnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const outer = bracketWrapRef.current;
      const inner = bracketInnerRef.current;
      if (!outer || !inner) return;
      const ow = outer.clientWidth;
      const iw = inner.scrollWidth;
      setBracketScale(iw > ow ? Math.max(ow / iw, 0.25) : 1);
    };
    const ro = new ResizeObserver(update);
    if (bracketWrapRef.current) ro.observe(bracketWrapRef.current);
    update();
    return () => ro.disconnect();
  }, [tournament]);
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

  const handleDownloadSVG = () => {
    const svg = generateSVGBracket(tournament, svgStyle);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tournament-bracket.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("SVG画像をダウンロードしました");
  };

  const handleDownloadPNG = () => {
    const svg = generateSVGBracket(tournament, svgStyle);
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const url = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tournament-bracket.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        URL.revokeObjectURL(svgUrl);
        toast("PNG画像をダウンロードしました");
      }, "image/png");
    };
    img.src = svgUrl;
  };

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

      {/* トーナメント名 */}
      {tournament.name && (
        <p className="text-center text-base font-bold text-[var(--accent)]">{tournament.name}</p>
      )}

      {/* シード表示ラベル */}
      {tournament.seededMode && (
        <p className="text-xs text-muted-foreground text-center">
          🏅 シード対戦モード — #番号はシード順（入力順）
        </p>
      )}

      {/* ブラケット */}
      <div
        ref={bracketWrapRef}
        className="tournament-bracket pb-2"
        style={{ overflow: bracketScale < 1 ? "hidden" : "auto" }}
      >
        <div
          ref={bracketInnerRef}
          style={{
            transformOrigin: "top left",
            transform: bracketScale < 1 ? `scale(${bracketScale})` : undefined,
          }}
        >
        {tournament.twoSided ? (
          <TwoSidedBracket tournament={tournament} onSelectWinner={onSelectWinner} />
        ) : (
          <div
            className="flex gap-5 items-start relative"
            style={{ minWidth: tournament.totalRounds * 120 }}
          >
            <BracketConnectors
              totalRounds={tournament.totalRounds}
              matchesPerRound={tournament.matches.map((m) => m.length)}
            />
            {tournament.matches.map((roundMatches, ri) => {
              const sp = Math.pow(2, ri) * UNIT_H_C - MATCH_H_C; // BracketConnectors の spacing と統一
              const tp = ri > 0 ? (Math.pow(2, ri) - 1) * UNIT_H_C / 2 : 0;

              return (
                <motion.div
                  key={ri}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: ri * 0.08, duration: 0.2 }}
                  className="flex flex-col shrink-0 relative z-10"
                  style={{ minWidth: 112 }}
                >
                  <div className="text-xs font-bold text-muted-foreground mb-2 text-center bg-muted/50 rounded-lg py-1 px-2">
                    {getRoundName(ri, tournament.totalRounds)}
                  </div>
                  <div className="flex flex-col" style={{ gap: `${sp}px`, paddingTop: `${tp}px` }}>
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
              );
            })}
          </div>
        )}
        </div>
      </div>

      {/* 3位決定戦 */}
      {tournament.has3rdPlace && tournament.thirdPlaceMatch && (
        <div className="border border-border rounded-2xl p-4 bg-card">
          <p className="text-xs font-bold text-muted-foreground mb-3 text-center">🥉 3位決定戦</p>
          {tournament.thirdPlaceMatch.player1Id && tournament.thirdPlaceMatch.player2Id ? (
            <div className="flex flex-col gap-1">
              {([
                { pId: tournament.thirdPlaceMatch.player1Id, slot: 1 },
                { pId: tournament.thirdPlaceMatch.player2Id, slot: 2 },
              ] as const).map(({ pId, slot }) => {
                const p = tournament.participants.find((x) => x.id === pId);
                const isWinner = tournament.thirdPlaceMatch!.winnerId === pId;
                const isLoser = tournament.thirdPlaceMatch!.winnerId !== null && !isWinner;
                const canClick = !tournament.thirdPlaceMatch!.winnerId && !p?.isBye;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={!canClick}
                    onClick={() => {
                      if (!canClick) return;
                      setTournament((prev) => {
                        if (!prev) return prev;
                        const updated = {
                          ...prev,
                          thirdPlaceMatch: { ...prev.thirdPlaceMatch!, winnerId: pId },
                        };
                        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
                        return updated;
                      });
                    }}
                    className={`w-full px-3 py-2 text-left text-sm font-medium rounded-xl transition-colors ${
                      isWinner ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold" : isLoser ? "opacity-40" : canClick ? "hover:bg-muted cursor-pointer" : "cursor-default"
                    }`}
                  >
                    {isWinner && "🥉 "}{p?.name ?? "？"}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center">準決勝が終わると自動で組まれます</p>
          )}
        </div>
      )}

      {/* SVGデザイン選択 */}
      <div className="flex gap-1.5 items-center flex-wrap action-buttons">
        <span className="text-xs text-muted-foreground">デザイン:</span>
        {([
          { key: "official", label: "🏆 公式" },
          { key: "colorful", label: "🌈 カラフル" },
          { key: "kawaii",   label: "🌸 かわいい" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSvgStyle(key)}
            className={`text-xs rounded-full px-2.5 py-0.5 border transition-all ${
              svgStyle === key
                ? "bg-[var(--accent)] text-white border-transparent"
                : "border-border hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
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
        <Button variant="outline" size="sm" onClick={handleDownloadSVG} className="gap-1.5">
          <Download className="size-3.5" />
          SVG
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPNG} className="gap-1.5">
          <Download className="size-3.5" />
          PNG
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
              <div className="flex justify-between"><span>Esc</span><span>設定に戻る</span></div>
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
  const modeRef = useRef<"seeded" | "random">("seeded");

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const t: Tournament = JSON.parse(saved);
        setTournament(t);
      }
    } catch { /* ignore */ }

    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (e.key === "Escape") setTournament(null);
      if (e.key === "p" || e.key === "P") window.print();
      if (e.key === "r" || e.key === "R") {
        if (namesRef.current.length > 0) {
          const t = buildTournament(namesRef.current, modeRef.current);
          setTournament(t);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch { /* ignore */ }
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleStart = useCallback((names: string[], mode: "seeded" | "random", tournamentName: string, has3rdPlace: boolean) => {
    namesRef.current = names;
    modeRef.current = mode;
    const t = buildTournament(names, mode, tournamentName, has3rdPlace);
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
      namesRef.current = tournament.participants.filter((p) => !p.isBye).map((p) => p.name);
    }
    const t = buildTournament(namesRef.current, modeRef.current, tournament?.name ?? "", tournament?.has3rdPlace ?? false);
    setTournament(t);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch { /* ignore */ }
  }, [tournament]);

  const handleBack = useCallback(() => {
    if (tournament) {
      namesRef.current = tournament.participants.filter((p) => !p.isBye).map((p) => p.name);
    }
    setTournament(null);
  }, [tournament]);

  if (!mounted) return null;

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
              setTournament={setTournament}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </ToolLayout>
  );
}
