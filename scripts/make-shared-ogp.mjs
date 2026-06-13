/**
 * 共通OGP生成スクリプト（ポータル / プライバシー / お問い合わせ / お知らせ 用）
 *
 * 方針:
 *  - スクリーンショット流用（非透過・チープ）をやめ、Playwrightで実Webフォント
 *    （M PLUS Rounded 1c）をレンダリングして「タダで。すぐ使える。」の透過テキストを生成。
 *  - そのテキストを sharp で共通ベース画像（ただただ大ロゴ版）に合成。
 *
 * 実行: node scripts/make-shared-ogp.mjs
 * 出力:
 *   public/assets/ogp-text-tagline.png  … 透過テキスト（再利用可）
 *   public/assets/ogp-default.jpg       … 共通OGP（1200×630）
 */

import { chromium } from 'playwright'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const assetsDir = path.resolve(__dirname, '../public/assets')

// 共通OGPのベース（ただただロゴが大きい版）
const BG_PATH = 'C:/MY SSD/webdev/ChatGPT Image 2026年6月11日 20_53_41.png'

const OGP_W = 1200
const OGP_H = 630

// ── 1. Playwrightで透過テキストを生成 ───────────────────────────────
const html = `<!doctype html><html><head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@800;900&display=swap" rel="stylesheet">
<style>
  /* web（portal.css）と同一配色：タダ=pink-500+pink-200下線 / すぐ=lav-500+lav-200下線 / 他=fg(#1f1d2b) */
  html,body{margin:0;padding:0;background:transparent;}
  #t{display:inline-block;padding:34px 42px;
     font-family:'M PLUS Rounded 1c',sans-serif;font-weight:900;
     line-height:1.14;white-space:nowrap;color:#1f1d2b;}
  .l{font-size:154px;letter-spacing:0.004em;}
  .pink{color:#ec4899;}
  .lav{color:#8b5cf6;}
  .u{position:relative;display:inline-block;}
  .u::after{content:"";position:absolute;left:-3%;right:-3%;bottom:14px;height:20px;
    border-radius:10px;transform:skewX(-8deg);z-index:-1;}
  .u-pink::after{background:#fbcfe8;}
  .u-lav::after{background:#ddd6fe;}
</style></head>
<body><div id="t">
  <div class="l"><span class="u u-pink pink">タダ</span>で。</div>
  <div class="l"><span class="u u-lav lav">すぐ</span>使える。</div>
</div></body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(300)
const el = await page.$('#t')
const textPng = await el.screenshot({ omitBackground: true })
await browser.close()

await sharp(textPng).toFile(path.join(assetsDir, 'ogp-text-tagline.png'))
console.log('✅ ogp-text-tagline.png（透過テキスト）生成')

// ── 2. ベース画像に合成 ─────────────────────────────────────────────
const bg = await sharp(BG_PATH).resize(OGP_W, OGP_H, { fit: 'fill' }).png().toBuffer()

// 右側の余白（マスコットの右）に中央寄せ。キャラと被らず一目で読めるサイズに
const textBuf = await sharp(textPng).resize(560, null, { fit: 'inside' }).png().toBuffer()
const { width: tw, height: th } = await sharp(textBuf).metadata()

const rightCenter = Math.round(OGP_W * 0.74) // 右半分の中央あたり
const left = Math.round(rightCenter - (tw ?? 560) / 2)
const top = Math.round((OGP_H - (th ?? 300)) / 2)

const composed = await sharp(bg)
  .composite([{ input: textBuf, left, top }])
  .png()
  .toBuffer()

// ベース画像は角丸カード（四隅が黒）。他セクションOGPと揃え、四隅をクリームで埋め完全な四角にする。
const CREAM = { r: 253, g: 246, b: 238 }
const R = 52  // 角丸＋枠ストロークを完全にクリームで覆える半径（四隅は無地なので安全）
const roundMask = Buffer.from(
  `<svg width="${OGP_W}" height="${OGP_H}"><rect x="0" y="0" width="${OGP_W}" height="${OGP_H}" rx="${R}" ry="${R}" fill="#fff"/></svg>`
)
const masked = await sharp(composed).ensureAlpha()
  .composite([{ input: roundMask, blend: 'dest-in' }])  // 角丸の外側を透明化
  .png().toBuffer()
await sharp({ create: { width: OGP_W, height: OGP_H, channels: 3, background: CREAM } })
  .composite([{ input: masked }])  // クリーム地に重ねる → 四隅がクリームの四角に
  .jpeg({ quality: 90 })
  .toFile(path.join(assetsDir, 'ogp-default.jpg'))

console.log('🎉 ogp-default.jpg（共通OGP・四角）生成完了')
