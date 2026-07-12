"use client";

import Link from "next/link";
import Image from "next/image";
import {
  TOOL_CATEGORIES,
  getToolsByCategory,
  type ToolCategoryId,
} from "@/lib/tools-catalog";

/**
 * /tools ハブ下部の「ツールガイド」セクション（リソースハブ層）。
 * H2=カテゴリ（フィルタタブと共通の名前・順序）／H3=ツール。
 * 詳しい説明はツールごとに置く（カテゴリ単位でまとめ書きしない）。
 * カード一覧（上部グリッド）とは役割を分け、テキストで「どれを使うか」を案内する。
 */

const GUIDE_STYLE: Record<ToolCategoryId, { dot: string; chipBg: string }> = {
  design: { dot: "#fbbf24", chipBg: "#fef3c7" },
  calc:   { dot: "#6ee7b7", chipBg: "#d1fae5" },
  text:   { dot: "#f9a8d4", chipBg: "#fce7f3" },
  play:   { dot: "#c4b5fd", chipBg: "#ede9fe" },
};

// カテゴリの短いリード文（1〜2文・カテゴリそのものの説明。個別ツールはまとめ書きしない）
const CATEGORY_LEAD: Record<ToolCategoryId, string> = {
  design:
    "スライドや資料の見た目をつくるツールです。デザインの知識がなくても、選んで調整するだけで仕上がります。",
  calc:
    "数える・計算する・時間を計る。手作業だとミスが出やすい細かい作業を、確実にこなす道具をまとめました。",
  text:
    "文章をあつかうツールです。文字数や行数の管理にそのまま使えます。",
  play:
    "くじ・ルーレット・サイコロから、グループ分けやトーナメント表まで。「ランダムに決める・分ける」をその場で片付けます。",
};

// ツールごとの説明（各ツール単独で完結）。slug をキー。
// 機能が豊富なツールは3文まで、機能が単純なツールは2文にとどめる（水増ししない）。
const GUIDE_DETAIL: Record<string, string> = {
  "slide-bg":
    "スライドに敷く背景画像を、原寸サイズでつくれます。16:9か4:3の比率と、シンプル・かわいい・高級感といったスタイル・配色を選ぶだけ。PNG画像として保存できるほか、背景を設定済みのPowerPointファイル（.pptx）でも書き出せるので、開いてそのまま資料づくりを始められます。",
  counter:
    "タップした回数を記録するweb数取り器です。カウンターを複数並べて同時に数えられるので、在庫の棚卸しや入場者数、テストの採点集計など、種類ごとに分けて数えたい場面に向いています。「正」の字を手で書くより速く、押し間違えても数え直せます。",
  stopwatch:
    "経過時間を計るストップウォッチです。1/100秒の精度で、複数のタイムを並べて同時に計測でき、ラップも記録できます。部活のタイム測定や実験の記録のように、何人分・何回分もまとめて残したい場面で活躍します。",
  timer:
    "時間を決めてカウントダウンし、終わりをアラームで知らせます。画面を見張っていなくても、時間になれば音で分かります。ポモドーロの区切りや全画面表示にも対応しているので、勉強・作業・料理まで幅広く使えます。",
  bpm:
    "テンポと拍子を設定してリズムを刻むメトロノームです。40〜240 BPMの範囲と拍子を選べるほか、曲に合わせて画面をタップすれば、そのテンポのBPMを逆算できます。楽器やダンスの練習にそのまま使えます。",
  calculator:
    "計算の過程が残るweb電卓です。税込・割引の計算に特化し、関数にも対応しています。式の履歴があとから見直せるので、入力を間違えてもどこで違ったかがすぐ分かります。買い物の合計や割引後の値段を確かめたいときに便利です。",
  "word-count":
    "文章の文字数・単語数・行数を、その場で数えます。字数制限までの残りがバーで見えるので、レポートや小論文、Xの投稿を削る作業がはかどります。原稿用紙の枚数換算にも対応しているので、提出前の字数チェックにそのまま使えます。",
  "random-number":
    "範囲と個数を指定して、ランダムな数字を出します。重複なしにも設定できるので、ビンゴの数字出しや抽選にそのまま使えます。",
  dice:
    "最大10個まで同時に振れるサイコロです。多面ダイスにも対応しているので、ボードゲームやTRPGで活躍します。",
  roulette:
    "好きな項目を入れて回すだけの抽選ルーレットです。回っているあいだのワクワクも込みで、ランチ決めや順番決めがその場で盛り上がります。",
  janken:
    "CPU相手のひとり勝負から、大人数でまとめて勝敗を決めるモードまで備えたじゃんけんです。順番決めや担当決めを、その場でさっと決められます。",
  lot:
    "あたりの本数を決めて引けるくじ引きです。結果はその場のランダムで決まるので、当番決めやイベントの抽選を公平に行えます。",
  group:
    "名前を入れて、グループ数か1グループの人数を指定するだけで、均等な班分けが自動で完成します。人数が割り切れないときもバランスよく振り分けます。席替えやチーム編成、係の割り当てのたびに紙のくじを作る手間がなくなります。",
  amida:
    "名前を入れるだけで、あみだくじを自動生成します。線をたどる演出付きで、1人ずつ順番に結果を発表できます。",
  tournament:
    "参加者を入力すると、対戦ブラケット（トーナメント表）を自動で作ります。勝者を選んでいくと次の対戦へ進み、決勝まで管理できます。3位決定戦にも対応しているので、球技大会やゲーム大会、社内イベントの運営にそのまま使えます。",
};

const ROUNDED = "'M PLUS Rounded 1c', sans-serif";

export function ToolsGuide() {
  return (
    <section
      aria-label="ツールガイド"
      style={{ borderTop: "1px solid var(--th-border)", padding: "48px 0 72px" }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px" }}>
        {/* セクション見出し（日本語のみ。英字の飾りラベルは使わない） */}
        <p
          style={{
            fontFamily: ROUNDED,
            fontWeight: 900,
            fontSize: 22,
            color: "var(--th-text)",
            marginBottom: 10,
          }}
        >
          ツールガイド
        </p>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.9,
            color: "var(--th-text-muted)",
            fontFamily: ROUNDED,
            marginBottom: 18,
          }}
        >
          どれを使えばいいか迷ったら、ここで確認できます。上のタブと同じ4つのカテゴリごとに、各ツールの使いどころをまとめました。
        </p>

        {/* カテゴリへのアンカー */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 40 }}>
          {TOOL_CATEGORIES.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.anchor}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                minHeight: 44,
                padding: "8px 16px",
                borderRadius: 999,
                background: "var(--tools-filter-inactive-bg)",
                border: "1.5px solid var(--tools-card-border)",
                color: "var(--th-text)",
                textDecoration: "none",
                fontFamily: ROUNDED,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: GUIDE_STYLE[cat.id].dot,
                  flexShrink: 0,
                }}
              />
              {cat.name}
            </a>
          ))}
        </div>

        {TOOL_CATEGORIES.map((cat) => {
          const st = GUIDE_STYLE[cat.id];
          const tools = getToolsByCategory(cat.id);
          return (
            <section
              key={cat.id}
              id={cat.anchor}
              style={{ scrollMarginTop: 130, marginBottom: 52 }}
            >
              <h2
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontFamily: ROUNDED,
                  fontWeight: 900,
                  fontSize: 19,
                  color: "var(--th-text)",
                  marginBottom: 14,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: st.dot,
                    flexShrink: 0,
                  }}
                />
                {cat.name}
              </h2>

              {/* カテゴリのリード文（1〜2文。詳しい説明は各ツール側に置く） */}
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.9,
                  color: "var(--th-text-muted)",
                  fontFamily: ROUNDED,
                  marginBottom: 20,
                }}
              >
                {CATEGORY_LEAD[cat.id]}
              </p>

              {/* ツールリンク（H3＋ツールごとの説明） */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={tool.path}
                    className="tools-guide-row"
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      padding: "14px 16px",
                      borderRadius: 16,
                      background: "var(--tools-filter-inactive-bg)",
                      border: "1.5px solid var(--tools-card-border)",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 12,
                        background: st.chipBg,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {tool.icon.endsWith(".svg") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tool.icon} alt="" width={36} height={36} style={{ objectFit: "contain" }} />
                      ) : (
                        <Image src={tool.icon} alt="" width={36} height={36} style={{ objectFit: "contain" }} />
                      )}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontFamily: ROUNDED,
                          fontWeight: 800,
                          fontSize: 14.5,
                          color: "var(--th-text)",
                          marginBottom: 4,
                        }}
                      >
                        {tool.name}
                      </h3>
                      <p
                        style={{
                          fontSize: 13,
                          lineHeight: 1.75,
                          color: "var(--th-text-muted)",
                          fontFamily: ROUNDED,
                        }}
                      >
                        {GUIDE_DETAIL[tool.slug] ?? tool.summary}
                      </p>
                    </span>
                    <span
                      aria-hidden="true"
                      style={{
                        alignSelf: "center",
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "var(--tools-arrow-bg)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        color: "var(--th-text-muted)",
                        flexShrink: 0,
                      }}
                    >
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <p
          style={{
            fontSize: 13,
            lineHeight: 1.9,
            color: "var(--th-text-muted)",
            fontFamily: ROUNDED,
          }}
        >
          ツールはこれからも少しずつ増やしていきます。「こんなツールがほしい」というご要望は、
          <Link href="/contact" style={{ color: "#0ea5e9", textDecoration: "none", fontWeight: 700 }}>
            お問い合わせフォーム
          </Link>
          からお寄せください。
        </p>
      </div>
    </section>
  );
}
