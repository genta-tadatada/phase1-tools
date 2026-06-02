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

// ---- 型定義 ----
type Operator = "+" | "-" | "×" | "÷" | null;

interface CalcState {
  currentValue: string;
  expression: string;
  previousValue: number | null;
  operator: Operator;
  waitingForOperand: boolean;
  hasError: boolean;
  _lastCalcExpr?: string;
  _lastCalcResult?: number;
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
  | { type: "SET_VALUE"; value: number };

const HISTORY_KEY = "phase1-calculator-history";

const initialState: CalcState = {
  currentValue: "0",
  expression: "",
  previousValue: null,
  operator: null,
  waitingForOperand: false,
  hasError: false,
};

// ---- 浮動小数点誤差対策 ----
function safeCalc(left: number, right: number, op: Operator): number {
  if (op === "÷") {
    if (right === 0) throw new Error("DIVIDE_BY_ZERO");
    return left / right;
  }
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

// ---- 表示フォーマット ----
const MAX_DIGITS = 15;

function formatDisplay(val: string): string {
  if (val === "エラー") return val;
  if (val.endsWith(".")) return val; // 小数点入力中はそのまま
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  if (Math.abs(num) >= Math.pow(10, MAX_DIGITS)) {
    return num.toExponential(6);
  }
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

// ---- Reducer ----
function calcReducer(state: CalcState, action: CalcAction): CalcState {
  if (state.hasError && action.type !== "CLEAR") return state;

  switch (action.type) {
    case "INPUT_DIGIT": {
      if (state.waitingForOperand) {
        return { ...state, currentValue: action.digit, waitingForOperand: false };
      }
      if (state.currentValue === "0" && action.digit !== ".") {
        return { ...state, currentValue: action.digit };
      }
      if (state.currentValue.length >= 16) return state;
      return { ...state, currentValue: state.currentValue + action.digit };
    }

    case "INPUT_DOT": {
      if (state.waitingForOperand) {
        return { ...state, currentValue: "0.", waitingForOperand: false };
      }
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
        return {
          ...state,
          currentValue: "エラー",
          expression: expr,
          hasError: true,
        };
      }
    }

    case "CLEAR":
      return { ...initialState };

    case "BACKSPACE": {
      if (state.waitingForOperand) return state;
      if (state.currentValue.length <= 1) {
        return { ...state, currentValue: "0" };
      }
      return { ...state, currentValue: state.currentValue.slice(0, -1) };
    }

    case "TOGGLE_SIGN": {
      const num = parseFloat(state.currentValue);
      if (isNaN(num)) return state;
      return { ...state, currentValue: (-num).toString() };
    }

    case "PERCENT": {
      const num = parseFloat(state.currentValue);
      if (isNaN(num)) return state;
      return { ...state, currentValue: (num / 100).toString() };
    }

    case "SET_VALUE": {
      return {
        ...initialState,
        currentValue: action.value.toString(),
        waitingForOperand: true,
      };
    }

    default:
      return state;
  }
}

// ---- メインコンポーネント ----
export function CalculatorTool() {
  const [state, dispatch] = useReducer(calcReducer, initialState);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [resultKey, setResultKey] = useState(0);
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const prevExprRef = useRef<string>("");

  // SSR対策
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  // 計算完了時に履歴追加
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
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
    if (state.hasError) {
      setShakeKey((k) => k + 1);
    }
  }, [state.currentValue, state.hasError, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // キーボード操作
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if ("0123456789".includes(e.key)) {
        e.preventDefault();
        dispatch({ type: "INPUT_DIGIT", digit: e.key });
      } else if (e.key === ".") {
        e.preventDefault();
        dispatch({ type: "INPUT_DOT" });
      } else if (e.key === "+") {
        e.preventDefault();
        dispatch({ type: "INPUT_OPERATOR", op: "+" });
      } else if (e.key === "-") {
        e.preventDefault();
        dispatch({ type: "INPUT_OPERATOR", op: "-" });
      } else if (e.key === "*") {
        e.preventDefault();
        dispatch({ type: "INPUT_OPERATOR", op: "×" });
      } else if (e.key === "/") {
        e.preventDefault();
        dispatch({ type: "INPUT_OPERATOR", op: "÷" });
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        dispatch({ type: "CALCULATE" });
      } else if (e.key === "Backspace") {
        e.preventDefault();
        dispatch({ type: "BACKSPACE" });
      } else if (e.key === "Escape" || e.key === "Delete") {
        e.preventDefault();
        dispatch({ type: "CLEAR" });
      } else if (e.key === "%") {
        e.preventDefault();
        dispatch({ type: "PERCENT" });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const clearHistory = () => setShowClearHistoryDialog(true);

  const confirmClearHistory = () => {
    setHistory([]);
    setShowClearHistoryDialog(false);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore
    }
  };

  const applyPreset = useCallback((multiplier: number) => {
    const cur = parseFloat(state.currentValue);
    if (isNaN(cur) || state.hasError) return;
    const result = Math.round(cur * multiplier * 100) / 100;
    const exprLabel =
      multiplier > 1
        ? `${formatDisplay(state.currentValue)} × ${multiplier.toFixed(2)}`
        : `${formatDisplay(state.currentValue)} × ${multiplier.toFixed(2)}`;
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random()}`,
      expression: exprLabel,
      result: formatDisplay(result.toString()),
      resultRaw: result,
      timestamp: Date.now(),
    };
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 20);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    dispatch({ type: "SET_VALUE", value: result });
    setResultKey((k) => k + 1);
  }, [state]);

  // ---- ボタン定義 ----
  const CalcButton = ({
    label,
    ariaLabel,
    onClick,
    className = "",
    wide = false,
  }: {
    label: string;
    ariaLabel?: string;
    onClick: () => void;
    className?: string;
    wide?: boolean;
  }) => (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.08 }}
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className={`flex items-center justify-center rounded-xl text-base font-medium h-14 transition-colors select-none touch-manipulation ${
        wide ? "col-span-2" : ""
      } ${className}`}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {label}
    </motion.button>
  );

  return (
    <ToolLayout title="履歴付き電卓" wide>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 電卓本体 */}
        <div className="flex-1 max-w-sm flex flex-col gap-3">
          {/* ディスプレイ */}
          <motion.div
            animate={
              shakeKey > 0
                ? { x: [-4, 4, -2, 2, 0] }
                : { x: 0 }
            }
            key={shakeKey}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-border bg-card px-5 py-4 flex flex-col items-end gap-1"
            aria-live="polite"
            role="status"
          >
            <div className="text-sm text-muted-foreground min-h-5 text-right truncate w-full">
              {state.expression}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={resultKey + "-" + state.currentValue}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className={`font-bold tabular-nums text-right w-full leading-tight transition-all ${fontSizeClass(formatDisplay(state.currentValue))} ${
                  state.hasError ? "text-destructive" : ""
                }`}
              >
                {formatDisplay(state.currentValue)}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* プリセットボタン行 */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { label: "税込(10%)", mult: 1.1 },
              { label: "税抜(10%)", mult: 1 / 1.1 },
              { label: "10%OFF", mult: 0.9 },
              { label: "20%OFF", mult: 0.8 },
              { label: "30%OFF", mult: 0.7 },
            ].map(({ label, mult }) => (
              <motion.button
                key={label}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.08 }}
                onClick={() => applyPreset(mult)}
                className="flex-shrink-0 px-3 h-9 rounded-xl border border-[var(--accent)]/40 text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent)]/10 transition-colors"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {label}
              </motion.button>
            ))}
          </div>

          {/* キーパッド */}
          <div className="grid grid-cols-4 gap-2" role="grid">
            {/* 行1: AC ± % ÷ */}
            <CalcButton
              label="AC"
              onClick={() => dispatch({ type: "CLEAR" })}
              className="bg-muted text-muted-foreground hover:bg-muted/80"
            />
            <CalcButton
              label="±"
              ariaLabel="符号反転"
              onClick={() => dispatch({ type: "TOGGLE_SIGN" })}
              className="bg-muted text-muted-foreground hover:bg-muted/80"
            />
            <CalcButton
              label="%"
              ariaLabel="パーセント"
              onClick={() => dispatch({ type: "PERCENT" })}
              className="bg-muted text-muted-foreground hover:bg-muted/80"
            />
            <CalcButton
              label="÷"
              ariaLabel="割る"
              onClick={() => dispatch({ type: "INPUT_OPERATOR", op: "÷" })}
              className={`border border-border bg-background hover:bg-muted font-medium ${
                state.operator === "÷" ? "text-[var(--accent)] border-[var(--accent)]" : "text-[var(--accent)]"
              }`}
            />

            {/* 行2: 7 8 9 × */}
            {["7", "8", "9"].map((d) => (
              <CalcButton
                key={d}
                label={d}
                onClick={() => dispatch({ type: "INPUT_DIGIT", digit: d })}
                className="bg-muted hover:bg-muted/80"
              />
            ))}
            <CalcButton
              label="×"
              ariaLabel="掛ける"
              onClick={() => dispatch({ type: "INPUT_OPERATOR", op: "×" })}
              className={`border border-border bg-background hover:bg-muted font-medium ${
                state.operator === "×" ? "text-[var(--accent)] border-[var(--accent)]" : "text-[var(--accent)]"
              }`}
            />

            {/* 行3: 4 5 6 − */}
            {["4", "5", "6"].map((d) => (
              <CalcButton
                key={d}
                label={d}
                onClick={() => dispatch({ type: "INPUT_DIGIT", digit: d })}
                className="bg-muted hover:bg-muted/80"
              />
            ))}
            <CalcButton
              label="−"
              ariaLabel="引く"
              onClick={() => dispatch({ type: "INPUT_OPERATOR", op: "-" })}
              className={`border border-border bg-background hover:bg-muted font-medium ${
                state.operator === "-" ? "text-[var(--accent)] border-[var(--accent)]" : "text-[var(--accent)]"
              }`}
            />

            {/* 行4: 1 2 3 + */}
            {["1", "2", "3"].map((d) => (
              <CalcButton
                key={d}
                label={d}
                onClick={() => dispatch({ type: "INPUT_DIGIT", digit: d })}
                className="bg-muted hover:bg-muted/80"
              />
            ))}
            <CalcButton
              label="+"
              ariaLabel="足す"
              onClick={() => dispatch({ type: "INPUT_OPERATOR", op: "+" })}
              className={`border border-border bg-background hover:bg-muted font-medium ${
                state.operator === "+" ? "text-[var(--accent)] border-[var(--accent)]" : "text-[var(--accent)]"
              }`}
            />

            {/* 行5: 0(2幅) . ⌫ = */}
            <CalcButton
              label="0"
              onClick={() => dispatch({ type: "INPUT_DIGIT", digit: "0" })}
              className="bg-muted hover:bg-muted/80 col-span-2"
              wide
            />
            <CalcButton
              label="."
              ariaLabel="小数点"
              onClick={() => dispatch({ type: "INPUT_DOT" })}
              className="bg-muted hover:bg-muted/80"
            />
            <CalcButton
              label="⌫"
              ariaLabel="1桁削除"
              onClick={() => dispatch({ type: "BACKSPACE" })}
              className="bg-muted text-muted-foreground hover:bg-muted/80"
            />

            {/* = ボタン（全幅） */}
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
        </div>

        {/* 履歴パネル */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              履歴（{history.length}件）
            </span>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="size-3.5" />
                全削除
              </button>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {history.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                計算履歴がありません
              </div>
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
                      <span className="text-muted-foreground truncate mr-2">
                        {entry.expression}
                      </span>
                      <span className="font-bold tabular-nums text-foreground whitespace-nowrap">
                        = {entry.result}
                      </span>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            履歴をタップすると結果を電卓に読み込みます
          </p>

          {/* キーボードショートカット */}
          <div className="relative flex justify-center">
            {showShortcuts && (
              <div className="absolute bottom-full mb-2 w-64 rounded-lg border border-border bg-background shadow-lg p-3 z-50 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground mb-2">キーボードショートカット</p>
                <div className="space-y-1">
                  <div className="flex justify-between"><span>0〜9</span><span>数字入力</span></div>
                  <div className="flex justify-between"><span>+ - * /</span><span>演算子</span></div>
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
