import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { GlobalMenu } from "@/components/shared/GlobalMenu";

export const metadata: Metadata = {
  title: "お問い合わせ | タダtools",
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return (
    <>
      <style>{`
        .contact-x-link:hover { opacity: 0.8; }
        .contact-gh-link:hover { background: #ede9fe !important; border-color: #c4b5fd !important; }
      `}</style>
      <header className="p-header">
        <div className="p-header-inner md">
          <Link href="/" className="p-breadcrumb">
            <Image src="/assets/tadatada-char.png" alt="ただただ" width={52} height={52} style={{ objectFit: "contain" }} />
            <Image src="/assets/tadatada-text.png" alt="" width={124} height={41} style={{ objectFit: "contain" }} />
            <span className="p-sep">/</span>
            <span className="p-crumb current">お問い合わせ</span>
          </Link>
          <GlobalMenu activeSection={null} />
        </div>
      </header>

      <div className="p-page-top">
        <span className="p-sparkle" style={{ top: 50, left: "14%", width: 14, height: 14, background: "#f9a8d4" }} />
        <span className="p-sparkle" style={{ top: 90, right: "18%", width: 10, height: 10, background: "#c4b5fd", animationDelay: "0.6s" }} />
        <span className="p-sparkle" style={{ bottom: 28, left: "22%", width: 11, height: 11, background: "#6ee7b7", animationDelay: "1.2s" }} />

        <section className="p-contact-page-hero">
          <div className="p-container-xs">
            <div className="p-eyebrow lav">CONTACT</div>
            <h1 className="p-page-title">お問い合わせ<span className="dot">.</span></h1>
            <p className="p-page-sub">ご質問・ご要望・不具合のご連絡など、<br />X（旧Twitter）のDMからお気軽にどうぞ。</p>
          </div>
        </section>

        <div className="p-wave" aria-hidden="true" style={{ position: "relative" }}>
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 70 }}>
            <path d="M0,46 C240,76 480,16 720,40 C960,64 1200,12 1440,40 L1440,80 L0,80 Z" fill="#ffffff" opacity="0.55"/>
            <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="#ffffff"/>
          </svg>
        </div>
      </div>

      <main className="p-form-area">
        <div className="p-container-xs">
          <div className="p-form-card" style={{ padding: "40px 36px", display: "flex", flexDirection: "column", gap: "2rem" }}>

            {/* X DM */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h2 style={{ fontWeight: 800, fontSize: "0.95rem", color: "#1f1d2b", letterSpacing: "0.02em" }}>
                X（旧Twitter）DM
              </h2>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.75, color: "#5a5666" }}>
                最も早くお返事できる方法です。お気軽にご連絡ください。
              </p>
              <a
                href="https://x.com/tadatada_tools"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-x-link"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.6rem",
                  padding: "13px 22px", borderRadius: 14,
                  background: "#000", color: "#fff",
                  fontSize: "0.875rem", fontWeight: 700, textDecoration: "none",
                  alignSelf: "flex-start", transition: "opacity 0.2s",
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                @tadatada_tools に DM
              </a>
            </div>

            <div style={{ borderTop: "1px dashed #f1ecf3" }} />

            {/* GitHub Issues */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h2 style={{ fontWeight: 800, fontSize: "0.95rem", color: "#1f1d2b", letterSpacing: "0.02em" }}>
                GitHub Issues（不具合・機能リクエスト）
              </h2>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.75, color: "#5a5666" }}>
                バグ報告・機能のご要望は GitHub Issues でも受け付けています。
              </p>
              <a
                href="https://github.com/tadatada-tools/phase1-tools/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-gh-link"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.6rem",
                  padding: "13px 22px", borderRadius: 14,
                  background: "#f6f3ff", color: "#6d28d9",
                  border: "2px solid #e9e3ff",
                  fontSize: "0.875rem", fontWeight: 700, textDecoration: "none",
                  alignSelf: "flex-start", transition: "all 0.2s",
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                Issues を開く
              </a>
            </div>

            <div style={{ borderTop: "1px dashed #f1ecf3" }} />

            <p style={{ fontSize: "0.8rem", color: "#9a96a8", lineHeight: 1.7 }}>
              お問い合わせフォームは現在準備中です。
              いただいたご連絡はできる限り対応しますが、返信をお約束するものではありません。
            </p>
          </div>
        </div>
      </main>

      <footer className="p-footer" style={{ background: "#fff" }}>
        <div className="p-footer-inner">
          <div>© 2026 ただただ。 <span className="p-heart">♥</span> All rights reserved.</div>
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>トップへ戻る →</Link>
        </div>
      </footer>
    </>
  );
}
