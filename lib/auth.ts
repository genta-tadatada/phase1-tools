/**
 * 認証APIクライアント（Cloudflare Worker tadatada-auth / 同一オリジン /api/*）
 *
 * - このサイトは static export のため、/api/* は本番 tadatada.net 上の Worker だけが受ける。
 *   ローカル dev では /api/* が存在しない → fetchMe は null を返して「未ログイン」に静かに縮退する。
 * - 全リクエストは credentials:"include"（HttpOnly Cookie 認証）。
 * - トークン・Cookie・ユーザーIDはフロントでは一切扱わない
 *   （サーバが返すのは loggedIn / nickname のみ。ログにも画面にも出さない）。
 */

export type Me = { loggedIn: true; nickname: string | null };

export const NICKNAME_MAX = 20;

/** 制御文字（C0 / DEL / C1）を含むか。Worker側バリデーション（\p{Cc}）と同じ範囲 */
function hasControlChars(value: string): boolean {
  for (const ch of value) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (cp < 0x20 || (cp >= 0x7f && cp <= 0x9f)) return true;
  }
  return false;
}

/** trim後 1〜20文字・制御文字なしなら整形済み文字列を返す。無効なら null */
export function normalizeNickname(raw: string): string | null {
  const value = raw.trim();
  if (value.length < 1 || value.length > NICKNAME_MAX || hasControlChars(value)) return null;
  return value;
}

/** ログイン開始URL。return_to はサイト内の絶対パスのみ許可（オープンリダイレクト防止） */
export function loginUrl(returnTo: string): string {
  const path = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
  return "/api/auth/login?return_to=" + encodeURIComponent(path);
}

/** 未ログイン(401)・ローカルdev(=/apiなし)・ネット障害はすべて null（例外を投げない） */
export async function fetchMe(): Promise<Me | null> {
  try {
    const r = await fetch("/api/auth/me", { credentials: "include" });
    if (!r.ok) return null;
    const j: unknown = await r.json();
    if (typeof j !== "object" || j === null) return null;
    const me = j as { loggedIn?: unknown; nickname?: unknown };
    if (me.loggedIn !== true) return null;
    return { loggedIn: true, nickname: typeof me.nickname === "string" ? me.nickname : null };
  } catch {
    return null;
  }
}

async function post(path: string, body?: unknown): Promise<Response> {
  return fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** 成功で保存後のニックネームを返す。失敗は throw（呼び側でcatchしてモーダルに赤字表示） */
export async function requestSetNickname(nickname: string): Promise<string> {
  const r = await post("/api/auth/nickname", { nickname });
  if (!r.ok) throw new Error("nickname_request_failed");
  const j = (await r.json().catch(() => null)) as { nickname?: unknown } | null;
  return typeof j?.nickname === "string" ? j.nickname : nickname;
}

export async function requestLogout(): Promise<void> {
  const r = await post("/api/auth/logout");
  if (!r.ok) throw new Error("logout_request_failed");
}

export async function requestDeleteAccount(): Promise<void> {
  const r = await post("/api/auth/delete");
  if (!r.ok) throw new Error("delete_request_failed");
}
