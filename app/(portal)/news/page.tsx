import type { Metadata } from "next";
import Link from "next/link";
import { TadatadaLogo } from "@/components/shared/TadatadaLogo";
import { NEWS_DATA } from "@/lib/news-data";
import { NewsListClient } from "@/components/portal/NewsListClient";
import { GlobalMenu } from "@/components/shared/GlobalMenu";
import { DarkModeToggle } from "@/components/tool-layout/DarkModeToggle";

export const metadata: Metadata = {
  title: "お知らせ — TADATADA",
  description: "TADATADAのアップデート・リリース情報をお届けします。",
};

export default function NewsPage() {
  return (
    <>
      <header className="p-header">
        <div className="p-header-inner md">
          <Link href="/" className="p-breadcrumb">
            <TadatadaLogo />
            <span className="p-sep">/</span>
            <span className="p-page-tag">お知らせ</span>
          </Link>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <DarkModeToggle />
            <GlobalMenu activeSection={null} />
          </div>
        </div>
      </header>

      <div className="p-page-top">
        <span className="p-sparkle" style={{ top: 60, left: "12%", width: 14, height: 14, background: "#f9a8d4" }} />
        <span className="p-sparkle" style={{ top: 90, right: "18%", width: 10, height: 10, background: "#c4b5fd", animationDelay: "0.6s" }} />
        <span className="p-sparkle" style={{ bottom: 30, left: "18%", width: 12, height: 12, background: "#6ee7b7", animationDelay: "1.2s" }} />

        <section className="p-page-hero">
          <div className="p-container-md">
            <div className="p-eyebrow">NEWS</div>
            <h1 className="p-page-title">お知らせ<span className="dot">.</span></h1>
            <p className="p-page-sub">アップデート・リリース情報をお届けします。</p>
          </div>
        </section>

        <NewsListClient allNews={NEWS_DATA} />
      </div>

      <footer className="p-footer" style={{ marginTop: 36 }}>
        <div className="p-footer-inner">
          <div>© 2026 ただただ。 <span className="p-heart">♥</span> All rights reserved.</div>
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>トップへ戻る →</Link>
        </div>
      </footer>
    </>
  );
}
