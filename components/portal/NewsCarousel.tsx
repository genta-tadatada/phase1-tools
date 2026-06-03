"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { type NewsItem, formatDate, bannerGradient } from "@/lib/news-data";

function catClass(cat: string) {
  if (cat === "リリース") return "p-cat release";
  if (cat === "お知らせ") return "p-cat notice";
  return "p-cat";
}

export function NewsCarousel({ items }: { items: NewsItem[] }) {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const n = items.length;

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setActive((a) => (a + 1) % n);
    }, 5000);
  }, [n]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const restartTimer = useCallback(() => {
    stopTimer();
    startTimer();
  }, [stopTimer, startTimer]);

  useEffect(() => {
    startTimer();
    return stopTimer;
  }, [startTimer, stopTimer]);

  const prev = () => { setActive((a) => (a - 1 + n) % n); restartTimer(); };
  const next = () => { setActive((a) => (a + 1) % n); restartTimer(); };

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={stopTimer}
      onMouseLeave={startTimer}
    >
      <button className="car-arrow car-prev" onClick={prev} aria-label="前へ" type="button" style={arrowStyle("left")}>←</button>

      <div style={{ position: "relative", overflow: "hidden", padding: "16px 0", maskImage: "linear-gradient(to right, transparent 0, #000 80px, #000 calc(100% - 80px), transparent 100%)", WebkitMaskImage: "linear-gradient(to right, transparent 0, #000 80px, #000 calc(100% - 80px), transparent 100%)" }}>
        <div style={{ position: "relative", height: 280 }}>
          {items.map((item, i) => {
            let rel = (i - active + n) % n;
            if (rel > Math.floor(n / 2)) rel -= n;
            const isActive = rel === 0;
            const absRel = Math.abs(rel);
            const CARD_WIDTH = 460;
            const GAP = 24;
            const step = CARD_WIDTH + GAP;
            const scale   = isActive ? 1 : absRel === 1 ? 0.84 : 0.7;
            const opacity = isActive ? 1 : absRel === 1 ? 0.45 : 0;
            const zIndex  = isActive ? 5 : absRel === 1 ? 3 : 1;
            const tx      = rel * step;

            return (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                onClick={(e) => { if (!isActive) { e.preventDefault(); setActive(i); restartTimer(); } }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 0,
                  width: CARD_WIDTH,
                  maxWidth: "78vw",
                  height: "100%",
                  transform: `translateX(calc(-50% + ${tx}px)) scale(${scale})`,
                  opacity,
                  zIndex,
                  pointerEvents: absRel <= 1 ? "auto" : "none",
                  transition: "transform 0.55s cubic-bezier(0.4,0,0.2,1), opacity 0.55s ease",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{
                  height: "100%",
                  background: "#fff",
                  border: `2px solid ${isActive ? "#ddd6fe" : "#f1ecf3"}`,
                  borderRadius: 22,
                  overflow: "hidden",
                  boxShadow: isActive ? "0 16px 40px -12px rgba(120,80,140,0.3)" : "0 8px 28px -12px rgba(120,80,140,0.18)",
                  display: "flex",
                  flexDirection: "column",
                }}>
                  <div style={{ height: 150, background: item.image && !item.imageContain ? "#fff" : bannerGradient(item.banner.grad), position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: item.imageContain ? "contain" : "cover", zIndex: 1, transform: item.imageZoom ? "scale(1.12)" : undefined }} />
                    ) : (
                      <>
                        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.35) 1.5px, transparent 2px)", backgroundSize: "16px 16px", opacity: 0.5 }} />
                        <span style={{ fontSize: 56, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))", position: "relative", zIndex: 1 }}>{item.banner.icon}</span>
                      </>
                    )}
                  </div>
                  <div style={{ flex: 1, padding: "14px 18px 16px", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: "Quicksand,sans-serif", fontWeight: 700, fontSize: 11, color: "#9a96a8", letterSpacing: "0.06em" }}>{formatDate(item.date)}</span>
                      <span className={catClass(item.category)} style={{ padding: "2px 8px" }}>{item.category}</span>
                    </div>
                    <h3 style={{ fontWeight: 900, fontSize: 15, color: "#1f1d2b", lineHeight: 1.45, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.title}</h3>
                    <p style={{ fontSize: 12, color: "#6b6779", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.summary}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <button className="car-arrow car-next" onClick={next} aria-label="次へ" type="button" style={arrowStyle("right")}>→</button>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`スライド${i + 1}`}
            onClick={() => { setActive(i); restartTimer(); }}
            style={{
              width: i === active ? 24 : 8,
              height: 8,
              borderRadius: 999,
              background: i === active ? "#f9a8d4" : "#f1ecf3",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.25s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function arrowStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 10,
    [side]: 0,
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "#fff",
    border: "2px solid #f1ecf3",
    color: "#1f1d2b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 18px -6px rgba(120,80,140,0.2)",
    fontSize: 18,
    fontWeight: 700,
  };
}
