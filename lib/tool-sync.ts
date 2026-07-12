/**
 * 汎用ツール同期層（アカウント機能 A2）
 *
 * 同期対象の localStorage キーを1つのJSONオブジェクトに束ねて、
 * Cloudflare Worker のクラウドセーブ枠（game="tools"）へ丸ごと保存する。
 * キー単位のマージはしない＝バンドル全体で updatedAt 単位の last-write-wins。
 *
 * - 未ログイン時は完全に無効（localStorage は今まで通りローカルのみ）。
 * - 404(no_save) / 401 / ネット失敗は静かに諦める（ローカルは無傷・赤エラーを出さない）。
 *   同期は「できたら得」の位置づけ。
 * - トークン・Cookie・ユーザーIDは扱わない。ログにも出さない。
 */

import { getStorageItem, removeStorageItem, setStorageItem } from "./storage";

/**
 * 同期する localStorage キー（増やすときはここに1行足すだけ）。
 * キー名は各ツールの実ソースの定数と一致させること（推測で書かない）。
 *
 * 除外（意図的に同期しない）:
 * - "phase1-pomodoro-progress" … ポモドーロ進行中の相・サイクル＝一時状態
 * - "phase1-pomodoro-state"    … 旧キー（TimerTool内のマイグレーション元）
 */
export const SYNC_KEYS: readonly string[] = [
  // ── 履歴・記録 ──
  "phase1-counter-state",       // カウンター本体（app/tools/counter/CounterTool.tsx STORAGE_KEY）
  "phase1-counter-events",      // カウンター履歴（同 EVENTS_KEY）
  "phase1-calculator-history",  // 電卓履歴（app/tools/calculator/CalculatorTool.tsx HISTORY_KEY）
  "phase1-janken-stats",        // じゃんけん通算成績（app/tools/janken/JankenTool.tsx STATS_KEY）
  "phase1-timer-daily-focus",   // タイマー今日の集中時間（app/tools/timer/TimerTool.tsx DAILY_FOCUS_KEY）
  // ── 設定・ユーザー入力（別端末でも引き継ぎたいもの）──
  "phase1-janken-settings",     // じゃんけん設定
  "phase1-timer-preferences",   // タイマー設定
  "phase1-pomodoro-settings",   // ポモドーロ設定
  "phase1-bpm-state",           // BPMメトロノーム設定
  "phase1-stopwatch-settings",  // ストップウォッチの名前・色（計測中の状態は保存されない）
  "phase1-amida-settings",      // あみだくじの名前リスト
  "phase1-group-settings",      // グループ分けの名前リスト
  "phase1-lot-settings",        // くじ引き設定
  "phase1-random-state",        // ランダム数字の設定
  "phase1-dice-state",          // サイコロの面数・個数
  "phase1-roulette-v2",         // ルーレットの項目リスト
  "phase1-word-count-v2",       // 文字数カウントの下書き・設定
  "phase1-tournament-last",     // 最後のトーナメント表
];

/** 最後に同期が成立したリモートの updatedAt（epoch秒）。仕様指定のキー名 */
const LAST_SYNC_KEY = "toolsync:updatedAt";
/** 最後にPUTしたバンドルのハッシュ（変更検知＝無駄なPUTの抑制用） */
const PUSHED_HASH_KEY = "toolsync:hash";

const SAVE_URL = "/api/game/tools/save";
/** 1キーの値がこの文字数を超えたら同期から外す（サーバ512KB上限の保護。残りのキーは同期継続） */
const MAX_VALUE_CHARS = 150_000;
/** fetch keepalive のボディ上限（仕様上64KiB）を下回る安全値 */
const KEEPALIVE_MAX_BYTES = 60_000;

type SyncBundle = Record<string, unknown>;

export type LoginSyncOutcome =
  | { kind: "idle" }
  | { kind: "pushed" }
  | {
      kind: "conflict";
      /** リモートを取り込んで localStorage に書き戻し、リロードして反映する */
      importRemote: () => void;
      /** この端末のデータでリモートを上書きする */
      keepLocal: () => Promise<void>;
    };

// ── 内部ヘルパー ────────────────────────────────────────────

/** 存在する同期対象キーだけを束ねる（値はJSONとして解釈できるもののみ） */
function collectBundle(): SyncBundle {
  const bundle: SyncBundle = {};
  if (typeof window === "undefined") return bundle;
  for (const key of SYNC_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw.length > MAX_VALUE_CHARS) continue;
      bundle[key] = JSON.parse(raw);
    } catch {
      // 壊れた値・アクセス不可は黙ってスキップ
    }
  }
  return bundle;
}

/** SYNC_KEYSの順で並べた正規化JSON（内容比較・ハッシュ用） */
function canonicalize(bundle: SyncBundle): string {
  const ordered: SyncBundle = {};
  for (const key of SYNC_KEYS) {
    if (Object.prototype.hasOwnProperty.call(bundle, key)) ordered[key] = bundle[key];
  }
  return JSON.stringify(ordered);
}

/** djb2ベースの軽量ハッシュ（暗号用途ではなく変更検知用） */
function hashOf(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36) + "-" + text.length.toString(36);
}

async function fetchRemote(): Promise<{ updatedAt: number; keys: SyncBundle } | null> {
  try {
    const r = await fetch(SAVE_URL, { credentials: "include" });
    if (!r.ok) return null; // 404(no_save)・401・ローカルdev含む
    const j: unknown = await r.json();
    if (typeof j !== "object" || j === null) return null;
    const { updatedAt, data } = j as { updatedAt?: unknown; data?: unknown };
    if (typeof updatedAt !== "number" || typeof data !== "object" || data === null) return null;
    const keys = (data as { keys?: unknown }).keys;
    if (typeof keys !== "object" || keys === null || Array.isArray(keys)) return null;
    return { updatedAt, keys: keys as SyncBundle };
  } catch {
    return null;
  }
}

async function put(body: string, keepalive: boolean): Promise<number | null> {
  try {
    const r = await fetch(SAVE_URL, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      keepalive,
      body,
    });
    if (!r.ok) return null;
    const j = (await r.json().catch(() => null)) as { updatedAt?: unknown } | null;
    return typeof j?.updatedAt === "number" ? j.updatedAt : Math.floor(Date.now() / 1000);
  } catch {
    return null;
  }
}

/** リモートの値を localStorage に書き戻す（SYNC_KEYS に載っているキーのみ） */
function applyRemoteKeys(keys: SyncBundle): void {
  for (const key of SYNC_KEYS) {
    if (Object.prototype.hasOwnProperty.call(keys, key)) setStorageItem(key, keys[key]);
  }
}

function rememberPushed(canonical: string, updatedAt: number): void {
  setStorageItem(LAST_SYNC_KEY, updatedAt);
  setStorageItem(PUSHED_HASH_KEY, hashOf(canonical));
}

// ── 公開API ────────────────────────────────────────────────

/** ローカルの同期対象キーを束ねてPUT。成功で true（失敗は静かに false） */
export async function pushNow(options?: { keepalive?: boolean }): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const bundle = collectBundle();
  const canonical = canonicalize(bundle);
  const body = JSON.stringify({ keys: bundle });
  const keepalive =
    options?.keepalive === true && new TextEncoder().encode(body).byteLength < KEEPALIVE_MAX_BYTES;
  const updatedAt = await put(body, keepalive);
  if (updatedAt === null) return false;
  rememberPushed(canonical, updatedAt);
  return true;
}

/** 前回PUTから変化があるときだけPUTする（変更検知） */
export async function pushIfChanged(options?: { keepalive?: boolean }): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const canonical = canonicalize(collectBundle());
  const lastHash = getStorageItem<string>(PUSHED_HASH_KEY, "");
  const lastSync = getStorageItem<number>(LAST_SYNC_KEY, 0);
  if (lastSync > 0 && lastHash !== "" && lastHash === hashOf(canonical)) return false;
  return pushNow(options);
}

/**
 * ログイン確定時（member遷移時）の同期。
 * - リモート無し → ローカルを初回アップロード
 * - リモートとローカルが同内容 → 時刻だけ揃えて何もしない
 * - リモートが新しい → 呼び側で取り込み確認UIを出す（conflict）
 *   ※この端末に同期対象データが1つもない場合は失うものがないので黙って取り込む
 * - それ以外（ローカルが最新） → ローカルをPUT
 */
export async function onLoginSync(): Promise<LoginSyncOutcome> {
  if (typeof window === "undefined") return { kind: "idle" };
  const remote = await fetchRemote();
  if (!remote) {
    const pushed = await pushIfChanged();
    return pushed ? { kind: "pushed" } : { kind: "idle" };
  }

  const localBundle = collectBundle();
  const localCanonical = canonicalize(localBundle);
  const remoteCanonical = canonicalize(remote.keys);

  if (localCanonical === remoteCanonical) {
    rememberPushed(localCanonical, remote.updatedAt);
    return { kind: "idle" };
  }

  const importRemote = () => {
    applyRemoteKeys(remote.keys);
    rememberPushed(canonicalize(collectBundle()), remote.updatedAt);
    // 各ツールはマウント時に localStorage を読むため、リロードして確実に反映する
    window.location.reload();
  };

  const lastSync = getStorageItem<number>(LAST_SYNC_KEY, 0);
  if (remote.updatedAt > lastSync) {
    if (Object.keys(localBundle).length === 0) {
      // この端末は空＝上書きされて困るものがない → 確認なしで取り込む
      importRemote();
      return { kind: "idle" };
    }
    return {
      kind: "conflict",
      importRemote,
      keepLocal: async () => {
        await pushNow();
      },
    };
  }

  const pushed = await pushIfChanged();
  return pushed ? { kind: "pushed" } : { kind: "idle" };
}

/**
 * ログイン中の自動プッシュを開始する（visibilitychange(hidden)・pagehide・beforeunload）。
 * 変更があるときだけ送るので頻繁には叩かない。戻り値は解除関数。
 */
export function startAutoPush(): () => void {
  if (typeof window === "undefined") return () => {};
  const onVisibility = () => {
    if (document.visibilityState === "hidden") void pushIfChanged({ keepalive: true });
  };
  const onLeave = () => {
    void pushIfChanged({ keepalive: true });
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onLeave);
  window.addEventListener("beforeunload", onLeave);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onLeave);
    window.removeEventListener("beforeunload", onLeave);
  };
}

/**
 * 同期メタ情報を消す（ログアウト・アカウント削除時）。
 * ツールのデータ本体には触れない。別アカウントで再ログインしたときに
 * 古い同期時刻で他人のリモートを黙って上書きしないための安全策。
 */
export function clearSyncState(): void {
  removeStorageItem(LAST_SYNC_KEY);
  removeStorageItem(PUSHED_HASH_KEY);
}
