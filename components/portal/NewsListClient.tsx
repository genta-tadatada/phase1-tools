"use client";

import { useState } from "react";
import Link from "next/link";
import { type NewsItem, formatDate, bannerGradient } from "@/lib/news-data";

const PER_PAGE = 6;
const CATEGORIES = ["すべて", "リリース", "アップデート", "お知らせ"];

function catClass(cat: string) {
  if (cat === "リリース") return "p-cat release";
  if (cat === "お知らせ") return "p-cat notice";
  return "p-cat";
}

export function NewsListClient({ allNews }: { allNews: NewsItem[] }) {
  const [currentCat, setCurrentCat] = useState("すべて");
  const [page, setPage] = useState(1);

  const filtered = currentCat === "すべて" ? allNews : allNews.filter((n) => n.category === currentCat);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  function handleCat(cat: string) {
    setCurrentCat(cat);
    setPage(1);
  }

  return (
    <>
      {/* Filters */}
      <div className="p-container-md">
        <div className="p-filters">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`p-filter-btn${currentCat === cat ? " active" : ""}`}
              onClick={() => handleCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="p-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,46 C240,76 480,16 720,40 C960,64 1200,12 1440,40 L1440,80 L0,80 Z" fill="#ffffff" opacity="0.55"/>
            <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="#ffffff"/>
          </svg>
        </div>
      </div>

      {/* News grid */}
      <div className="p-list-area">
        <div className="p-container-md">
          <div className="p-news-list">
            {pageItems.map((item) => (
              <Link key={item.id} href={`/news/${item.id}`} className="p-news-item">
                <div
                  className={`p-item-banner${item.image ? " has-image" : ""}`}
                  style={{ background: item.image && !item.imageContain ? "#fff" : bannerGradient(item.banner.grad) }}
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: item.imageContain ? "contain" : "cover", zIndex: 1 }} />
                  ) : (
                    <span className="p-item-banner-icon">{item.banner.icon}</span>
                  )}
                </div>
                <div className="p-item-body">
                  <div className="p-item-meta">
                    <span className="p-item-date">{formatDate(item.date)}</span>
                    <span className={catClass(item.category)}>{item.category}</span>
                  </div>
                  <h2 className="p-item-title">{item.title}</h2>
                  <p className="p-item-summary">{item.summary}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <nav className="p-pagination" aria-label="ページ">
            <button
              type="button"
              className="p-page-btn"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="前のページ"
            >←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((i) => (
              <button
                key={i}
                type="button"
                className={`p-page-btn${i === currentPage ? " active" : ""}`}
                onClick={() => setPage(i)}
              >{i}</button>
            ))}
            <button
              type="button"
              className="p-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="次のページ"
            >→</button>
            <span className="p-page-info">{currentPage} / {totalPages}</span>
          </nav>
        </div>
      </div>
    </>
  );
}
