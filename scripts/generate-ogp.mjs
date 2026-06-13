/**
 * OGP画像最終合成スクリプト
 * 背景（ChatGPT生成）+ ツール名テキスト画像（ogp-text-{slug}.png）を合成
 * 実行: node scripts/generate-ogp.mjs
 * 出力: public/assets/ogp-{slug}.jpg (14枚・1200×630・JPEG)
 *
 * 事前準備:
 *   public/assets/ogp-text-{slug}.png を各自用意してから実行
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const assetsDir = path.resolve(__dirname, '../public/assets')

const BG_PATH = 'C:/MY SSD/webdev/ChatGPT Image 2026年6月11日 21_11_33.png'

const OGP_W = 1200
const OGP_H = 630

// 右側クリアエリア: x=640〜1180（キャラと被らない）
const TEXT_LEFT = 640
const TEXT_MAX_W = 520  // 右エリア幅

const tools = [
  'counter', 'stopwatch', 'timer', 'bpm', 'calculator',
  'word-count', 'random-number', 'dice', 'roulette', 'janken',
  'lot', 'group', 'amida', 'tournament', 'slide-bg', 'preset-bg',
]

const bg = await sharp(BG_PATH)
  .resize(OGP_W, OGP_H, { fit: 'fill' })
  .png()
  .toBuffer()

console.log('🖼  OGP最終合成中...\n')

let skipped = 0
for (const slug of tools) {
  const textPath = path.join(assetsDir, `ogp-text-${slug}.png`)
  const outPath  = path.join(assetsDir, `ogp-${slug}.jpg`)

  if (!fs.existsSync(textPath)) {
    console.log(`⏭  ${slug}: ogp-text-${slug}.png がない → スキップ`)
    skipped++
    continue
  }

  // テキスト画像を右エリアに収まるようリサイズ
  const textBuf = await sharp(textPath)
    .resize(TEXT_MAX_W, null, { fit: 'inside' })
    .png()
    .toBuffer()

  const { width: tw, height: th } = await sharp(textBuf).metadata()
  const top = Math.round((OGP_H - (th ?? 180)) / 2)

  await sharp(bg)
    .composite([{ input: textBuf, left: TEXT_LEFT, top }])
    .jpeg({ quality: 90, mozjpeg: false })
    .toFile(outPath)

  const kb = Math.round(fs.statSync(outPath).size / 1024)
  console.log(`✅  ogp-${slug}.jpg  (${kb} KB)`)
}

if (skipped > 0) {
  console.log(`\n⚠️  ${skipped}枚スキップ（ogp-text-*.png が未配置）`)
  console.log('   public/assets/ にファイルを置いてから再実行してください')
} else {
  console.log('\n🎉  全14枚完了！')
}
