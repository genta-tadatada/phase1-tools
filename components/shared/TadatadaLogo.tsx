import Image from "next/image";

interface Props {
  charSize?: number;
  textW?: number;
  textH?: number;
  scale?: number;
}

export function TadatadaLogo({
  charSize = 64,
  textW = 100,
  textH = 64,
  scale = 1.05,
}: Props) {
  const s = `scale(${scale})`;
  return (
    <>
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
    </>
  );
}
