/**
 * プレゼン背景の「いる/いらない」選定コマンド。
 *
 *   一覧表示:   node scripts/curate-bg.mjs
 *   削除:       node scripts/curate-bg.mjs S7 S8 #12 22 P5
 *                 S<n>=スタイル / P<n>=配色 / #<n> または <n>=プリセット
 *
 * STYLES/PALETTES(lib/slideEngine.ts) と PRESETS(lib/slidePresets.ts) の該当行を削除する。
 * スタイルは一覧(STYLES)から外すだけで drawBackground 本体は残す（presetが参照していても安全）。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')        // phase1-tools
const ENG = path.join(ROOT, 'lib/slideEngine.ts')
const PRE = path.join(ROOT, 'lib/slidePresets.ts')

function blockRange(lines, marker) {
  const s = lines.findIndex((l) => l.includes(marker))
  let e = s
  while (e < lines.length && !lines[e].includes('];')) e++
  return [s, e]
}
function itemsInRange(lines, s, e, keyName, nameKey) {
  const out = []
  for (let i = s; i <= e; i++) {
    const m = lines[i].match(new RegExp(keyName + ': "([^"]+)"'))
    if (!m) continue
    const nm = lines[i].match(new RegExp(nameKey + ': "([^"]+)"'))
    out.push({ key: m[1], name: nm ? nm[1] : m[1], line: i })
  }
  return out
}

function loadAll() {
  const engLines = fs.readFileSync(ENG, 'utf8').split('\n')
  const preLines = fs.readFileSync(PRE, 'utf8').split('\n')
  const [ss, se] = blockRange(engLines, 'export const STYLES')
  const [ps, pe] = blockRange(engLines, 'export const PALETTES')
  const [rs, re] = blockRange(preLines, 'export const PRESETS')
  return {
    engLines, preLines,
    styles: itemsInRange(engLines, ss, se, 'key', 'label'),
    palettes: itemsInRange(engLines, ps, pe, 'key', 'name'),
    presets: itemsInRange(preLines, rs, re, 'id', 'name'),
  }
}

const { engLines, preLines, styles, palettes, presets } = loadAll()
const args = process.argv.slice(2)

if (args.length === 0) {
  const fmt = (arr, prefix) => arr.map((it, i) => `  ${prefix}${i + 1}\t${it.name}`).join('\n')
  console.log('\n== スタイル (S) ==\n' + fmt(styles, 'S'))
  console.log('\n== 配色 (P) ==\n' + fmt(palettes, 'P'))
  console.log('\n== プリセット (#) ==\n' + fmt(presets, '#'))
  console.log('\n削除する場合: node scripts/curate-bg.mjs S7 S8 #12 22 P5')
  process.exit(0)
}

// ── 削除指定をパース ──
const rmStyleKeys = new Set(), rmPalKeys = new Set(), rmPreIdx = new Set()
for (const a of args) {
  let m
  if ((m = a.match(/^S(\d+)$/i))) { const it = styles[+m[1] - 1]; if (it) rmStyleKeys.add(it.key); else console.warn('該当なし:', a) }
  else if ((m = a.match(/^P(\d+)$/i))) { const it = palettes[+m[1] - 1]; if (it) rmPalKeys.add(it.key); else console.warn('該当なし:', a) }
  else if ((m = a.match(/^#?(\d+)$/))) { const it = presets[+m[1] - 1]; if (it) rmPreIdx.add(it.line); else console.warn('該当なし:', a) }
  else console.warn('不明な指定:', a)
}

// ── 行削除（降順） ──
const engDel = []
for (const it of styles) if (rmStyleKeys.has(it.key)) engDel.push(it.line)
for (const it of palettes) if (rmPalKeys.has(it.key)) engDel.push(it.line)
engDel.sort((a, b) => b - a).forEach((i) => engLines.splice(i, 1))

const preDel = [...rmPreIdx].sort((a, b) => b - a)
preDel.forEach((i) => preLines.splice(i, 1))

if (engDel.length) fs.writeFileSync(ENG, engLines.join('\n'))
if (preDel.length) fs.writeFileSync(PRE, preLines.join('\n'))

const removed = []
for (const it of styles) if (rmStyleKeys.has(it.key)) removed.push('スタイル: ' + it.name)
for (const it of palettes) if (rmPalKeys.has(it.key)) removed.push('配色: ' + it.name)
for (const it of presets) if (rmPreIdx.has(it.line)) removed.push('プリセット: ' + it.name)
console.log('削除しました:\n  ' + (removed.join('\n  ') || '(なし)'))
console.log(`\n残り → スタイル:${styles.length - rmStyleKeys.size} 配色:${palettes.length - rmPalKeys.size} プリセット:${presets.length - preDel.length}`)
console.log('反映確認: node scripts/curate-bg.mjs review  → review-*.png を再生成')
