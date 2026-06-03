import Image from "next/image";
import type { ReactNode, CSSProperties } from "react";

const CHAR_W = 813;
const CHAR_H = 601;
const TEXT_W = 1115;
const TEXT_H = 328;

interface Props {
  /** キャラクター高さ (全ページ共通 default: 52) */
  charHeight?: number;
  /** ただただテキスト高さ (default: 30) */
  textHeight?: number;
  /** 現在ページ名（ただただ下に小さく表示）プレーンテキスト */
  title?: string;
  /** 現在ページ名 JSX版（カラー付きなど）。titleより優先 */
  titleNode?: ReactNode;
  /** ページ名のスタイル上書き（color・fontWeightなど） */
  titleStyle?: CSSProperties;
  /** キャラとテキスト列の間隔 */
  gap?: number;
}

export function TadatadaLogo({
  charHeight = 52,
  textHeight = 30,
  title,
  titleNode,
  titleStyle,
  gap = 8,
}: Props) {
  const charW  = Math.round(charHeight * (CHAR_W / CHAR_H));
  const textW  = Math.round(textHeight * (TEXT_W / TEXT_H));

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap, flexShrink: 0 }}>
      {/* キャラクター（大） */}
      <span style={{ display: "inline-block", width: charW, height: charHeight, overflow: "hidden", flexShrink: 0 }}>
        <Image
          src="/assets/tadatada-char.png"
          alt="ただただ"
          width={charW}
          height={charHeight}
          style={{ objectFit: "contain", width: "100%", height: "100%" }}
        />
      </span>

      {/* ただただテキスト ＋ ページ名（縦並び） */}
      <span style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
        <span style={{ display: "inline-block", width: textW, height: textHeight, overflow: "hidden", flexShrink: 0 }}>
          <Image
            src="/assets/tadatada-text.png"
            alt=""
            width={textW}
            height={textHeight}
            style={{ objectFit: "contain", width: "100%", height: "100%" }}
          />
        </span>
        {(titleNode ?? title) && (
          <span style={{
            fontFamily: "'M PLUS Rounded 1c', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            color: "var(--th-text-muted, #9a96a8)",
            whiteSpace: "nowrap",
            lineHeight: 1,
            ...titleStyle,
          }}>
            {titleNode ?? title}
          </span>
        )}
      </span>
    </span>
  );
}
