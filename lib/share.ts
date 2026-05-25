import LZString from "lz-string";

export const encodeState = <T>(data: T): string => {
  return LZString.compressToEncodedURIComponent(JSON.stringify(data));
};

export const decodeState = <T>(encoded: string): T | null => {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    return JSON.parse(json ?? "");
  } catch {
    return null;
  }
};

export const generateShareUrl = <T>(data: T, paramName = "c"): string => {
  const encoded = encodeState(data);
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set(paramName, encoded);
  return url.toString();
};
