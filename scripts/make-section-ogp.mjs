/**
 * 各セクション（tools / quiz / games）のホーム用OGPを生成。
 * web項目名のデザイン（ロゴ配色）＋横のkawaiiイラストで構成。
 * Playwrightで1200×630のHTMLをそのままレンダリング→JPEG。
 * 実行: dev起動中に `node scripts/make-section-ogp.mjs`
 * 出力: public/assets/ogp-{tools,quiz,games}.jpg
 */
import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const assetsDir = path.resolve(__dirname, '../public/assets')
const ORIGIN = 'http://localhost:3000'

const sections = [
  {
    slug: 'tools',
    mark: `<span style="color:#1f1d2b">タダ</span><span style="color:#0ea5e9">tools</span><span style="color:#f9a8d4">.</span>`,
    sub: '便利な無料ツール集',
    icon: 'kawaii-tools.png',
    blob: 'kawaii-blob-mint.svg',
  },
  {
    slug: 'quiz',
    mark: `<span style="color:#1f1d2b">ただただ</span><span style="color:#7c3aed">一問</span><span style="color:#a78bfa">一答</span><span style="color:#fcd34d">.</span>`,
    sub: 'サクサク解ける一問一答',
    icon: 'kawaii-book.png',
    blob: 'kawaii-blob-lavender.svg',
  },
  {
    slug: 'games',
    mark: `<span style="color:#1f1d2b">ただ</span><span style="color:#fb7185">タダ</span><span style="color:#ec4899">games</span><span style="color:#a78bfa">.</span>`,
    sub: 'ブラウザで遊べる無料ゲーム',
    icon: 'kawaii-controller.png',
    blob: 'kawaii-blob-pink.svg',
  },
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1.5 })

for (const s of sections) {
  const html = `<!doctype html><html><head><meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@700;900&display=swap" rel="stylesheet">
  <style>
    html,body{margin:0;padding:0;}
    #c{width:1200px;height:630px;background:#fdf6ec;position:relative;overflow:hidden;
       font-family:'M PLUS Rounded 1c',sans-serif;}
    .blob{position:absolute;pointer-events:none;}
    .mark{position:absolute;left:84px;top:50%;transform:translateY(-50%);}
    .mark .wm{font-weight:900;font-size:118px;line-height:1.08;letter-spacing:0.01em;white-space:nowrap;}
    .mark .sub{font-weight:700;font-size:33px;color:#6b6779;margin-top:20px;}
    .art{position:absolute;right:96px;top:50%;transform:translateY(-50%);width:300px;height:300px;object-fit:contain;}
  </style></head>
  <body><div id="c">
    <img class="blob" src="${ORIGIN}/uploads/${s.blob}" style="top:-90px;right:-50px;width:380px;opacity:.42">
    <img class="blob" src="${ORIGIN}/uploads/kawaii-blob-lavender.svg" style="bottom:-70px;left:-70px;width:300px;opacity:.28">
    <div class="mark"><div class="wm">${s.mark}</div><div class="sub">${s.sub}</div></div>
    <img class="art" src="${ORIGIN}/assets/${s.icon}">
  </div></body></html>`

  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)
  const el = await page.$('#c')
  await el.screenshot({ path: path.join(assetsDir, `ogp-${s.slug}.jpg`), type: 'jpeg', quality: 90 })
  console.log(`✅ ogp-${s.slug}.jpg`)
}

await browser.close()
console.log('🎉 セクションOGP生成完了')
