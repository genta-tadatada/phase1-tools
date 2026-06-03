import Image from "next/image";

interface Props {
  charSize?: number;
  textW?: number;
  textH?: number;
  scale?: number;
  gap?: number;
}

export function TadatadaLogo({
  charSize = 80,
  textW = 168,
  textH = 112,
  scale = 1.0,
  gap = 6,
}: Props) {
  const s = `scale(${scale})`;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap, flexShrink:0 }}>
      <span style={{ display:"inline-block", width:charSize, height:charSize, overflow:"hidden", flexShrink:0 }}>
        <Image
          src="/assets/tadatada-char.png"
          alt="ただただ"
          width={charSize}
          height={charSize}
          style={{ objectFit:"contain", transform:s }}
        />
      </span>
      <span style={{ display:"inline-block", width:textW, height:textH, overflow:"hidden", flexShrink:0 }}>
        <Image
          src="/assets/tadatada-text.png"
          alt=""
          width={textW}
          height={textH}
          style={{ objectFit:"contain", transform:s }}
        />
      </span>
    </span>
  );
}
