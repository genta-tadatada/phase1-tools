import Link from "next/link";

interface ToolFooterProps {
  title: string;
}

export function ToolFooter({ title }: ToolFooterProps) {
  return (
    <footer style={{
      borderTop: "1px solid var(--th-border)",
      padding: "24px",
      marginTop: "auto",
    }}>
      <div style={{
        maxWidth: 672,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        {/* 左：ロゴ + 現在地 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--th-text-muted)" }}>
          <Link href="/" style={{ textDecoration: "none", fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 900, fontSize: 13, color: "var(--th-text)" }}>
            タダ<span style={{ color: "#0ea5e9" }}>tools</span><span style={{ color: "#f9a8d4" }}>.</span>
          </Link>
          <span style={{ color: "var(--th-border)" }}>／</span>
          <span style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 700 }}>{title}</span>
        </div>

        {/* 右：著作権 */}
        <div style={{
          fontFamily: "Quicksand, sans-serif",
          fontWeight: 600,
          fontSize: 11,
          color: "var(--th-text-muted)",
          letterSpacing: "0.06em",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <Link href="/privacy" style={{ color: "var(--th-text-muted)", textDecoration: "none", opacity: 0.8 }}>
            プライバシー
          </Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>© 2026 ただただ <span style={{ color: "#f9a8d4" }}>♥</span></span>
        </div>
      </div>
    </footer>
  );
}
