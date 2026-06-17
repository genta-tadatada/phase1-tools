import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { NEWS_DATA } from "@/lib/news-data";
import { NewsCarousel } from "@/components/portal/NewsCarousel";
import { GlobalMenu } from "@/components/shared/GlobalMenu";
import { TadatadaLogo } from "@/components/shared/TadatadaLogo";
import "./(portal)/portal.css";

export const metadata: Metadata = {
  title: "ただただ（タダtools）｜無料で使える便利ツール集",
  description:
    "カウンター・タイマー・サイコロ・あみだくじなど、無料で使える便利ツールを集めたサイト「ただただ」。インストール不要でスマホからもPCからもすぐ使えます。",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "https://tadatada.net/",
    title: "ただただ（タダtools）｜無料で使える便利ツール集",
    description:
      "カウンター・タイマー・サイコロ・あみだくじなど、無料で使える便利ツールを集めたサイト「ただただ」。インストール不要でスマホからもPCからもすぐ使えます。",
    type: "website",
  },
};

export default function PortalPage() {
  const carouselItems = NEWS_DATA.slice(0, 5);

  return (
    <div className="portal-page">
      {/* HEADER */}
      <header className="p-header">
        <div className="p-header-inner">
          <Link href="/" className="p-logo">
            <TadatadaLogo title="ホーム" titleStyle={{ color: "#eab308", fontWeight: 900, letterSpacing: "0.05em" }} />
          </Link>
          <GlobalMenu activeSection={null} />
        </div>
      </header>

      {/* HERO */}
      <section className="p-hero">
        <img src="/uploads/kawaii-blob-pink.svg" alt="" aria-hidden="true"
          style={{ position: "absolute", top: -50, right: "4%", width: 340, opacity: 0.4, pointerEvents: "none", zIndex: 0, animation: "p-float 6s ease-in-out infinite" }} />
        <img src="/uploads/kawaii-blob-mint.svg" alt="" aria-hidden="true"
          style={{ position: "absolute", bottom: 60, left: -60, width: 280, opacity: 0.3, pointerEvents: "none", zIndex: 0, animation: "p-float 8s ease-in-out 1.5s infinite" }} />
        <img src="/uploads/kawaii-blob-lavender.svg" alt="" aria-hidden="true"
          style={{ position: "absolute", top: "30%", left: "8%", width: 180, opacity: 0.18, pointerEvents: "none", zIndex: 0, animation: "p-float 7s ease-in-out 0.8s infinite" }} />

        <div className="p-container">
          <div className="p-hero-inner">
            <div>
              <h1 className="p-hero-title">
                <span className="line">すべて、<span className="hl-pink">タダ</span>で。</span>
                <span className="line">いま<span className="hl-lav">すぐ</span>、使える。</span>
              </h1>
              <p className="p-hero-sub">
                便利なツールや楽しいコンテンツを、<br />
                タダで、いますぐ。<br />
                <span style={{ fontSize: "0.88em", opacity: 0.8 }}>ログイン不要・広告控えめ・完全無料。</span>
              </p>
              <Link href="#services" className="p-cta-primary">
                <svg className="p-spark-svg" width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path d="M6.5 0L7.9 5.1L13 6.5L7.9 7.9L6.5 13L5.1 7.9L0 6.5L5.1 5.1Z" fill="white"/>
                </svg>
                いますぐ使ってみる
                <svg className="p-arrow-svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M5.5 3L10.5 8L5.5 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>

            <div className="p-hero-art" aria-label="マスコットイラスト">
              {/* Spark clusters */}
              <div className="p-spark-cluster" style={{ top: 0, left: "38%" }}>
                <div className="p-star" style={{ top: 0, left: 0 }} />
                <div className="p-star p-star-2" style={{ top: 20, left: 24 }} />
                <div className="p-star p-star-3" style={{ top: -8, left: 40 }} />
              </div>
              <div className="p-spark-cluster" style={{ bottom: "30%", left: -8 }}>
                <div className="p-star p-star-2" style={{ top: 0, left: 0 }} />
                <div className="p-star p-star-3" style={{ top: 14, left: 14 }} />
              </div>
              {/* Floating SVG accents */}
              <img src="/uploads/kawaii-star.svg" alt="" aria-hidden="true"
                style={{ position: "absolute", top: 10, left: 20, width: 28, opacity: 0.85, animation: "p-float 4s ease-in-out infinite" }} />
              <img src="/uploads/kawaii-heart.svg" alt="" aria-hidden="true"
                style={{ position: "absolute", bottom: 80, right: 0, width: 36, opacity: 0.8, animation: "p-float 5.5s ease-in-out 0.8s infinite" }} />
              <img src="/uploads/kawaii-rainbow.svg" alt="" aria-hidden="true"
                style={{ position: "absolute", top: 20, left: "50%", width: 60, opacity: 0.6, animation: "p-float 6s ease-in-out 1.4s infinite" }} />
              <img src="/uploads/kawaii-sparkle-accent.svg" alt="" aria-hidden="true"
                style={{ position: "absolute", bottom: 30, left: 10, width: 24, opacity: 0.75, animation: "p-float 3.8s ease-in-out 0.4s infinite" }} />
              {/* 3D PNGs: wrapperにふわっと浮遊アニメ。新素材は枠なし・絵柄が枠いっぱいのため
                  画像側は object-fit: contain のみ（旧来のclip/scale補正は撤去・端の見切れ防止） */}
              <div style={{ position: "absolute", top: 18, right: 50, width: 170, height: 170,
                animation: "p-float 4.6s ease-in-out infinite" }}>
                <Image src="/assets/kawaii-tools-clean.png" alt="" width={170} height={170} priority
                  style={{ objectFit: "contain", transform: "scale(1.14)" }} />
              </div>
              <div style={{ position: "absolute", top: "42%", left: 0, transform: "translateY(-50%)" }}>
                <div style={{ width: 148, height: 148,
                  animation: "p-float 5.4s ease-in-out 0.9s infinite" }}>
                  <Image src="/assets/kawaii-book-clean.png" alt="" width={148} height={148}
                    style={{ objectFit: "contain", transform: "scale(1.14)" }} />
                </div>
              </div>
              <div style={{ position: "absolute", bottom: 28, right: 10, width: 158, height: 158,
                animation: "p-float 5.0s ease-in-out 1.7s infinite" }}>
                <Image src="/assets/kawaii-controller-clean.png" alt="" width={158} height={158}
                  style={{ objectFit: "contain", transform: "scale(1.14)" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,46 C240,76 480,16 720,40 C960,64 1200,12 1440,40 L1440,80 L0,80 Z" fill="#f8f4ff" opacity="0.55"/>
            <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="#f8f4ff"/>
          </svg>
          <span className="p-div-star" style={{ top: 6, left: "14%", width: 12, height: 12, background: "#f9a8d4" }} />
          <span className="p-div-star" style={{ top: 18, right: "18%", width: 9, height: 9, background: "#c4b5fd", animationDelay: "0.6s" }} />
          <span className="p-div-star" style={{ top: 30, left: "38%", width: 8, height: 8, background: "#6ee7b7", animationDelay: "1.2s" }} />
        </div>
      </section>

      {/* NEWS CAROUSEL */}
      <section className="p-news-section">
        <div className="p-container">
          <div className="p-news-head">
            <div>
              <div className="p-news-eyebrow">NEWS</div>
              <h2 className="p-news-title-text">最新のお知らせ</h2>
            </div>
            <Link href="/news" className="p-news-all">一覧を見る →</Link>
          </div>
          <NewsCarousel items={carouselItems} />
        </div>

        <div className="p-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,40 Q180,4 360,40 T720,40 T1080,40 T1440,40 L1440,80 L0,80 Z" fill="#fff6fb" opacity="0.5" transform="translate(0,8)"/>
            <path d="M0,40 Q180,4 360,40 T720,40 T1080,40 T1440,40 L1440,80 L0,80 Z" fill="#fff6fb"/>
          </svg>
          <span className="p-div-star" style={{ top: 6, left: "14%", width: 10, height: 10, background: "#f9a8d4" }} />
          <span className="p-div-star" style={{ top: 10, right: "36%", width: 10, height: 10, background: "#fef08a", animationDelay: "1.8s" }} />
        </div>
      </section>

      {/* SERVICES */}
      <section className="p-services" id="services">
        <div className="p-container">
          <div className="p-section-label">
            <span className="line" />
            <span className="p-section-label-text">Services</span>
            <span className="line" />
          </div>
          <h2 className="p-section-title">
            <span className="deco-tada">タダ</span>で使える、<span className="deco">3</span>つのサービス
          </h2>

          <div className="p-service-grid">
            <Link href="/tools" className="p-service-card live">
              <div className="p-service-mascot">
                <Image src="/assets/kawaii-tools-clean.png" alt="" width={130} height={130}
                  className="p-mascot-img"
                  style={{ objectFit: "contain" }} />
              </div>
              <div className="p-service-name">タダ<span style={{ color:"#0ea5e9" }}>tools</span><span style={{ color:"#f9a8d4" }}>.</span></div>
              <p className="p-service-desc">便利なツールをいろいろ集めました。日常や作業に役立つ機能がいっぱい！</p>
              <span className="p-status-badge live">今すぐ使う →</span>
            </Link>
            <div className="p-service-card lav" aria-disabled="true" style={{ cursor: "default", pointerEvents: "none" }}>
              <div className="p-service-mascot">
                <Image src="/assets/kawaii-book-clean.png" alt="" width={130} height={130}
                  className="p-mascot-img"
                  style={{ objectFit: "contain" }} />
              </div>
              <div className="p-service-name">ただただ一問一答</div>
              <p className="p-service-desc">知識を楽しくインプット＆チェック！スキマ時間にサクッと学べます。</p>
              <span className="p-status-badge dev-lav">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <circle cx="2.5" cy="6" r="1.5" fill="currentColor"/>
                  <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
                  <circle cx="9.5" cy="6" r="1.5" fill="currentColor"/>
                </svg>
                開発中
              </span>
            </div>
            <div className="p-service-card pink" aria-disabled="true" style={{ cursor: "default", pointerEvents: "none" }}>
              <div className="p-service-mascot">
                <Image src="/assets/kawaii-controller-clean.png" alt="" width={130} height={130}
                  className="p-mascot-img"
                  style={{ objectFit: "contain" }} />
              </div>
              <div className="p-service-name">ただタダgames</div>
              <p className="p-service-desc">カジュアルに遊べるゲームをお届け！ひとりでも、みんなでも楽しめます。</p>
              <span className="p-status-badge dev-pink">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <circle cx="2.5" cy="6" r="1.5" fill="currentColor"/>
                  <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
                  <circle cx="9.5" cy="6" r="1.5" fill="currentColor"/>
                </svg>
                開発中
              </span>
            </div>
          </div>
        </div>

        <div className="p-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,42 C360,82 720,12 1080,42 S1440,52 1440,42 L1440,80 L0,80 Z" fill="#f3faf6" opacity="0.5" transform="translate(0,6)"/>
            <path d="M0,36 C360,80 720,8 1080,40 S1440,50 1440,40 L1440,80 L0,80 Z" fill="#f3faf6"/>
          </svg>
        </div>
      </section>

      {/* ソフト分割線 */}
      <div className="p-soft-divider" aria-hidden="true" />

      {/* FEATURES */}
      <section className="p-features">
        <div className="p-container">
          <div className="p-feat-title-wrap">
            <span className="p-deco-tick l" />
            <h2 className="p-feat-title">ここが、ただただ。</h2>
            <span className="p-deco-tick" />
          </div>
          <div className="p-feat-grid">
            <div className="p-feat-card">
              <div className="p-feat-icon i-1">
                <Image src="/uploads/kawaii-sparkle-accent.svg" alt="" width={52} height={52} className="blend" style={{ objectFit: "contain" }} />
              </div>
              <div className="p-feat-name">だれでも、すぐに</div>
              <p className="p-feat-desc">難しい設定は一切なし。<br />開いてそのまま使えます。</p>
            </div>
            <div className="p-feat-card">
              <div className="p-feat-icon i-2">
                <Image src="/uploads/kawaii-padlock.svg" alt="" width={52} height={52} className="blend" style={{ objectFit: "contain" }} />
              </div>
              <div className="p-feat-name">ログイン不要</div>
              <p className="p-feat-desc">アカウント作成なしで、<br />すぐに使い始められます。</p>
            </div>
            <div className="p-feat-card">
              <div className="p-feat-icon i-3">
                <Image src="/uploads/kawaii-tag-free.svg" alt="" width={52} height={52} className="blend" style={{ objectFit: "contain" }} />
              </div>
              <div className="p-feat-name">すべて無料</div>
              <p className="p-feat-desc">隠れた課金は一切なし。<br />ずっとタダで使えます。</p>
            </div>
            <div className="p-feat-card">
              <div className="p-feat-icon i-4">
                <Image src="/uploads/kawaii-desktop-screen.svg" alt="" width={52} height={52} className="blend" style={{ objectFit: "contain" }} />
              </div>
              <div className="p-feat-name">広告は控えめに</div>
              <p className="p-feat-desc">ツール使用中は広告を非表示。<br />使うことだけに集中できます。</p>
            </div>
          </div>
        </div>

        <div className="p-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            {/* 次セクション(ボトムCTA帯)の色で波を塗り、他セクションと同じ波つなぎにする */}
            <defs>
              <linearGradient id="cta-wave-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fbf3fb" />
                <stop offset="50%" stopColor="#f6f2ff" />
                <stop offset="100%" stopColor="#f1fbf6" />
              </linearGradient>
            </defs>
            <path d="M0,46 C240,76 480,16 720,40 C960,64 1200,12 1440,40 L1440,80 L0,80 Z" fill="url(#cta-wave-grad)" opacity="0.55"/>
            <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="url(#cta-wave-grad)"/>
          </svg>
        </div>
      </section>

      {/* BOTTOM CTA — 枠なしのやわらかい全幅帯＋ボタン（Plan B） */}
      <section className="p-bottom-cta">
        <span className="p-cta-spark" style={{ top: "34%", left: "16%", width: 16, height: 16, background: "#f9a8d4" }} />
        <span className="p-cta-spark" style={{ top: "28%", right: "17%", width: 13, height: 13, background: "#6ee7b7", animationDelay: "0.8s" }} />
        <span className="p-cta-spark" style={{ bottom: "28%", left: "24%", width: 10, height: 10, background: "#c4b5fd", animationDelay: "1.4s" }} />
        <span className="p-cta-spark" style={{ bottom: "32%", right: "23%", width: 11, height: 11, background: "#f9a8d4", animationDelay: "2s" }} />
        <div className="p-container">
          <Link href="#services" className="p-cta-primary">
            <svg className="p-spark-svg" width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M6.5 0L7.9 5.1L13 6.5L7.9 7.9L6.5 13L5.1 7.9L0 6.5L5.1 5.1Z" fill="white"/>
            </svg>
            いますぐ使ってみる
            <svg className="p-arrow-svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M5.5 3L10.5 8L5.5 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* DECORATIVE RAILS */}
      <aside className="p-deco-rail left" aria-hidden="true" style={{ position: "fixed" }}>
        <span className="p-dr-item p-dr-orb it-orb" />
        <span className="p-dr-item p-dr-orb it-orb-2" />
        <span className="p-dr-item p-dr-star it-1" />
        <span className="p-dr-item p-dr-cloud it-2" />
        <span className="p-dr-item p-dr-star it-3" />
        <span className="p-dr-item p-dr-blob it-4" />
        <span className="p-dr-item p-dr-heart it-5" />
        <span className="p-dr-item p-dr-star it-6" />
        <span className="p-dr-item p-dr-plus it-7">✦</span>
      </aside>
      <aside className="p-deco-rail right" aria-hidden="true" style={{ position: "fixed" }}>
        <span className="p-dr-item p-dr-orb it-orb" />
        <span className="p-dr-item p-dr-orb it-orb-2" />
        <span className="p-dr-item p-dr-star it-1" />
        <span className="p-dr-item p-dr-cloud it-2" />
        <span className="p-dr-item p-dr-star it-3" />
        <span className="p-dr-item p-dr-blob it-4" />
        <span className="p-dr-item p-dr-heart it-5" />
        <span className="p-dr-item p-dr-star it-6" />
        <span className="p-dr-item p-dr-plus it-7">✦</span>
      </aside>

      {/* FOOTER */}
      <footer className="p-footer">
        <div className="p-footer-inner">
          <div>© 2026 ただただ。 <span className="p-heart">♥</span> All rights reserved.</div>
          <div style={{ display: "flex", gap: 16 }}>
            <Link href="/privacy" style={{ color: "inherit", textDecoration: "none" }}>プライバシーポリシー</Link>
            <Link href="/contact" style={{ color: "inherit", textDecoration: "none" }}>お問い合わせ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
