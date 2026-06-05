import type { Metadata } from "next";
import Link from "next/link";
import { TadatadaLogo } from "@/components/shared/TadatadaLogo";
import { GlobalMenu } from "@/components/shared/GlobalMenu";
import { ContactForm } from "@/components/portal/ContactForm";

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
          <Link href="/" className="p-logo">
            <TadatadaLogo title="お問い合わせ" titleStyle={{ color: "#8b5cf6", fontWeight: 900, letterSpacing: "0.04em" }} />
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
            <p className="p-page-sub">ご質問・ご要望・不具合のご連絡など、<br />フォームからお気軽にどうぞ。ログイン不要・個人情報なし。</p>
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

            {/* お問い合わせフォーム（メイン） */}
            <ContactForm />

            <div style={{ borderTop: "1px dashed #f1ecf3" }} />

            {/* X DM（サブ手段） */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <h2 style={{ fontWeight: 800, fontSize: "0.85rem", color: "#1f1d2b", letterSpacing: "0.02em" }}>
                直接連絡したい方は
              </h2>
              <p style={{ fontSize: "0.8rem", lineHeight: 1.7, color: "#5a5666" }}>
                X（旧Twitter）のDMでも受け付けています。
              </p>
              <a
                href="https://x.com/info_tadatada"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-x-link"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "10px 18px", borderRadius: 12,
                  background: "#000", color: "#fff",
                  fontSize: "0.8rem", fontWeight: 700, textDecoration: "none",
                  alignSelf: "flex-start", transition: "opacity 0.2s",
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                @info_tadatada に DM
              </a>
            </div>
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
