import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { NEWS_DATA, formatDate, bannerGradient } from "@/lib/news-data";
import { PortalSiteNav } from "@/components/portal/PortalSiteNav";

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return NEWS_DATA.map((n) => ({ id: n.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = NEWS_DATA.find((n) => n.id === id);
  if (!item) return { title: "記事が見つかりません — TADATADA" };
  return { title: `${item.title} — TADATADA`, description: item.summary };
}

function catClass(cat: string) {
  if (cat === "リリース") return "p-detail-cat release";
  if (cat === "お知らせ") return "p-detail-cat notice";
  return "p-detail-cat";
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;
  const idx = NEWS_DATA.findIndex((n) => n.id === id);
  if (idx < 0) notFound();

  const item = NEWS_DATA[idx];
  const prev = idx > 0 ? NEWS_DATA[idx - 1] : null;
  const next = idx < NEWS_DATA.length - 1 ? NEWS_DATA[idx + 1] : null;
  const paragraphs = item.body.split(/\n\n+/);

  return (
    <>
      <header className="p-header">
        <div className="p-header-inner md">
          <div className="p-breadcrumb">
            <Link href="/portal" className="p-brand" style={{ textDecoration: "none", color: "inherit" }}>
              TADATADA<span className="p-brand-dot" />
            </Link>
            <span className="p-sep">/</span>
            <Link href="/news" className="p-crumb">お知らせ</Link>
            <span className="p-sep">/</span>
            <span className="p-crumb current">#{item.id}</span>
          </div>
          <PortalSiteNav currentPath="/news" />
        </div>
      </header>

      <main>
        <div className="p-detail-wrap">
          <span className="p-sparkle" style={{ top: 30, left: "6%", width: 14, height: 14, background: "#f9a8d4" }} aria-hidden="true" />
          <span className="p-sparkle" style={{ top: 80, right: "8%", width: 10, height: 10, background: "#c4b5fd", animationDelay: "0.6s" }} aria-hidden="true" />
          <span className="p-sparkle" style={{ bottom: 100, left: "4%", width: 12, height: 12, background: "#6ee7b7", animationDelay: "1.2s" }} aria-hidden="true" />

          <div className="p-container-sm">
            <article className="p-detail-card">
              <div className="p-detail-meta">
                <span className="p-detail-date">{formatDate(item.date)}</span>
                <span className={catClass(item.category)}>{item.category}</span>
              </div>
              <h1 className="p-detail-title">{item.title}</h1>
              <div className="p-detail-banner" style={{ background: bannerGradient(item.banner.grad) }}>
                <span className="p-detail-banner-icon">{item.banner.icon}</span>
              </div>
              <div className="p-detail-body">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div className="p-detail-footer">
                {prev ? (
                  <Link href={`/news/${prev.id}`} className="p-nav-link">← 次の記事</Link>
                ) : (
                  <span className="p-nav-link disabled">← 次の記事</span>
                )}
                <Link href="/news" className="p-nav-link" style={{ borderColor: "#ddd6fe", color: "#8b5cf6" }}>一覧へ</Link>
                {next ? (
                  <Link href={`/news/${next.id}`} className="p-nav-link">前の記事 →</Link>
                ) : (
                  <span className="p-nav-link disabled">前の記事 →</span>
                )}
              </div>
            </article>
          </div>
        </div>
      </main>

      <footer className="p-footer" style={{ background: "#ffffff" }}>
        <div className="p-footer-inner">
          <div>© 2026 ただただ。 <span className="p-heart">♥</span> All rights reserved.</div>
          <Link href="/portal" style={{ color: "inherit", textDecoration: "none" }}>トップへ戻る →</Link>
        </div>
      </footer>
    </>
  );
}
