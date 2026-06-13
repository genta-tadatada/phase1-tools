/**
 * kawaii 3Dイラストの「クリーン素材」を元素材から生成する。
 *  1) 焼き込みフレーム除去: 外周INSET pxを切り落とす
 *  2) 透け解消: 元素材は本のページ等が半透明。イラスト領域のシルエットを作り、
 *     クリーム地に合成(flatten)して内部を不透明化。シルエット外（影・余白）は透過のまま。
 *     → クリーム地のOGP/サイト上では見た目不変、暗背景でも内部が透けない。
 *  3) 透過余白をトリム
 * 出力: public/assets/kawaii-{book,controller,tools}-clean.png
 * 実行: node scripts/make-clean-assets.mjs
 */
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const assetsDir = path.resolve(__dirname, '../public/assets')

const INSET = 15
const ALPHA_T = 40   // これ以上のalphaを「イラスト本体」とみなす（影・余白は除外）
const CREAM = { r: 253, g: 246, b: 236 }

// シルエット内の閉じた穴を埋める（外周から0領域をBFS、到達しない0=内部穴→255）
function fillHoles(mask, w, h) {
  const ext = new Uint8Array(w * h)
  const stack = []
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return
    const idx = y * w + x
    if (ext[idx] || mask[idx]) return
    ext[idx] = 1; stack.push(idx)
  }
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1) }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y) }
  while (stack.length) {
    const idx = stack.pop(); const x = idx % w, y = (idx - x) / w
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1)
  }
  for (let i = 0; i < w * h; i++) if (!ext[i] && !mask[i]) mask[i] = 255
}

for (const name of ['kawaii-book', 'kawaii-controller', 'kawaii-tools']) {
  const src = path.join(assetsDir, `${name}.png`)
  const m = await sharp(src).metadata()
  // 1) フレーム除去
  const cropped = await sharp(src)
    .extract({ left: INSET, top: INSET, width: m.width - INSET * 2, height: m.height - INSET * 2 })
    .ensureAlpha().png().toBuffer()
  const { info } = await sharp(cropped).raw().toBuffer({ resolveWithObject: true })
  const w = info.width, h = info.height

  // 2) アルファチャンネル抽出 → シルエットマスク（alpha≥T）＋穴埋め
  const alpha = await sharp(cropped).extractChannel(3).raw().toBuffer()
  const mask = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) mask[i] = alpha[i] >= ALPHA_T ? 255 : 0
  fillHoles(mask, w, h)
  const cov = mask.reduce((s, v) => s + (v ? 1 : 0), 0) / (w * h)
  // 1px ぼかしで縁のアンチエイリアス（grayscale PNG化）
  const maskPng = await sharp(Buffer.from(mask), { raw: { width: w, height: h, channels: 1 } })
    .blur(0.8).png().toBuffer()

  // 3) クリーム地に合成 → シルエットalphaを付与（joinChannel）
  const rgb = await sharp(cropped).flatten({ background: CREAM }).removeAlpha().png().toBuffer()
  const final = await sharp(rgb).joinChannel(maskPng).png().toBuffer()
  const out = await sharp(final).trim({ threshold: 6 }).png().toBuffer()
  const om = await sharp(out).metadata()
  await sharp(out).toFile(path.join(assetsDir, `${name}-clean.png`))
  console.log(`✅ ${name}-clean.png  ${om.width}x${om.height}  (silhouette ${(cov * 100).toFixed(0)}%)`)
}
console.log('🎉 クリーン素材生成完了')
