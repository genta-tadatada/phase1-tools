"use client";

import Link from "next/link";
import Image from "next/image";

type CtaContext = "tools" | "games" | "quiz";

// ページの性質に合わせた文言（一問一答で「ツール追加」は違和感、の解消）
const COPY: Record<CtaContext, string> = {
  tools: "ほしいツール・機能をリクエスト",
  games: "ほしいゲーム・機能をリクエスト",
  quiz:  "ほしい問題・カテゴリをリクエスト",
};

/**
 * 「リクエスト」への控えめな導線。各セクションのフッター直前に置く。
 * アイコンは作成済みのkawaii-envelope.png（お問い合わせ用）を再利用。
 */
export function RequestCTA({ context = "tools" }: { context?: CtaContext }) {
  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 20px 8px" }}>
      <Link
        href="/contact"
        className="group"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "14px 20px",
          borderRadius: 18,
          border: "1.5px dashed var(--tools-card-border)",
          background: "var(--cat-all-card)",
          fontFamily: "'M PLUS Rounded 1c', sans-serif",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#a78bfa";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--tools-card-border)";
          e.currentTarget.style.transform = "";
        }}
      >
        <Image
          src="/assets/kawaii-envelope.png"
          alt=""
          width={30}
          height={30}
          style={{ flexShrink: 0, objectFit: "contain" }}
        />
        <span style={{ fontWeight: 800, fontSize: 14, color: "var(--th-text)" }}>
          {COPY[context]}
        </span>
        <span aria-hidden style={{ color: "var(--th-text-muted)", fontWeight: 900 }}>→</span>
      </Link>
      <p
        style={{
          textAlign: "center",
          marginTop: 8,
          fontSize: 11.5,
          color: "var(--th-text-muted)",
          fontFamily: "'M PLUS Rounded 1c', sans-serif",
          lineHeight: 1.6,
        }}
      >
        「こんなのが欲しい」をお気軽に。お名前不要・1分で送れます。
      </p>
    </div>
  );
}
