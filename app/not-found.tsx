import Link from "next/link";
import Image from "next/image";
import "./(portal)/portal.css";

export default function NotFound() {
  return (
    <div className="portal-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      {/* 装飾blob */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/uploads/kawaii-blob-pink.svg" alt="" aria-hidden style={{ position: "absolute", top: -60, right: -40, width: 280, opacity: 0.35, pointerEvents: "none", animation: "p-float 6s ease-in-out infinite" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/uploads/kawaii-blob-lavender.svg" alt="" aria-hidden style={{ position: "absolute", bottom: -40, left: -60, width: 240, opacity: 0.28, pointerEvents: "none", animation: "p-float 8s ease-in-out 1.5s infinite" }} />

      {/* キャラクター */}
      <div style={{ marginBottom: 24, position: "relative" }}>
        <Image src="/assets/tadatada-char.png" alt="ただただキャラクター" width={120} height={88} style={{ objectFit: "contain" }} />
      </div>

      {/* 404 大数字 */}
      <div
        style={{
          fontFamily: "Quicksand, 'M PLUS Rounded 1c', sans-serif",
          fontWeight: 900,
          fontSize: "clamp(72px,18vw,120px)",
          lineHeight: 1,
          letterSpacing: "-0.04em",
          marginBottom: 16,
          background: "linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 50%, #7dd3fc 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        404
      </div>

      {/* メッセージ */}
      <h1
        style={{
          fontFamily: "'M PLUS Rounded 1c', sans-serif",
          fontWeight: 900,
          fontSize: "clamp(20px,4vw,28px)",
          color: "var(--p-fg)",
          marginBottom: 12,
          letterSpacing: "0.02em",
        }}
      >
        ページが見つかりません
      </h1>
      <p
        style={{
          fontFamily: "'M PLUS Rounded 1c', sans-serif",
          fontSize: 15,
          color: "var(--p-fg-muted)",
          lineHeight: 1.85,
          marginBottom: 36,
          maxWidth: 340,
        }}
      >
        お探しのページは存在しないか、<br />
        移動または削除された可能性があります。
      </p>

      {/* ホームへボタン */}
      <Link href="/" className="p-cta-primary" style={{ fontSize: 15, padding: "14px 28px" }}>
        <span className="p-spark">✦</span>
        トップページへ戻る
        <span className="p-arrow">→</span>
      </Link>

      {/* サブリンク */}
      <div style={{ marginTop: 20, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/tools" style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--p-fg-muted)", textDecoration: "none", borderBottom: "2px solid var(--p-border)", paddingBottom: 2 }}>
          ツール一覧
        </Link>
        <Link href="/news" style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--p-fg-muted)", textDecoration: "none", borderBottom: "2px solid var(--p-border)", paddingBottom: 2 }}>
          お知らせ
        </Link>
      </div>
    </div>
  );
}
