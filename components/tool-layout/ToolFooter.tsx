import Link from "next/link";

interface ToolFooterProps {
  title: string;
}

export function ToolFooter({ title }: ToolFooterProps) {
  return (
    <footer
      style={{
        marginTop: "auto",
        borderTop: "1px solid var(--th-border)",
        background: "var(--th-bg)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          maxWidth: 672,
          margin: "0 auto",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {/* 左：パンくずナビ */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
              fontWeight: 900, fontSize: 12,
              color: "var(--th-text)", textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            タダ<span style={{ color: "#0ea5e9" }}>tools</span><span style={{ color: "#f9a8d4" }}>.</span>
          </Link>
          <span style={{ color: "var(--th-border)", fontSize: 10 }}>›</span>
          <Link
            href="/tools"
            style={{
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
              fontWeight: 700, fontSize: 11,
              color: "var(--th-text-muted)", textDecoration: "none",
            }}
          >
            一覧
          </Link>
          <span style={{ color: "var(--th-border)", fontSize: 10 }}>›</span>
          <span
            style={{
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
              fontWeight: 700, fontSize: 11,
              color: "var(--th-text-muted)",
            }}
          >
            {title}
          </span>
        </div>

        {/* 右：著作権 + プライバシー */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 10,
            fontFamily: "Quicksand, sans-serif",
            fontWeight: 600, fontSize: 10,
            color: "var(--th-text-muted)",
            letterSpacing: "0.05em",
          }}
        >
          <Link
            href="/privacy"
            style={{ color: "var(--th-text-muted)", textDecoration: "none", opacity: 0.7 }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
          >
            プライバシー
          </Link>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>© 2026 ただただ <span style={{ color: "#f9a8d4" }}>♥</span></span>
        </div>
      </div>
    </footer>
  );
}
