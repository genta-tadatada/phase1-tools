import Image from "next/image";

// トリミング後の実寸比率（scripts/trim-logos.mjs で生成）
const CHAR_W = 813;
const CHAR_H = 601;
const TEXT_W = 1115;
const TEXT_H = 328;

interface Props {
  /** ロゴの表示高さ(px)。幅はアスペクト比から自動計算。 */
  height?: number;
  gap?: number;
}

export function TadatadaLogo({ height = 44, gap = 8 }: Props) {
  const charW = Math.round(height * (CHAR_W / CHAR_H));
  const textW = Math.round(height * (TEXT_W / TEXT_H));
  const textH = Math.round(height * (TEXT_H / TEXT_H)); // = height

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap, flexShrink: 0 }}>
      <span style={{ display: "inline-block", width: charW, height, overflow: "hidden", flexShrink: 0 }}>
        <Image
          src="/assets/tadatada-char.png"
          alt="ただただ"
          width={charW}
          height={height}
          style={{ objectFit: "contain", width: "100%", height: "100%" }}
        />
      </span>
      <span style={{ display: "inline-block", width: textW, height, overflow: "hidden", flexShrink: 0 }}>
        <Image
          src="/assets/tadatada-text.png"
          alt=""
          width={textW}
          height={height}
          style={{ objectFit: "contain", width: "100%", height: "100%" }}
        />
      </span>
    </span>
  );
}
