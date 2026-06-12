/**
 * OGP用ツール名テキスト画像一括生成（HGR丸ポップ体 + Sharp）
 * 白fill + 極太ネイビー縁のバブル体スタイル（「ただただ」ロゴと同系統）
 * 実行: node scripts/generate-ogp-text.mjs
 * 出力: public/assets/ogp-text-{slug}.png (14枚・透明背景・800×220)
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const assetsDir = path.resolve(__dirname, '../public/assets')

// HGR丸ポップ体をbase64で埋め込み
const FONT_PATH = 'C:/Windows/Fonts/HGRPP1.TTC'
const FONT_B64 = fs.readFileSync(FONT_PATH).toString('base64')

const tools = [
  { slug: 'counter',        name: 'マルチカウンター'     },
  { slug: 'stopwatch',      name: '多列ストップウォッチ' },
  { slug: 'timer',          name: 'タイマー'             },
  { slug: 'bpm',            name: 'BPMメトロノーム'       },
  { slug: 'calculator',     name: '履歴付き電卓'         },
  { slug: 'word-count',     name: '文字数カウント'       },
  { slug: 'random-number',  name: 'ランダム数字'         },
  { slug: 'dice',           name: 'サイコロ'             },
  { slug: 'roulette',       name: 'ルーレット'           },
  { slug: 'janken',         name: 'じゃんけん'           },
  { slug: 'lot',            name: 'くじ引き'             },
  { slug: 'group',          name: 'グループ分け'         },
  { slug: 'amida',          name: 'あみだくじ'           },
  { slug: 'tournament',     name: 'トーナメント表'       },
]

const W = 800
const H = 220

// 半角英数0.6文字換算で適切なfontSizeを返す
function calcFontSize(name) {
  const len = [...name].reduce((s, c) => s + (/[A-Za-z0-9]/.test(c) ? 0.6 : 1), 0)
  if (len <= 3)  return 140
  if (len <= 4)  return 128
  if (len <= 5)  return 112
  if (len <= 6)  return 98
  if (len <= 7)  return 86
  if (len <= 8)  return 76
  if (len <= 9)  return 68
  return 60
}

function makeSvg(name) {
  const fontSize = calcFontSize(name)
  const strokeWidth = Math.round(fontSize * 0.22)

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: "KawaiiFont";
        src: url("data:font/truetype;base64,${FONT_B64}");
      }
    </style>
  </defs>
  <text
    x="${W / 2}" y="${H / 2 + fontSize * 0.37}"
    text-anchor="middle"
    font-family="KawaiiFont"
    font-size="${fontSize}"
    fill="white"
    paint-order="stroke fill"
    stroke="#1a1a2e"
    stroke-width="${strokeWidth}"
    stroke-linejoin="round"
  >${name}</text>
</svg>`
}

// 既存テスト画像を削除
for (const f of fs.readdirSync(assetsDir)) {
  if (f.startsWith('test-font-')) fs.unlinkSync(path.join(assetsDir, f))
}

console.log('🔤 ツール名テキスト画像生成中（HGR丸ポップ体）...\n')

for (const tool of tools) {
  const outPath = path.join(assetsDir, `ogp-text-${tool.slug}.png`)
  await sharp(Buffer.from(makeSvg(tool.name))).png().toFile(outPath)
  const kb = Math.round(fs.statSync(outPath).size / 1024)
  console.log(`✅  ogp-text-${tool.slug}.png  (${kb} KB)`)
}

console.log('\n🎉  14枚完了！')
