"use client";

/**
 * アカウント状態のReactコンテキスト（アカウント機能 A1）
 *
 * - マウント時に一度 /api/auth/me を確認する。ローカルdev等で失敗したら「未ログイン」に静かに縮退。
 * - status が "member" になった瞬間にツール同期（lib/tool-sync.ts）を起動する。
 * - ニックネーム以外のユーザー識別子は保持しない（サーバが返すのは loggedIn / nickname のみ）。
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  fetchMe,
  requestDeleteAccount,
  requestLogout,
  requestSetNickname,
} from "@/lib/auth";
import {
  clearSyncState,
  onLoginSync,
  pushIfChanged,
  startAutoPush,
} from "@/lib/tool-sync";

export type AuthStatus = "loading" | "guest" | "needsNickname" | "member";

interface AuthContextValue {
  status: AuthStatus;
  nickname: string | null;
  /** /api/auth/me を再確認して状態を更新する */
  refresh: () => Promise<void>;
  /** ニックネームを保存する（成功で member へ）。失敗は throw */
  saveNickname: (nickname: string) => Promise<void>;
  /** ログアウトする（成功で guest へ）。失敗は throw */
  logout: () => Promise<void>;
  /** アカウントと保存データを即時削除する（成功で guest へ）。失敗は throw */
  deleteAccount: () => Promise<void>;
}

const noopAsync = async () => {};

/** Provider未マウント時も画面を壊さないための安全なデフォルト（=未ログイン扱い） */
const AuthContext = createContext<AuthContextValue>({
  status: "guest",
  nickname: null,
  refresh: noopAsync,
  saveNickname: noopAsync,
  logout: noopAsync,
  deleteAccount: noopAsync,
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [nickname, setNickname] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const me = await fetchMe();
    if (!me) {
      setNickname(null);
      setStatus("guest");
      return;
    }
    setNickname(me.nickname);
    setStatus(me.nickname ? "member" : "needsNickname");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // member確定でツール同期を起動。ログアウト等でmemberを抜けたら自動プッシュを解除
  useEffect(() => {
    if (status !== "member") return;
    let cancelled = false;
    const stopAutoPush = startAutoPush();

    void (async () => {
      const outcome = await onLoginSync();
      if (cancelled || outcome.kind !== "conflict") return;
      toast("別の端末に保存したデータがあります", {
        description: "取り込むと、この端末のツール履歴・設定が置き換わります。",
        duration: 15000,
        action: {
          label: "取り込む",
          onClick: () => outcome.importRemote(),
        },
        cancel: {
          label: "この端末を使う",
          onClick: () => {
            void outcome.keepLocal();
          },
        },
      });
    })();

    return () => {
      cancelled = true;
      stopAutoPush();
    };
  }, [status]);

  const saveNickname = useCallback(async (value: string) => {
    const saved = await requestSetNickname(value);
    setNickname(saved);
    setStatus("member");
  }, []);

  const logout = useCallback(async () => {
    // 最新のローカルデータを最善努力でクラウドに残してからログアウトする
    try {
      await pushIfChanged();
    } catch {
      // 同期は「できたら得」。失敗してもログアウトは続行
    }
    await requestLogout();
    clearSyncState();
    setNickname(null);
    setStatus("guest");
  }, []);

  const deleteAccount = useCallback(async () => {
    await requestDeleteAccount();
    clearSyncState();
    setNickname(null);
    setStatus("guest");
  }, []);

  return (
    <AuthContext.Provider
      value={{ status, nickname, refresh, saveNickname, logout, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}
