"use client";

import { useState } from "react";

const ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT ?? "";

type Status = "idle" | "sending" | "ok" | "error";

export function ContactForm() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  if (!ENDPOINT) {
    return (
      <p style={{ fontSize: "0.82rem", color: "#9a96a8", lineHeight: 1.75 }}>
        お問い合わせフォームは現在準備中です。<br />
        X（旧Twitter）のDMからお気軽にご連絡ください。
      </p>
    );
  }

  if (status === "ok") {
    return (
      <div style={{
        padding: "28px 20px", borderRadius: 16,
        background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>✓</div>
        <p style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#166534", marginBottom: 6 }}>
          送信しました
        </p>
        <p style={{ fontSize: "0.8rem", color: "#4ade80", lineHeight: 1.6 }}>
          メッセージを受け取りました。ありがとうございます。<br />
          返信をお約束するものではありませんが、できる限り対応します。
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!message.trim() || status === "sending") return;
        setStatus("sending");
        try {
          const res = await fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ message }),
          });
          setStatus(res.ok ? "ok" : "error");
        } catch {
          setStatus("error");
        }
      }}
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      <div>
        <label
          htmlFor="contact-msg"
          style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1f1d2b", marginBottom: 6 }}
        >
          お問い合わせ内容
        </label>
        <textarea
          id="contact-msg"
          required
          rows={5}
          maxLength={1000}
          placeholder="ご質問・ご要望・不具合などをご記入ください（1000文字以内）"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "12px 14px", borderRadius: 12,
            border: "2px solid #f1ecf3", background: "#faf9ff",
            fontFamily: "'M PLUS Rounded 1c', sans-serif",
            fontSize: "0.875rem", lineHeight: 1.7, color: "#1f1d2b",
            resize: "vertical", outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => { e.target.style.borderColor = "#c4b5fd"; }}
          onBlur={(e) => { e.target.style.borderColor = "#f1ecf3"; }}
        />
        <p style={{ fontSize: "0.73rem", color: "#9a96a8", marginTop: 4 }}>
          お名前・メールアドレス等の個人情報はお聞きしません。（{message.length} / 1000）
        </p>
      </div>

      {status === "error" && (
        <p style={{
          fontSize: "0.8rem", color: "#ef4444",
          background: "#fef2f2", padding: "10px 14px",
          borderRadius: 10, lineHeight: 1.6,
        }}>
          送信に失敗しました。しばらく経ってから再度お試しください。
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending" || !message.trim()}
        style={{
          padding: "13px 28px", borderRadius: 14,
          background: status === "sending" ? "#c4b5fd" : "#8b5cf6",
          color: "#fff", border: "none",
          fontFamily: "'M PLUS Rounded 1c', sans-serif",
          fontWeight: 700, fontSize: "0.9rem",
          cursor: status === "sending" ? "not-allowed" : "pointer",
          transition: "all 0.2s", alignSelf: "flex-start",
          opacity: !message.trim() ? 0.5 : 1,
        }}
      >
        {status === "sending" ? "送信中…" : "送信する"}
      </button>
    </form>
  );
}
