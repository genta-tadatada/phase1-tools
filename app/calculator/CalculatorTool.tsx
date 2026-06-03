"use client";

import { useReducer, useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout/ToolLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Operator = "+" | "-" | "×" | "÷" | "^" | null;

type MathFunc =
  | "sqrt" | "square" | "reciprocal" | "abs" | "factorial"
  | "log" | "ln" | "pow10" | "exp"
  | "sin" | "cos" | "tan"
  | "pi" | "e_const";

interface CalcState {
  currentValue: string;
  expression: string;
  previousValue: number | null;
  operator: Operator;
  waitingForOperand: boolean;
  hasError: boolean;
  _lastCalcExpr?: string;
  _lastCalcResult?: number;
  memory: number;
  degMode: boolean;
}

interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  resultRaw: number;
  timestamp: number;
}

type CalcAction =
  | { type: "INPUT_DIGIT"; digit: string }
  | { type: "INPUT_DOT" }
  | { type: "INPUT_OPERATOR"; op: Operator }
  | { type: "CALCULATE" }
  | { type: "CLEAR" }
  | { type: "BACKSPACE" }
  | { type: "TOGGLE_SIGN" }
  | { type: "PERCENT" }
  | { type: "SET_VALUE"; value: number }
  | { type: "MEMORY_ADD" }
  | { type: "MEMORY_SUBTRACT" }
  | { type: "MEMORY_RECALL" }
  | { type: "MEMORY_CLEAR" }
  | { type: "APPLY_FUNC"; func: MathFunc }
  | { type: "TOGGLE_DEG_MODE" };

const HISTORY_KEY = "phase1-calculator-history";

const initialState: CalcState = {
  currentValue: "0",
  expression: "",
  previousValue: null,
  operator: null,
  waitingForOperand: false,
  hasError: false,
  memory: 0,
  degMode: true,
};

function safeCalc(left: number, right: number, op: Operator): number {
  if (op === "÷") {
    if (right === 0) throw new Error("DIVIDE_BY_ZERO");
    return left / right;
  }
  if (op === "^") return Math.pow(left, right);
  const decL = (left.toString().split(".")[1] || "").length;
  const decR = (right.toString().split(".")[1] || "").length;
  const mult = Math.pow(10, Math.max(decL, decR));
  const l = Math.round(left * mult);
  const r = Math.round(right * mult);
  if (op === "+") return (l + r) / mult;
  if (op === "-") return (l - r) / mult;
  if (op === "×") return (l / mult) * (r / mult);
  return left;
}

function factorial(n: number): number {
  if (n === 0 || n === 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

const MAX_DIGITS = 15;

function formatDisplay(val: string): string {
  if (val === "エラー") return val;
  if (val.endsWith(".")) return val;
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  if (Math.abs(num) >= Math.pow(10, MAX_DIGITS)) return num.toExponential(6);
  const [intPart, decPart] = val.split(".");
  const formatted = Number(intPart).toLocaleString("ja-JP");
  return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
}

function fontSizeClass(val: string): string {
  const len = val.length;
  if (len > 14) return "text-3xl";
  if (len > 10) return "text-4xl";
  return "text-5xl";
}

function calcReducer(state: CalcState, action: CalcAction): CalcState {
  if (state.hasError && action.type !== "CLEAR") return state;

  switch (action.type) {
    case "INPUT_DIGIT": {
      if (state.waitingForOperand) return { ...state, currentValue: action.digit, waitingForOperand: false };
      if (state.currentValue === "0" && action.digit !== ".") return { ...state, currentValue: action.digit };
      if (state.currentValue.length >= 16) return state;
      return { ...state, currentValue: state.currentValue + action.digit };
    }
    case "INPUT_DOT": {
      if (state.waitingForOperand) return { ...state, currentValue: "0.", waitingForOperand: false };
      if (state.currentValue.includes(".")) return state;
      return { ...state, currentValue: state.currentValue + "." };
    }
    case "INPUT_OPERATOR": {
      const cur = parseFloat(state.currentValue);
      if (state.operator && !state.waitingForOperand && state.previousValue !== null) {
        try {
          const result = safeCalc(state.previousValue, cur, state.operator);
          const resultStr = result.toString();
          return {
            ...state,
            currentValue: resultStr,
            previousValue: result,
            operator: action.op,
            expression: `${formatDisplay(resultStr)} ${action.op ?? ""}`,
            waitingForOperand: true,
          };
        } catch {
          return { ...state, currentValue: "エラー", hasError: true };
        }
      }
      return {
        ...state,
        previousValue: cur,
        operator: action.op,
        expression: `${formatDisplay(state.currentValue)} ${action.op ?? ""}`,
        waitingForOperand: true,
      };
    }
    case "CALCULATE": {
      if (state.operator === null || state.previousValue === null) return state;
      const cur = parseFloat(state.currentValue);
      const expr = `${formatDisplay(state.previousValue.toString())} ${state.operator} ${formatDisplay(state.currentValue)}`;
      try {
        const result = safeCalc(state.previousValue, cur, state.operator);
        const resultStr = result.toString();
        return {
          ...state,
          currentValue: resultStr,
          expression: expr,
          previousValue: null,
          operator: null,
          waitingForOperand: true,
          _lastCalcExpr: expr,
          _lastCalcResult: result,
        };
      } catch {
        return { ...state, currentValue: "エラー", expression: expr, hasError: true };
      }
    }
    case "CLEAR":
      return { ...initialState, memory: state.memory, degMode: state.degMode };
    case "BACKSPACE": {
      if (state.waitingForOperand) return state;
      if (state.currentValue.length <= 1) return { ...state, currentValue: "0" };
      return { ...state, currentValue: state.currentValue.slice(0, -1) };
    }
    case "TOGGLE_SIGN": {
      const num = parseFloat(state.currentValue);
      if (isNaN(num)) return state;
      return { ...state, currentValue: (-num).toString() };
    }
    case "PERCENT": {
      const cur = parseFloat(state.currentValue);
      if (isNaN(cur)) return state;
      if (state.previousValue !== null && (state.operator === "+" || state.operator === "-")) {
        // 電卓方式: 100 + 10% → previousValue × (cur/100)
        const pct = state.previousValue * (cur / 100);
        return { ...state, currentValue: pct.toString(), waitingForOperand: false };
      }
      return { ...state, currentValue: (cur / 100).toString() };
    }
    case "SET_VALUE":
      return { ...initialState, memory: state.memory, degMode: state.degMode, currentValue: action.value.toString(), waitingForOperand: true };

    case "MEMORY_ADD": {
      const cur = parseFloat(state.currentValue);
      if (isNaN(cur)) return state;
      return { ...state, memory: state.memory + cur };
    }
    case "MEMORY_SUBTRACT": {
      const cur = parseFloat(state.currentValue);
      if (isNaN(cur)) return state;
      return { ...state, memory: state.memory - cur };
    }
    case "MEMORY_RECALL":
      return { ...state, currentValue: state.memory.toString(), waitingForOperand: false };
    case "MEMORY_CLEAR":
      return { ...state, memory: 0 };

    case "TOGGLE_DEG_MODE":
      return { ...state, degMode: !state.degMode };

    case "APPLY_FUNC": {
      const func = action.func;
      if (func === "pi") return { ...state, currentValue: Math.PI.toString(), expression: "π", waitingForOperand: false };
      if (func === "e_const") return { ...state, currentValue: Math.E.toString(), expression: "e", waitingForOperand: false };

      const cur = parseFloat(state.currentValue);
      if (isNaN(cur)) return state;
      const disp = formatDisplay(state.currentValue);
      let result: number;
      let label: string;

      try {
        switch (func) {
          case "sqrt":
            if (cur < 0) throw new Error("DOMAIN");
            result = Math.sqrt(cur); label = `√(${disp})`; break;
          case "square":
            result = cur * cur; label = `(${disp})²`; break;
          case "reciprocal":
            if (cur === 0) throw new Error("DIVIDE_BY_ZERO");
            result = 1 / cur; label = `1/(${disp})`; break;
          case "abs":
            result = Math.abs(cur); label = `|(${disp})|`; break;
          case "factorial":
            if (cur < 0 || !Number.isInteger(cur) || cur > 170) throw new Error("DOMAIN");
            result = factorial(cur); label = `${cur}!`; break;
          case "log":
            if (cur <= 0) throw new Error("DOMAIN");
            result = Math.log10(cur); label = `log(${disp})`; break;
          case "ln":
            if (cur <= 0) throw new Error("DOMAIN");
            result = Math.log(cur); label = `ln(${disp})`; break;
          case "pow10":
            result = Math.pow(10, cur); label = `10^${disp}`; break;
          case "exp":
            result = Math.exp(cur); label = `e^${disp}`; break;
          case "sin": {
            const rad = state.degMode ? cur * Math.PI / 180 : cur;
            result = Math.sin(rad);
            if (Math.abs(result) < 1e-10) result = 0;
            label = `sin(${disp}${state.degMode ? "°" : ""})`; break;
          }
          case "cos": {
            const rad = state.degMode ? cur * Math.PI / 180 : cur;
            result = Math.cos(rad);
            if (Math.abs(result) < 1e-10) result = 0;
            label = `cos(${disp}${state.degMode ? "°" : ""})`; break;
          }
          case "tan": {
            if (state.degMode && (Math.abs(cur % 180) === 90)) throw new Error("DOMAIN");
            const rad = state.degMode ? cur * Math.PI / 180 : cur;
            result = Math.tan(rad);
            if (Math.abs(result) < 1e-10) result = 0;
            label = `tan(${disp}${state.degMode ? "°" : ""})`; break;
          }
          default: return state;
        }
      } catch {
        return { ...state, currentValue: "エラー", hasError: true };
      }

      const resultStr = result.toString();
      return {
        ...state,
        currentValue: resultStr,
        expression: label,
        previousValue: null,
        operator: null,
        waitingForOperand: true,
        _lastCalcExpr: label,
        _lastCalcResult: result,
      };
    }

    default:
      return state;
  }
}

export function CalculatorTool() {
  const [state, dispatch] = useReducer(calcReducer, initialState);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [resultKey, setResultKey] = useState(0);
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const prevExprRef = useRef<string>("");

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (state._lastCalcExpr && state._lastCalcResult !== undefined) {
      const expr = state._lastCalcExpr;
      if (expr === prevExprRef.current) return;
      prevExprRef.current = expr;
      setResultKey((k) => k + 1);
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random()}`,
        expression: expr,
        result: formatDisplay(state._lastCalcResult.toString()),
        resultRaw: state._lastCalcResult,
        timestamp: Date.now(),
      };
      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, 20);
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    }
    if (state.hasError) setShakeKey((k) => k + 1);
  }, [state.currentValue, state.hasError, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ("0123456789".includes(e.key)) { e.preventDefault(); dispatch({ type: "INPUT_DIGIT", digit: e.key }); }
      else if (e.key === ".") { e.preventDefault(); dispatch({ type: "INPUT_DOT" }); }
      else if (e.key === "+") { e.preventDefault(); dispatch({ type: "INPUT_OPERATOR", op: "+" }); }
      else if (e.key === "-") { e.preventDefault(); dispatch({ type: "INPUT_OPERATOR", op: "-" }); }
      else if (e.key === "*") { e.preventDefault(); dispatch({ type: "INPUT_OPERATOR", op: "×" }); }
      else if (e.key === "/") { e.preventDefault(); dispatch({ type: "INPUT_OPERATOR", op: "÷" }); }
      else if (e.key === "^") { e.preventDefault(); dispatch({ type: "INPUT_OPERATOR", op: "^" }); }
      else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); dispatch({ type: "CALCULATE" }); }
      else if (e.key === "Backspace") { e.preventDefault(); dispatch({ type: "BACKSPACE" }); }
      else if (e.key === "Escape" || e.key === "Delete") { e.preventDefault(); dispatch({ type: "CLEAR" }); }
      else if (e.key === "%") { e.preventDefault(); dispatch({ type: "PERCENT" }); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const clearHistory = () => setShowClearHistoryDialog(true);
  const confirmClearHistory = () => {
    setHistory([]);
    setShowClearHistoryDialog(false);
    try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
  };

  const applyPreset = useCallback((multiplier: number, label: string) => {
    const cur = parseFloat(state.currentValue);
    if (isNaN(cur) || state.hasError) return;
    const result = Math.round(cur * multiplier * 100) / 100;
    const exprLabel = `${formatDisplay(state.currentValue)} × ${label}`;
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random()}`,
      expression: exprLabel,
      result: formatDisplay(result.toString()),
      resultRaw: result,
      timestamp: Date.now(),
    };
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 20);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    dispatch({ type: "SET_VALUE", value: result });
    setResultKey((k) => k + 1);
  }, [state]);

  // ---- ボタンコンポーネント ----
  const CalcButton = ({
    label, ariaLabel, onClick, className = "", wide = false,
  }: { label: string; ariaLabel?: string; onClick: () => void; className?: string; wide?: boolean }) => (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.08 }}
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className={`flex items-center justify-center rounded-xl text-base font-medium h-14 transition-colors select-none touch-manipulation ${wide ? "col-span-2" : ""} ${className}`}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {label}
    </motion.button>
  );

  const ExtBtn = ({
    label, ariaLabel, onClick, accent = false, active = false, dim = false,
  }: { label: string; ariaLabel?: string; onClick: () => void; accent?: boolean; active?: boolean; dim?: boolean }) => (
    <motion.button
      whileTap={{ scale: 0.94 }}
      transition={{ duration: 0.08 }}
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className={`h-9 rounded-lg text-sm font-medium transition-colors select-none touch-manipulation ${
        active
          ? "bg-[var(--accent)] text-white"
          : accent
          ? "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/20"
          : dim
          ? "bg-muted text-muted-foreground/40 cursor-default"
          : "bg-muted text-foreground hover:bg-muted/70"
      }`}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {label}
    </motion.button>
  );

  const PRESETS = [
    { label: "税込(10%)", mult: 1.1 },
    { label: "税抜(10%)", mult: 1 / 1.1 },
    { label: "10%OFF", mult: 0.9 },
    { label: "20%OFF", mult: 0.8 },
    { label: "30%OFF", mult: 0.7 },
    { label: "半額", mult: 0.5 },
  ];

  return (
    <ToolLayout title="履歴付き電卓" wide>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 電卓本体 */}
        <div className="flex-1 max-w-sm flex flex-col gap-3">
          {/* ディスプレイ */}
          <motion.div
            animate={shakeKey > 0 ? { x: [-4, 4, -2, 2, 0] } : { x: 0 }}
            key={shakeKey}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-border bg-card px-5 py-4 flex flex-col items-end gap-1"
            aria-live="polite"
            role="status"
          >
            {/* メモリインジケーター */}
            {state.memory !== 0 && (
              <div className="text-xs font-bold text-[var(--accent)] self-start px-1.5 py-0.5 rounded bg-[var(--accent)]/10">
                M: {formatDisplay(state.memory.toString())}
              </div>
            )}
            <div className="text-sm text-muted-foreground min-h-5 text-right truncate w-full">
              {state.expression}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={resultKey + "-" + state.currentValue}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className={`font-bold tabular-nums text-right w-full leading-tight transition-all ${fontSizeClass(formatDisplay(state.currentValue))} ${state.hasError ? "text-destructive" : ""}`}
              >
                {formatDisplay(state.currentValue)}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* キーパッド */}
          <div className="grid grid-cols-4 gap-2" role="grid">
            <CalcButton label="AC" onClick={() => dispatch({ type: "CLEAR" })} className="bg-muted text-muted-foreground hover:bg-muted/80" />
            <CalcButton label="±" ariaLabel="符号反転" onClick={() => dispatch({ type: "TOGGLE_SIGN" })} className="bg-muted text-muted-foreground hover:bg-muted/80" />
            <CalcButton label="%" ariaLabel="パーセント" onClick={() => dispatch({ type: "PERCENT" })} className="bg-muted text-muted-foreground hover:bg-muted/80" />
            <CalcButton label="÷" ariaLabel="割る" onClick={() => dispatch({ type: "INPUT_OPERATOR", op: "÷" })} className={`border border-border bg-background hover:bg-muted font-medium ${state.operator === "÷" ? "text-[var(--accent)] border-[var(--accent)]" : "text-[var(--accent)]"}`} />

            {["7", "8", "9"].map((d) => (
              <CalcButton key={d} label={d} onClick={() => dispatch({ type: "INPUT_DIGIT", digit: d })} className="bg-muted hover:bg-muted/80" />
            ))}
            <CalcButton label="×" ariaLabel="掛ける" onClick={() => dispatch({ type: "INPUT_OPERATOR", op: "×" })} className={`border border-border bg-background hover:bg-muted font-medium ${state.operator === "×" ? "text-[var(--accent)] border-[var(--accent)]" : "text-[var(--accent)]"}`} />

            {["4", "5", "6"].map((d) => (
              <CalcButton key={d} label={d} onClick={() => dispatch({ type: "INPUT_DIGIT", digit: d })} className="bg-muted hover:bg-muted/80" />
            ))}
            <CalcButton label="−" ariaLabel="引く" onClick={() => dispatch({ type: "INPUT_OPERATOR", op: "-" })} className={`border border-border bg-background hover:bg-muted font-medium ${state.operator === "-" ? "text-[var(--accent)] border-[var(--accent)]" : "text-[var(--accent)]"}`} />

            {["1", "2", "3"].map((d) => (
              <CalcButton key={d} label={d} onClick={() => dispatch({ type: "INPUT_DIGIT", digit: d })} className="bg-muted hover:bg-muted/80" />
            ))}
            <CalcButton label="+" ariaLabel="足す" onClick={() => dispatch({ type: "INPUT_OPERATOR", op: "+" })} className={`border border-border bg-background hover:bg-muted font-medium ${state.operator === "+" ? "text-[var(--accent)] border-[var(--accent)]" : "text-[var(--accent)]"}`} />

            <CalcButton label="0" onClick={() => dispatch({ type: "INPUT_DIGIT", digit: "0" })} className="bg-muted hover:bg-muted/80 col-span-2" wide />
            <CalcButton label="." ariaLabel="小数点" onClick={() => dispatch({ type: "INPUT_DOT" })} className="bg-muted hover:bg-muted/80" />
            <CalcButton label="⌫" ariaLabel="1桁削除" onClick={() => dispatch({ type: "BACKSPACE" })} className="bg-muted text-muted-foreground hover:bg-muted/80" />

            <motion.button
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.08 }}
              onClick={() => dispatch({ type: "CALCULATE" })}
              aria-label="イコール"
              className="col-span-4 h-14 rounded-xl text-base font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)", WebkitTapHighlightColor: "transparent" }}
            >
              =
            </motion.button>
          </div>

          {/* ===== 拡張機能パネル ===== */}
          <div className="flex flex-col gap-1.5 pt-1">
            {/* ① メモリ */}
            <div className="text-xs text-muted-foreground font-medium px-0.5 mb-0.5">メモリ</div>
            <div className="grid grid-cols-4 gap-1.5">
              <ExtBtn label="M+" ariaLabel="メモリ加算" onClick={() => dispatch({ type: "MEMORY_ADD" })} accent />
              <ExtBtn label="M−" ariaLabel="メモリ減算" onClick={() => dispatch({ type: "MEMORY_SUBTRACT" })} accent />
              <ExtBtn label="MR" ariaLabel="メモリ呼び出し" onClick={() => dispatch({ type: "MEMORY_RECALL" })} accent dim={state.memory === 0} />
              <ExtBtn label="MC" ariaLabel="メモリクリア" onClick={() => dispatch({ type: "MEMORY_CLEAR" })} accent dim={state.memory === 0} />
            </div>

            {/* ② 基本数学 */}
            <div className="text-xs text-muted-foreground font-medium px-0.5 mt-1 mb-0.5">数学関数</div>
            <div className="grid grid-cols-4 gap-1.5">
              <ExtBtn label="√x" onClick={() => dispatch({ type: "APPLY_FUNC", func: "sqrt" })} />
              <ExtBtn label="x²" onClick={() => dispatch({ type: "APPLY_FUNC", func: "square" })} />
              <ExtBtn label="1/x" onClick={() => dispatch({ type: "APPLY_FUNC", func: "reciprocal" })} />
              <ExtBtn label="|x|" onClick={() => dispatch({ type: "APPLY_FUNC", func: "abs" })} />
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <ExtBtn label="xʸ" ariaLabel="べき乗" onClick={() => dispatch({ type: "INPUT_OPERATOR", op: "^" })} active={state.operator === "^"} />
              <ExtBtn label="n!" ariaLabel="階乗" onClick={() => dispatch({ type: "APPLY_FUNC", func: "factorial" })} />
              <ExtBtn label="π" ariaLabel="円周率" onClick={() => dispatch({ type: "APPLY_FUNC", func: "pi" })} />
              <ExtBtn label="e" ariaLabel="自然対数の底" onClick={() => dispatch({ type: "APPLY_FUNC", func: "e_const" })} />
            </div>

            {/* ③ 対数 */}
            <div className="grid grid-cols-4 gap-1.5">
              <ExtBtn label="log" ariaLabel="常用対数" onClick={() => dispatch({ type: "APPLY_FUNC", func: "log" })} />
              <ExtBtn label="ln" ariaLabel="自然対数" onClick={() => dispatch({ type: "APPLY_FUNC", func: "ln" })} />
              <ExtBtn label="10ˣ" ariaLabel="10のx乗" onClick={() => dispatch({ type: "APPLY_FUNC", func: "pow10" })} />
              <ExtBtn label="eˣ" ariaLabel="eのx乗" onClick={() => dispatch({ type: "APPLY_FUNC", func: "exp" })} />
            </div>

            {/* ④ 三角関数 */}
            <div className="grid grid-cols-4 gap-1.5">
              <ExtBtn label="sin" onClick={() => dispatch({ type: "APPLY_FUNC", func: "sin" })} />
              <ExtBtn label="cos" onClick={() => dispatch({ type: "APPLY_FUNC", func: "cos" })} />
              <ExtBtn label="tan" onClick={() => dispatch({ type: "APPLY_FUNC", func: "tan" })} />
              <ExtBtn
                label={state.degMode ? "DEG" : "RAD"}
                ariaLabel="度/ラジアン切替"
                onClick={() => dispatch({ type: "TOGGLE_DEG_MODE" })}
                accent
                active={!state.degMode}
              />
            </div>

            {/* ⑤ 税計算・割引プリセット */}
            <div className="text-xs text-muted-foreground font-medium px-0.5 mt-1 mb-0.5">税計算・割引</div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {PRESETS.map(({ label, mult }) => (
                <motion.button
                  key={label}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.08 }}
                  onClick={() => applyPreset(mult, label)}
                  className="flex-shrink-0 px-3 h-9 rounded-xl border border-[var(--accent)]/40 text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent)]/10 transition-colors"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* 履歴パネル */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">履歴（{history.length}件）</span>
            {history.length > 0 && (
              <button onClick={clearHistory} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="size-3.5" />
                全削除
              </button>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {history.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">計算履歴がありません</div>
            ) : (
              <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                <AnimatePresence initial={false}>
                  {history.map((entry) => (
                    <motion.button
                      key={entry.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => dispatch({ type: "SET_VALUE", value: entry.resultRaw })}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className="text-muted-foreground truncate mr-2">{entry.expression}</span>
                      <span className="font-bold tabular-nums text-foreground whitespace-nowrap">= {entry.result}</span>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">履歴をタップすると結果を電卓に読み込みます</p>

          <div className="relative flex justify-center">
            {showShortcuts && (
              <div className="absolute bottom-full mb-2 w-64 rounded-lg border border-border bg-background shadow-lg p-3 z-50 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground mb-2">キーボードショートカット</p>
                <div className="space-y-1">
                  <div className="flex justify-between"><span>0〜9</span><span>数字入力</span></div>
                  <div className="flex justify-between"><span>+ - * /</span><span>演算子</span></div>
                  <div className="flex justify-between"><span>^</span><span>べき乗</span></div>
                  <div className="flex justify-between"><span>Enter / =</span><span>計算実行</span></div>
                  <div className="flex justify-between"><span>Backspace</span><span>1文字削除</span></div>
                  <div className="flex justify-between"><span>Esc / Delete</span><span>クリア</span></div>
                  <div className="flex justify-between"><span>%</span><span>パーセント</span></div>
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
      </div>

      <Dialog open={showClearHistoryDialog} onOpenChange={setShowClearHistoryDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>履歴を全削除</DialogTitle>
            <DialogDescription>計算履歴を全て削除します。この操作は取り消せません。</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false}>
            <Button variant="outline" onClick={() => setShowClearHistoryDialog(false)}>キャンセル</Button>
            <Button variant="destructive" onClick={confirmClearHistory}>削除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ToolLayout>
  );
}
