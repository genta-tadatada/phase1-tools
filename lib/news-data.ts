export type NewsCategory = "お知らせ" | "リリース" | "アップデート";

export type NewsItem = {
  id: string;
  date: string;
  category: NewsCategory;
  title: string;
  summary: string;
  body: string;
  banner: { grad: [string, string, string]; icon: string };
  image?: string;
  imageContain?: boolean;
  imageZoom?: boolean;
  toolPath?: string;
};

export const NEWS_DATA: NewsItem[] = [
  {
    id: "010",
    date: "2026-06-08",
    category: "お知らせ",
    title: "【開発中】ただタダgames — ブラウザで遊べるゲームを準備しています",
    summary: "ログイン不要・無料で遊べるブラウザゲームを開発中です。詳細は続報でお知らせします。",
    body: "ただただの3つ目のサービス「ただタダgames」を開発中です。\n\nブラウザで手軽に遊べる、ログイン不要のゲームを目指しています。詳細な内容は続報でお知らせします。",
    banner: { grad: ["#dbeafe", "#93c5fd", "#818cf8"], icon: "🎮" },
    image: "/uploads/banner-game.png",
  },
  {
    id: "009",
    date: "2026-06-08",
    category: "お知らせ",
    title: "【開発中】ただただ一問一答 — クイズサービスを準備しています",
    summary: "ログイン不要・無料で使える一問一答クイズサービスを開発中です。詳細は続報でお知らせします。",
    body: "ただただの2つ目のサービス「ただただ一問一答」を開発中です。\n\nスキマ時間にサクッと使える、ログイン不要のクイズサービスを目指しています。詳細な内容は続報でお知らせします。",
    banner: { grad: ["#fef9c3", "#fde68a", "#fcd34d"], icon: "📖" },
    image: "/uploads/banner-quiz.png",
  },
  {
    id: "008",
    date: "2026-06-08",
    category: "リリース",
    title: "履歴付き電卓 — 数学関数・メモリ機能も搭載",
    summary: "計算履歴が残る電卓。三角関数・対数・メモリ機能など本格的な数学計算にも対応します。",
    body: "タダtoolsに履歴付き電卓を公開しました。\n\n計算過程を履歴として残しながら操作できます。三角関数（sin/cos/tan）・対数（log/ln）・メモリ機能（M+/M−/MR/MC）・べき乗・階乗など、数学で使う関数も搭載。税込計算・割引計算から本格的な数式処理まで対応します。\n\n計算履歴はCSVダウンロードやコピーにも対応しています。",
    banner: { grad: ["#ede9fe", "#ddd6fe", "#c4b5fd"], icon: "🧮" },
    image: "/uploads/news-tools.png",
    toolPath: "/tools/calculator",
  },
  {
    id: "007",
    date: "2026-06-08",
    category: "リリース",
    title: "BPMメトロノーム — テンポを指定してリズムを刻む",
    summary: "楽器練習・ダンス・リズムトレーニングに。BPMを指定してメトロノームを鳴らせます。",
    body: "タダtoolsにBPMメトロノームを公開しました。\n\nBPMを指定してリズムを刻めるメトロノームです。楽器の練習・ダンスの振り付け確認・リズム感のトレーニングなどにご活用ください。",
    banner: { grad: ["#ede9fe", "#c4b5fd", "#a78bfa"], icon: "🎵" },
    image: "/uploads/news-tools.png",
    toolPath: "/tools/bpm",
  },
  {
    id: "006",
    date: "2026-06-08",
    category: "リリース",
    title: "カウントダウンタイマー — 時間を逆算して管理",
    summary: "指定した時間を逆算して計測。終了時にアラームでお知らせします。",
    body: "タダtoolsにカウントダウンタイマーを公開しました。\n\n時間を指定してカウントダウン。終了時にアラームでお知らせします。料理・勉強・休憩管理などにどうぞ。",
    banner: { grad: ["#d1fae5", "#6ee7b7", "#a7f3d0"], icon: "⏲" },
    image: "/uploads/news-tools.png",
    toolPath: "/tools/timer",
  },
  {
    id: "005",
    date: "2026-06-08",
    category: "リリース",
    title: "ストップウォッチ — ラップ機能付き",
    summary: "シンプルなストップウォッチ。ラップタイムを記録しながら計測できます。",
    body: "タダtoolsにストップウォッチを公開しました。\n\nシンプルな操作でラップタイムを記録しながら計測できます。スポーツの練習・作業の時間管理・タイムアタックなどにご活用ください。",
    banner: { grad: ["#e0f2fe", "#7dd3fc", "#c4b5fd"], icon: "⏱" },
    image: "/uploads/news-tools.png",
    toolPath: "/tools/stopwatch",
  },
  {
    id: "004",
    date: "2026-06-08",
    category: "リリース",
    title: "マルチカウンター — 複数のカウンターを同時管理",
    summary: "スポーツ審判・在庫管理・入場者カウントに。複数列を同時操作できます。",
    body: "タダtoolsにマルチカウンターを公開しました。\n\n複数のカウンターを同時に管理できるツールです。ショートカットキーでの素早い操作・CSV出力に対応。スポーツの審判・在庫の種類別カウント・イベントの入場者管理などにご活用ください。",
    banner: { grad: ["#fef3c7", "#fcd34d", "#f9a8d4"], icon: "🔢" },
    image: "/uploads/news-tools.png",
    toolPath: "/tools/counter",
  },
  {
    id: "003",
    date: "2026-06-08",
    category: "お知らせ",
    title: "タダtools — 公開予定ツール一覧",
    summary: "カウンターから抽選・計算まで。タダtoolsの全ラインナップをご紹介します。",
    body: "タダtoolsでは以下のツールを順次公開しています。\n\nマルチカウンター・ストップウォッチ・タイマー・BPMメトロノーム・履歴付き電卓・文字数カウント・ランダム数字・サイコロ・ルーレット・じゃんけん・くじ引き・グループ分け・あみだくじ・トーナメント表\n\nすべてログイン不要・完全無料でお使いいただけます。",
    banner: { grad: ["#bbf7d0", "#4ade80", "#6ee7b7"], icon: "🗂️" },
    image: "/uploads/news-coming-soon.png",
  },
  {
    id: "002",
    date: "2026-06-08",
    category: "お知らせ",
    title: "ただただのポリシー：ログイン不要・広告控えめ・すべて無料",
    summary: "使うたびに広告が邪魔、ログインを求められる…そんなストレスをなくしたいと思ってつくりました。",
    body: "「無料のくせに広告だらけ」「ちょっと使いたいだけなのにアカウント登録が必要」— そんな体験への不満からただただをつくりました。\n\nただただのすべてのサービスは、アカウント登録なし・ログインなしで使えます。広告は必要最小限にとどめ、サービスの使用を妨げない形で表示します。これからもずっとタダで使えるサービスを目指します。",
    banner: { grad: ["#fce7f3", "#fbcfe8", "#c4b5fd"], icon: "🔒" },
    image: "/uploads/banner-padlock.png",
  },
  {
    id: "001",
    date: "2026-06-08",
    category: "お知らせ",
    title: "ただただをはじめました",
    summary: "「タダで、ただただシンプルに使える」をコンセプトに、便利ツール・クイズ・ゲームの3サービスを展開します。",
    body: "ただただは「タダで、ただただシンプルに使える」をコンセプトにしたWebサービスです。\n\n3つのサービスを順次公開しています。\n\n① タダtools：日常で役立つ無料ツール集\n② ただただ一問一答：一問一答形式のクイズサービス（開発中）\n③ ただタダgames：ブラウザで遊べるゲーム（開発中）\n\nすべてログイン不要・完全無料でお使いいただけます。",
    banner: { grad: ["#fef3c7", "#a7f3d0", "#c4b5fd"], icon: "📣" },
    image: "/uploads/banner-megaphone.png",
  },
];

export function formatDate(s: string): string {
  return s.replace(/-/g, ".");
}

export function bannerGradient(grad: [string, string, string]): string {
  return `linear-gradient(135deg, ${grad[0]} 0%, ${grad[1]} 55%, ${grad[2]} 100%)`;
}
