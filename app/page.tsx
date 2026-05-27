import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { NEWS_DATA } from "@/lib/news-data";
import { NewsCarousel } from "@/components/portal/NewsCarousel";
import { GlobalMenu } from "@/components/shared/GlobalMenu";
import "./(portal)/portal.css";

export const metadata: Metadata = {
  title: "TADATADA — すべて、タダで。いますぐ、使える。",
  description: "便利なツール・一問一答クイズ・ブラウザゲームを、タダで、いますぐ。ログイン不要・広告控えめ・完全無料。",
};

export default function PortalPage() {
  const carouselItems = NEWS_DATA.slice(0, 5);

  return (
    <div className="portal-page">
      {/* HEADER */}
      <header className="p-header">
        <div className="p-header-inner">
          <Link href="/" className="p-logo">TADATADA</Link>
          <GlobalMenu activeSection={null} />
        </div>
      </header>

      {/* HERO */}
      <section className="p-hero">
        <img src="/uploads/kawaii-blob-pink.svg" alt="" aria-hidden="true"
          style={{ position: "absolute", top: -40, right: "5%", width: 320, opacity: 0.35, pointerEvents: "none", zIndex: 0 }} />
        <img src="/uploads/kawaii-blob-mint.svg" alt="" aria-hidden="true"
          style={{ position: "absolute", bottom: 60, left: -60, width: 260, opacity: 0.3, pointerEvents: "none", zIndex: 0 }} />

        <div className="p-container">
          <div className="p-hero-inner">
            <div>
              <h1 className="p-hero-title">
                <span className="line">すべて、<span className="hl-pink">タダ</span>で。</span>
                <span className="line">いま<span className="hl-lav">すぐ</span>、使える。</span>
              </h1>
              <p className="p-hero-sub">
                便利なツールや楽しいコンテンツを、<br />
                タダで、いますぐ。
              </p>
              <Link href="#services" className="p-cta-primary">
                <span className="p-spark">✦</span>
                いますぐ使ってみる
                <span className="p-arrow">→</span>
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
              {/* 3D PNGs — 個別配置・それぞれ異なるアニメーション */}
              <Image src="/assets/kawaii-tools.png" alt="" width={170} height={170} priority
                style={{ position: "absolute", top: 18, right: 50, objectFit: "contain", mixBlendMode: "multiply",
                  animation: "p-float 4.6s ease-in-out infinite" }} />
              <Image src="/assets/kawaii-book.png" alt="" width={148} height={148}
                style={{ position: "absolute", top: "42%", left: 0, transform: "translateY(-50%)", objectFit: "contain", mixBlendMode: "multiply",
                  animation: "p-float 5.4s ease-in-out 0.9s infinite" }} />
              <Image src="/assets/kawaii-controller.png" alt="" width={158} height={158}
                style={{ position: "absolute", bottom: 28, right: 10, objectFit: "contain", mixBlendMode: "multiply",
                  animation: "p-float 5.0s ease-in-out 1.7s infinite" }} />
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
                <Image src="/assets/kawaii-tools.png" alt="" width={130} height={130} style={{ objectFit: "contain" }} />
              </div>
              <div className="p-service-name">タダtools</div>
              <p className="p-service-desc">便利なツールをいろいろ集めました。日常や作業に役立つ機能がいっぱい！</p>
              <span className="p-status-badge live">今すぐ使う →</span>
            </Link>
            <a href="#" className="p-service-card lav" aria-disabled="true">
              <div className="p-service-mascot">
                <Image src="/assets/kawaii-book.png" alt="" width={130} height={130} style={{ objectFit: "contain" }} />
              </div>
              <div className="p-service-name">ただただ一問一答</div>
              <p className="p-service-desc">知識を楽しくインプット＆チェック！スキマ時間にサクッと学べます。</p>
              <span className="p-status-badge soon-lav"><span>⏱</span>もうすぐ公開</span>
            </a>
            <a href="#" className="p-service-card pink" aria-disabled="true">
              <div className="p-service-mascot">
                <Image src="/assets/kawaii-controller.png" alt="" width={130} height={130} style={{ objectFit: "contain" }} />
              </div>
              <div className="p-service-name">ただタダgames</div>
              <p className="p-service-desc">カジュアルに遊べるゲームをお届け！ひとりでも、みんなでも楽しめます。</p>
              <span className="p-status-badge soon-pink"><span>⏱</span>もうすぐ公開</span>
            </a>
          </div>
        </div>

        <div className="p-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,42 C360,82 720,12 1080,42 S1440,52 1440,42 L1440,80 L0,80 Z" fill="#f3faf6" opacity="0.5" transform="translate(0,6)"/>
            <path d="M0,36 C360,80 720,8 1080,40 S1440,50 1440,40 L1440,80 L0,80 Z" fill="#f3faf6"/>
          </svg>
        </div>
      </section>

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
                <Image src="/uploads/kawaii-check-circle.svg" alt="" width={32} height={32} />
              </div>
              <div className="p-feat-name">だれでも、すぐに</div>
              <p className="p-feat-desc">難しい設定は一切なし。<br />開いてそのまま使えます。</p>
            </div>
            <div className="p-feat-card">
              <div className="p-feat-icon i-2">
                <Image src="/uploads/kawaii-unlock.svg" alt="" width={32} height={32} />
              </div>
              <div className="p-feat-name">ログイン不要</div>
              <p className="p-feat-desc">アカウント作成なしで<br />すべての機能が使えます。</p>
            </div>
            <div className="p-feat-card">
              <div className="p-feat-icon i-3">
                <Image src="/uploads/kawaii-price-tag-zero.svg" alt="" width={32} height={32} />
              </div>
              <div className="p-feat-name">すべて無料</div>
              <p className="p-feat-desc">隠れた課金は一切なし。<br />ずっとタダで使えます。</p>
            </div>
            <div className="p-feat-card">
              <div className="p-feat-icon i-4">
                <Image src="/uploads/kawaii-megaphone-mute.svg" alt="" width={32} height={32} />
              </div>
              <div className="p-feat-name">広告は控えめに</div>
              <p className="p-feat-desc">ツール使用中は広告を非表示。<br />使うことだけに集中できます。</p>
            </div>
          </div>
        </div>

        <div className="p-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,46 C240,76 480,16 720,40 C960,64 1200,12 1440,40 L1440,80 L0,80 Z" fill="#ffffff" opacity="0.55"/>
            <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="#ffffff"/>
          </svg>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="p-bottom-cta">
        <div className="p-container">
          <div className="p-cta-card">
            <div className="p-cta-mascot left">🌟</div>
            <div className="p-cta-mascot right">🎀</div>
            <div className="p-cta-title">さあ、タダで、使ってみよう。</div>
            <p className="p-cta-sub">使う・学ぶ・遊ぶ、あなたの今日にひとつだけ。</p>
            <Link href="#services" className="p-cta-primary">
              <span className="p-spark">✦</span>
              いますぐ使ってみる
              <span className="p-arrow">→</span>
            </Link>
          </div>
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
        © 2026 ただただ。 <span className="p-heart">♥</span> All rights reserved.
      </footer>
    </div>
  );
}
