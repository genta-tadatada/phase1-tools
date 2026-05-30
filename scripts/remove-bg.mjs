/**
 * 白背景のPNGアイコンから背景を除去して透過PNGに変換する
 * 端からのflood-fillで背景白ピクセルのみを透過にする（イラスト内の白は保持）
 *
 * 使い方: node scripts/remove-bg.mjs [ファイル名...]
 * 例: node scripts/remove-bg.mjs icon-timer.png icon-bpm.png
 *     node scripts/remove-bg.mjs (引数なしで全アイコンを処理)
 */

import sharp from "sharp";
import { readdir } from "fs/promises";
import { join, basename } from "path";

const ASSETS_DIR = join(process.cwd(), "public", "assets");
const THRESHOLD = 200; // この値以上のRGBを「背景」とみなす（Gemini生成画像の薄グレー背景に対応）
const TARGET_FILES = process.argv.slice(2);

async function removeBg(filePath) {
  const name = basename(filePath);
  const image = sharp(filePath).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const buf = Buffer.from(data);

  // flood-fill用: 端に接続した白ピクセルを透過にする
  const visited = new Uint8Array(width * height);
  const queue = [];

  const idx = (x, y) => (y * width + x) * channels;
  const isWhite = (x, y) => {
    const i = idx(x, y);
    return buf[i] >= THRESHOLD && buf[i + 1] >= THRESHOLD && buf[i + 2] >= THRESHOLD;
  };
  const enqueue = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const pos = y * width + x;
    if (visited[pos] || !isWhite(x, y)) return;
    visited[pos] = 1;
    queue.push([x, y]);
  };

  // 4辺から開始
  for (let x = 0; x < width; x++) { enqueue(x, 0); enqueue(x, height - 1); }
  for (let y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y); }

  while (queue.length > 0) {
    const [x, y] = queue.pop();
    const i = idx(x, y);
    buf[i + 3] = 0; // alpha = 0（透過）
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  await sharp(buf, { raw: { width, height, channels } })
    .png()
    .toFile(filePath);

  console.log(`✓ ${name}`);
}

async function main() {
  const allFiles = await readdir(ASSETS_DIR);
  const iconFiles = allFiles.filter((f) => f.startsWith("icon-") && f.endsWith(".png"));

  const targets = TARGET_FILES.length > 0
    ? TARGET_FILES
    : iconFiles;

  console.log(`処理対象: ${targets.length}件\n`);

  for (const file of targets) {
    const filePath = join(ASSETS_DIR, file);
    try {
      await removeBg(filePath);
    } catch (e) {
      console.error(`✗ ${file}: ${e.message}`);
    }
  }

  console.log("\n完了。");
}

main();
