import type { Metadata } from "next";
import Link from "next/link";
import { GlobalMenu } from "@/components/shared/GlobalMenu";

export const metadata: Metadata = {
  title: "プライバシーポリシー | タダtools",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <header className="p-header">
        <div className="p-header-inner md">
          <Link href="/" className="p-breadcrumb">
            <span className="p-brand">TADATADA<span className="p-brand-dot" /></span>
            <span className="p-sep">/</span>
            <span className="p-crumb current">プライバシーポリシー</span>
          </Link>
          <GlobalMenu activeSection={null} />
        </div>
      </header>

      <div className="p-page-top">
        <span className="p-sparkle" style={{ top: 50, left: "14%", width: 14, height: 14, background: "#c4b5fd" }} />
        <span className="p-sparkle" style={{ top: 90, right: "18%", width: 10, height: 10, background: "#f9a8d4", animationDelay: "0.6s" }} />
        <span className="p-sparkle" style={{ bottom: 28, left: "22%", width: 11, height: 11, background: "#6ee7b7", animationDelay: "1.2s" }} />

        <section className="p-contact-page-hero">
          <div className="p-container-xs">
            <div className="p-eyebrow lav">PRIVACY POLICY</div>
            <h1 className="p-page-title">プライバシーポリシー<span className="dot">.</span></h1>
            <p className="p-page-sub">当サイトにおける個人情報の取り扱いについて<br />ご説明します。</p>
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
          <div className="p-form-card" style={{ padding: "40px 36px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", fontSize: "0.9rem", lineHeight: 1.8, color: "#3d3a4a" }}>

              <section>
                <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem", color: "#1f1d2b" }}>広告について</h2>
                <p>
                  当サイトでは、広告配信サービス（Google AdSense・忍者AdMax等）を利用した広告を掲載しています。
                  広告配信事業者はCookieを使用して、ユーザーの興味に応じた広告を表示することがあります。
                  Cookieの使用を無効にする方法については、お使いのブラウザの設定をご確認ください。
                  Google の広告に関する詳細は{" "}
                  <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" style={{ color: "#8b5cf6", textDecoration: "underline" }}>
                    Google のポリシーと規約
                  </a>
                  {" "}をご覧ください。
                </p>
              </section>

              <section>
                <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem", color: "#1f1d2b" }}>アクセス解析について</h2>
                <p>
                  当サイトではGoogle Analytics（GA4）を使用してアクセス解析を行っています。
                  Google Analyticsはトラフィックデータの収集のためにCookieを使用しています。
                  このトラフィックデータは匿名で収集されており、個人を特定するものではありません。
                  この機能はCookieを無効にすることで収集を拒否できます。詳細は{" "}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#8b5cf6", textDecoration: "underline" }}>
                    Googleのプライバシーポリシー
                  </a>
                  {" "}をご覧ください。
                </p>
              </section>

              <section>
                <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem", color: "#1f1d2b" }}>お問い合わせフォームについて</h2>
                <p>
                  お問い合わせフォームからご連絡いただく際、お名前・メールアドレス・お問い合わせ内容を取得します。
                  取得した情報はご返信の目的にのみ使用し、第三者への提供は行いません。
                </p>
              </section>

              <section>
                <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem", color: "#1f1d2b" }}>免責事項</h2>
                <p>
                  当サイトの情報は正確性を期しておりますが、内容の正確性・完全性・有用性等についていかなる保証も行いません。
                  当サイトの利用により生じた損害については責任を負いかねます。
                </p>
              </section>

              <section>
                <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem", color: "#1f1d2b" }}>運営者情報</h2>
                <p>
                  サイト名: タダtools<br />
                  お問い合わせ: <Link href="/contact" style={{ color: "#8b5cf6", textDecoration: "underline" }}>お問い合わせページ</Link>
                </p>
              </section>

              <p style={{ color: "#9c9aaa", fontSize: "0.8rem" }}>制定日: 2026年5月28日</p>
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
