// 簡易スクリーンショット（Opusチェック用）。dev起動中に実行。
// 使い方: node scripts/shot.mjs <url> <out.png> [width]
import { chromium } from 'playwright'

const url = process.argv[2] || 'http://localhost:3000/tools/slide-bg'
const out = process.argv[3] || 'shot.png'
const width = parseInt(process.argv[4] || '420', 10)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width, height: 1500 }, deviceScaleFactor: 2 })

// dev起動待ち（接続できるまでリトライ）
let ok = false
for (let i = 0; i < 20; i++) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 8000 })
    ok = true
    break
  } catch {
    await page.waitForTimeout(1500)
  }
}
if (!ok) { console.log('failed to load', url); await browser.close(); process.exit(1) }

await page.waitForTimeout(1800)
await page.screenshot({ path: out, fullPage: true })
await browser.close()
console.log('shot saved:', out)
