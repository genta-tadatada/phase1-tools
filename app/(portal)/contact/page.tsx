"use client";

import { useState } from "react";
import Link from "next/link";
import { GlobalMenu } from "@/components/shared/GlobalMenu";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitted(true);
    }, 600);
  }

  return (
    <>
      <header className="p-header">
        <div className="p-header-inner md">
          <Link href="/" className="p-breadcrumb">
            <span className="p-brand">TADATADA<span className="p-brand-dot" /></span>
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
            <p className="p-page-sub">ご質問・ご要望・不具合のご連絡など、<br />お気軽にどうぞ。</p>
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
          {submitted ? (
            <div className="p-form-card" style={{ textAlign: "center", padding: "60px 36px" }}>
              <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "#8b5cf6", marginBottom: 12 }}>
                お問い合わせフォームは現在準備中です。
              </p>
              <p style={{ color: "#6b6779" }}>
                ご連絡はX（旧Twitter）などSNSからお願いいたします。
              </p>
            </div>
          ) : (
            <form className="p-form-card" onSubmit={handleSubmit}>
              <div className="p-field">
                <label className="p-field-label" htmlFor="cf-type">
                  お問い合わせの種類
                  <span className="p-field-required">必須</span>
                </label>
                <select id="cf-type" name="type" className="p-select" required defaultValue="">
                  <option value="" disabled>選んでください</option>
                  <option>ご質問</option>
                  <option>機能のリクエスト</option>
                  <option>不具合の報告</option>
                  <option>取材・お仕事のご相談</option>
                  <option>その他</option>
                </select>
              </div>

              <div className="p-field">
                <label className="p-field-label" htmlFor="cf-msg">
                  お問い合わせ内容
                  <span className="p-field-required">必須</span>
                </label>
                <textarea
                  id="cf-msg"
                  name="message"
                  className="p-textarea"
                  placeholder="ご質問やご意見をそのままどうぞ。"
                  required
                />
              </div>

              <div className="p-submit-row">
                <button type="submit" className="p-submit-btn" disabled={submitting}>
                  <span className="p-spark">✦</span>
                  {submitting ? "送信中…" : "送信する"}
                </button>
              </div>
            </form>
          )}
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
