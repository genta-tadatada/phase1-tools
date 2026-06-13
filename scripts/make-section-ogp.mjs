/**
 * 各セクション（tools / quiz / games）のOGPを生成。
 * web項目名のデザイン（ロゴ配色）＋横のkawaii 3Dイラストで構成。
 *
 * 品質方針（2026-06-13改訂）:
 *  - イラストは枠線除去済みの「-clean」素材を使用（`kawaii-*-clean.png`／make-clean-assets由来）
 *  - 拡大しない（withoutEnlargement）→ かすれ防止。テキストはDSF2→1200×630ダウンスケールでクッキリ
 *  - ロゴ文字＋イラストを1グループとして中央寄せ → 文字数が少ないtoolsでも中央に空白ができない
 *  - ロゴ幅を実測し、グループが収まるよう自動縮小 → イラストへの文字被り防止
 *
 * 実行: dev起動中(:3000)に `node scripts/make-section-ogp.mjs`
 * 出力: public/assets/ogp-{tools,quiz,games}.jpg（1200×630）
 */
import { chromium } from 'playwright'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const assetsDir = path.resolve(__dirname, '../public/assets')
const ORIGIN = 'http://localhost:3000'

const W = 1200, H = 630
const CREAM = '#fdf6ec'
const ART_W = 268        // イラスト表示の最大幅（clean素材は約220px→拡大しない）
const GAP = 60           // ロゴとイラストの間隔
const MIN_MARGIN = 84    // 左右の最小余白

const sections = [
  {
    slug: 'tools',
    mark: `<span style="color:#1f1d2b">タダ</span><span style="color:#0ea5e9">tools</span><span style="color:#f9a8d4">.</span>`,
    sub: '便利な無料ツール集',
    icon: 'kawaii-tools-clean.png',
    blob: 'kawaii-blob-mint.svg',
  },
  {
    slug: 'quiz',
    mark: `<span style="color:#1f1d2b">ただただ</span><span style="color:#7c3aed">一問</span><span style="color:#a78bfa">一答</span><span style="color:#fcd34d">.</span>`,
    sub: 'サクサク解ける一問一答',
    icon: 'kawaii-book-clean.png',
    blob: 'kawaii-blob-lavender.svg',
  },
  {
    slug: 'games',
    mark: `<span style="color:#1f1d2b">ただ</span><span style="color:#fb7185">タダ</span><span style="color:#ec4899">games</span><span style="color:#a78bfa">.</span>`,
    sub: 'ブラウザで遊べる無料ゲーム',
    icon: 'kawaii-controller-clean.png',
    blob: 'kawaii-blob-pink.svg',
  },
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })

for (const s of sections) {
  // ── 1. イラスト整形（clean素材をクリーム合成→トリム→拡大せずリサイズ） ──
  const artBuf = await sharp(path.join(assetsDir, s.icon))
    .flatten({ background: CREAM })
    .trim({ threshold: 8 })
    .resize({ width: ART_W, withoutEnlargement: true })
    .toBuffer()
  const artMeta = await sharp(artBuf).metadata()
  const artTop = Math.round((H - artMeta.height) / 2)

  // ── 2. グループ(ロゴ+間隔+イラスト)が収まるようロゴ最大幅を決定 ──
  const maxMarkW = W - MIN_MARGIN * 2 - GAP - artMeta.width

  const html = `<!doctype html><html><head><meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@700;900&display=swap" rel="stylesheet">
  <style>
    html,body{margin:0;padding:0;}
    #c{width:${W}px;height:${H}px;background:${CREAM};position:relative;overflow:hidden;
       font-family:'M PLUS Rounded 1c',sans-serif;}
    .blob{position:absolute;pointer-events:none;}
    .mark{position:absolute;top:50%;transform:translateY(-50%);}
    .wm{font-weight:900;font-size:112px;line-height:1.08;letter-spacing:0.01em;white-space:nowrap;}
    .sub{font-weight:700;font-size:32px;color:#6b6779;margin-top:20px;white-space:nowrap;}
  </style></head>
  <body><div id="c">
    <img class="blob" src="${ORIGIN}/uploads/${s.blob}" style="top:-150px;right:-50px;width:260px;opacity:.40">
    <img class="blob" src="${ORIGIN}/uploads/kawaii-blob-lavender.svg" style="bottom:-80px;left:-80px;width:300px;opacity:.26">
    <div class="mark" id="mark" style="left:${MIN_MARGIN}px"><div class="wm" id="wm">${s.mark}</div><div class="sub">${s.sub}</div></div>
  </div></body></html>`

  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)

  // ロゴ自動縮小→グループ幅を実測→中央寄せの左位置を確定
  const { markLeft, artLeft } = await page.evaluate(({ maxMarkW, W, GAP, artW, MIN_MARGIN }) => {
    const wm = document.getElementById('wm')
    const mark = document.getElementById('mark')
    let fs = 112
    wm.style.fontSize = fs + 'px'
    while (wm.scrollWidth > maxMarkW && fs > 56) { fs -= 2; wm.style.fontSize = fs + 'px' }
    const markW = Math.max(wm.scrollWidth, mark.querySelector('.sub').scrollWidth)
    const groupW = markW + GAP + artW
    let left = Math.round((W - groupW) / 2)
    if (left < MIN_MARGIN) left = MIN_MARGIN
    mark.style.left = left + 'px'
    return { markLeft: left, artLeft: left + markW + GAP }
  }, { maxMarkW, W, GAP, artW: artMeta.width, MIN_MARGIN })
  await page.waitForTimeout(250)

  const baseShot = await page.$('#c').then((el) => el.screenshot({ type: 'png' })) // 2400×1260
  const base = await sharp(baseShot).resize(W, H).png().toBuffer()                 // ダウンスケールでクッキリ

  await sharp(base)
    .composite([{ input: artBuf, left: Math.round(artLeft), top: artTop }])
    .jpeg({ quality: 92 })
    .toFile(path.join(assetsDir, `ogp-${s.slug}.jpg`))
  console.log(`✅ ogp-${s.slug}.jpg  (mark@${markLeft}, art@${Math.round(artLeft)} ${artMeta.width}x${artMeta.height})`)
}

await browser.close()
console.log('🎉 セクションOGP生成完了')
