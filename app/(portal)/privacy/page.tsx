import type { Metadata } from "next";
import Link from "next/link";
import { TadatadaLogo } from "@/components/shared/TadatadaLogo";
import { GlobalMenu } from "@/components/shared/GlobalMenu";

export const metadata: Metadata = {
  title: "プライバシーポリシー | タダtools",
  robots: { index: true, follow: true },
};

const SECTION_STYLE: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "0.6rem",
};

const H2_STYLE: React.CSSProperties = {
  fontWeight: 800, fontSize: "0.95rem", color: "#1f1d2b", letterSpacing: "0.02em",
};

const P_STYLE: React.CSSProperties = {
  fontSize: "0.875rem", lineHeight: 1.8, color: "#5a5666",
};

const DIVIDER: React.CSSProperties = {
  borderTop: "1px dashed #f1ecf3",
};

export default function PrivacyPage() {
  return (
    <>
      <header className="p-header">
        <div className="p-header-inner md">
          <Link href="/" className="p-breadcrumb">
            <TadatadaLogo />
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
          <div className="p-form-card" style={{ padding: "40px 36px", display: "flex", flexDirection: "column", gap: "2rem" }}>

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>収集する情報について</h2>
              <p style={P_STYLE}>
                当サイトでは、アカウント機能（準備中）においてのみ情報を取得します。
                ツールの利用・閲覧・お問い合わせにあたって、個人情報を収集することはありません。
              </p>
            </section>

            <div style={DIVIDER} />

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>アカウント登録について（Google ログイン）</h2>
              <p style={P_STYLE}>
                アカウント機能は現在準備中です。導入後は Google アカウントによるログインが可能になります。
              </p>
              <p style={P_STYLE}>
                ログイン時に Google から取得する情報は、<strong>ユーザーを識別するための一意のID（sub）のみ</strong>です。
                メールアドレス・ユーザー名・プロフィール画像などは一切取得しません。
              </p>
              <p style={P_STYLE}>
                アカウント作成時には、このサイト専用のユーザー名（ニックネーム）をご自身で設定していただきます。
                取得した識別IDは、ツール設定の保存・デバイス間の同期などの目的にのみ使用し、第三者への提供は行いません。
              </p>
            </section>

            <div style={DIVIDER} />

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>お問い合わせについて</h2>
              <p style={P_STYLE}>
                お問い合わせは X（旧 Twitter）のDMにて受け付けています。
                氏名・メールアドレスなどの個人情報をお伝えいただく必要はありません。
                いただいたメッセージはお問い合わせへの対応のみに使用します。
              </p>
            </section>

            <div style={DIVIDER} />

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>アクセス解析について</h2>
              <p style={P_STYLE}>
                当サイトでは Google Analytics（GA4）を使用してアクセス解析を行っています。
                Google Analytics はトラフィックデータの収集のために Cookie を使用しています。
                このデータは匿名で収集されており、個人を特定するものではありません。
                Cookie を無効にすることで収集を拒否できます。詳細は{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#8b5cf6", textDecoration: "underline" }}>
                  Google のプライバシーポリシー
                </a>
                {" "}をご覧ください。
              </p>
            </section>

            <div style={DIVIDER} />

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>広告について</h2>
              <p style={P_STYLE}>
                当サイトでは、広告配信サービスを利用しています。現在は{" "}
                <strong>忍者AdMax（株式会社忍者）</strong>
                {" "}による広告を掲載しています。また、今後 Google AdSense による広告掲載を予定しています。
              </p>
              <p style={P_STYLE}>
                広告配信事業者は Cookie を使用して、ユーザーの興味に応じた広告を表示することがあります。
                Cookie の使用を無効にする方法については、お使いのブラウザの設定をご確認ください。
              </p>
            </section>

            <div style={DIVIDER} />

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>免責事項</h2>
              <p style={P_STYLE}>
                当サイトの情報は正確性を期しておりますが、内容の正確性・完全性・有用性等についていかなる保証も行いません。
                当サイトの利用により生じた損害については責任を負いかねます。
              </p>
            </section>

            <div style={DIVIDER} />

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>プライバシーポリシーの変更について</h2>
              <p style={P_STYLE}>
                本ポリシーの内容は、法令の改正やサービス内容の変更にともない、予告なく変更することがあります。
                変更後のポリシーは当ページに掲載した時点で効力を生じるものとします。
              </p>
            </section>

            <div style={DIVIDER} />

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>運営者情報</h2>
              <p style={P_STYLE}>
                サイト名: TADATADA（タダtools）<br />
                お問い合わせ: <Link href="/contact" style={{ color: "#8b5cf6", textDecoration: "underline" }}>お問い合わせページ</Link>
              </p>
            </section>

            <p style={{ color: "#9a96a8", fontSize: "0.8rem" }}>制定日: 2026年5月28日</p>
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
