import type { Metadata } from "next";
import Link from "next/link";
import { TadatadaLogo } from "@/components/shared/TadatadaLogo";
import { GlobalMenu } from "@/components/shared/GlobalMenu";

export const metadata: Metadata = {
  title: "プライバシーポリシー | ただただ",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/privacy",
  },
};

const SECTION_STYLE: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "0.6rem",
};

const H2_STYLE: React.CSSProperties = {
  fontWeight: 800, fontSize: "0.95rem", color: "#1f1d2b", letterSpacing: "0.02em",
};

const H3_STYLE: React.CSSProperties = {
  fontWeight: 700, fontSize: "0.875rem", color: "#1f1d2b", letterSpacing: "0.02em", marginTop: "0.4rem",
};

const P_STYLE: React.CSSProperties = {
  fontSize: "0.875rem", lineHeight: 1.8, color: "#5a5666",
};

const UL_STYLE: React.CSSProperties = {
  fontSize: "0.875rem", lineHeight: 1.8, color: "#5a5666",
  paddingLeft: "1.2rem", listStyleType: "disc",
  display: "flex", flexDirection: "column", gap: "0.4rem",
};

const OL_STYLE: React.CSSProperties = {
  fontSize: "0.875rem", lineHeight: 1.8, color: "#5a5666",
  paddingLeft: "1.4rem", listStyleType: "decimal",
  display: "flex", flexDirection: "column", gap: "0.2rem",
};

const TABLE_STYLE: React.CSSProperties = {
  fontSize: "0.85rem", lineHeight: 1.7, color: "#5a5666",
  borderCollapse: "collapse", width: "100%",
};

const TH_STYLE: React.CSSProperties = {
  textAlign: "left", fontWeight: 700, color: "#1f1d2b",
  padding: "0.45rem 0.6rem", borderBottom: "2px solid #f1ecf3",
  whiteSpace: "nowrap",
};

const TD_STYLE: React.CSSProperties = {
  padding: "0.45rem 0.6rem", borderBottom: "1px dashed #f1ecf3",
  verticalAlign: "top",
};

const DIVIDER: React.CSSProperties = {
  borderTop: "1px dashed #f1ecf3",
};

const LINK_STYLE: React.CSSProperties = {
  color: "#8b5cf6", textDecoration: "underline",
};

export default function PrivacyPage() {
  return (
    <>
      <header className="p-header">
        <div className="p-header-inner md">
          <Link href="/" className="p-logo">
            <TadatadaLogo title="プライバシーポリシー" titleStyle={{ color: "#94a3b8", fontWeight: 900, letterSpacing: "0.03em" }} />
          </Link>
          <GlobalMenu activeSection={null} />
        </div>
      </header>

      <div className="p-page-top">
        <span className="p-sparkle" style={{ top: 50, left: "14%", width: 14, height: 14, background: "#c4b5fd" }} />
        <span className="p-sparkle" style={{ top: 90, right: "18%", width: 10, height: 10, background: "#f9a8d4", animationDelay: "0.6s" }} />
        <span className="p-sparkle" style={{ bottom: 28, left: "22%", width: 11, height: 11, background: "#6ee7b7", animationDelay: "1.2s" }} />

        <section className="p-contact-page-hero">
          <div className="p-container-xs">
            <div className="p-eyebrow lav">PRIVACY POLICY</div>
            <h1 className="p-page-title">プライバシーポリシー<span className="dot">.</span></h1>
            <p className="p-page-sub">当サイトにおける個人情報の取り扱いについて<br />ご説明します。</p>
          </div>
        </section>

        <div className="p-wave" aria-hidden="true" style={{ position: "relative" }}>
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 70 }}>
            <path d="M0,46 C240,76 480,16 720,40 C960,64 1200,12 1440,40 L1440,80 L0,80 Z" fill="#ffffff" opacity="0.55"/>
            <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="#ffffff"/>
          </svg>
        </div>
      </div>

      <main className="p-form-area">
        <div className="p-container-xs">
          <div className="p-form-card" style={{ padding: "40px 36px", display: "flex", flexDirection: "column", gap: "2rem" }}>

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>1. 基本情報</h2>
              <p style={P_STYLE}>
                ただただ（以下「当サイト」）は、個人で運営する無料のウェブツール・コンテンツサイトです。
                当サイトをご利用いただくすべての方（以下「ユーザー」）の個人情報・プライバシーを尊重し、
                以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
              </p>
              <table style={TABLE_STYLE}>
                <tbody>
                  <tr>
                    <th style={TH_STYLE} scope="row">サイト名</th>
                    <td style={TD_STYLE}>ただただ</td>
                  </tr>
                  <tr>
                    <th style={TH_STYLE} scope="row">URL</th>
                    <td style={TD_STYLE}>https://tadatada.net</td>
                  </tr>
                  <tr>
                    <th style={TH_STYLE} scope="row">運営者</th>
                    <td style={TD_STYLE}>個人運営</td>
                  </tr>
                  <tr>
                    <th style={TH_STYLE} scope="row">連絡先</th>
                    <td style={TD_STYLE}>info.tadatada@gmail.com</td>
                  </tr>
                </tbody>
              </table>
              <p style={P_STYLE}>
                本ポリシーは、当サイト（https://tadatada.net 配下のすべてのページ）におけるユーザーの情報の取り扱いについて適用されます。
                当サイトからリンクする外部サイトについては、本ポリシーの適用範囲外です。
              </p>
              <p style={P_STYLE}>
                当サイトは日本国内のユーザーを主な対象とした日本語サービスであり、
                日本の個人情報の保護に関する法律（個人情報保護法）および電気通信事業法その他関連法令を遵守します。
              </p>
            </section>

            <div style={DIVIDER} />

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>2. 収集する情報</h2>
              <p style={P_STYLE}>
                当サイトでは、ツールやコンテンツの基本的な利用にあたって、
                氏名・住所・電話番号などの個人を直接特定する情報を取得することはありません。
                ただし、サイトの運営・改善のため、以下の情報を自動的に取得する場合があります。
              </p>
              <ul style={UL_STYLE}>
                <li>
                  <strong>ローカルストレージ（LocalStorage）</strong>：ブラウザに保存されるデータ。
                  カウンターの値・タイマー設定・電卓の計算履歴など、ツールの状態保存に使用します。
                  このデータは利用者のブラウザ内にのみ保存され、当サイトのサーバーを含む外部のいかなる場所にも送信されません。
                  削除はブラウザの「サイトデータ（キャッシュ・Cookie）を削除」から行えます。
                </li>
                <li>
                  <strong>Cookie（クッキー）</strong>：ブラウザに保存される小さなデータ。
                  アクセス解析・広告配信のために使用されます
                  （ツールの設定保存にはLocalStorageを使用しており、Cookieは使用しません）。
                </li>
                <li>
                  <strong>アクセスログ</strong>：IPアドレス、ブラウザの種類、リファラー（参照元ページ）、閲覧日時、閲覧ページなどの情報。
                  サーバーやアクセス解析サービスにより自動的に記録されます。
                </li>
              </ul>
              <p style={P_STYLE}>これらの情報は、単体で特定の個人を識別するものではありません。</p>

              <h3 style={H3_STYLE}>お問い合わせフォームからの入力情報</h3>
              <p style={P_STYLE}>
                当サイトのお問い合わせフォームに入力された情報は、Discord（Discord Inc.）のサービスを経由して運営者へ通知されます。
                お問い合わせの際にユーザーが入力した以下の情報を取得します。
              </p>
              <ul style={UL_STYLE}>
                <li>お問い合わせカテゴリ（選択式）</li>
                <li>お問い合わせ内容（本文）</li>
                <li>任意でご入力いただいた連絡先（メールアドレス等）</li>
              </ul>
              <p style={P_STYLE}>
                入力された情報は Discord Inc. のサーバーを経由して運営者へ送信されます。
                取得した情報はお問い合わせへの返信・対応のためにのみ使用し、ユーザーの同意なく他の目的で利用することはありません。
                Discord のプライバシーポリシーについては{" "}
                <a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>
                  Discord Privacy Policy
                </a>
                {" "}をご確認ください。
              </p>
            </section>

            <div style={DIVIDER} />

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>3. アカウント登録について（準備中・Google ログイン）</h2>
              <p style={P_STYLE}>
                アカウント機能は現在準備中です。導入後は Google アカウントによるログインが可能になります。
              </p>
              <p style={P_STYLE}>
                ログイン時に Google から取得する情報は、<strong>ユーザーを識別するための一意のID（sub）のみ</strong>です。
                メールアドレス・ユーザー名・プロフィール画像などは一切取得しません。
              </p>
              <p style={P_STYLE}>
                アカウント作成時には、このサイト専用のユーザー名（ニックネーム）をご自身で設定していただきます。
                取得した識別IDは、ツール設定の保存・デバイス間の同期などの目的にのみ使用し、第三者への提供は行いません。
              </p>
            </section>

            <div style={DIVIDER} />

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>4. 利用目的</h2>
              <p style={P_STYLE}>当サイトが取得した情報は、以下の目的で利用します。</p>
              <ol style={OL_STYLE}>
                <li>ツール・コンテンツの提供および動作（設定の保存など）のため</li>
                <li>サイトの利用状況の把握・分析、品質およびユーザー体験の改善のため</li>
                <li>広告の配信・表示のため</li>
                <li>お問い合わせへの対応・連絡のため</li>
                <li>利用規約に違反する行為や不正アクセスなどへの対応のため</li>
              </ol>
              <p style={P_STYLE}>取得した情報を、上記の利用目的の範囲を超えて利用することはありません。</p>
            </section>

            <div style={DIVIDER} />

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>5. 第三者提供</h2>
              <p style={P_STYLE}>
                当サイトは、法令に基づく場合を除き、ユーザーの個人情報を第三者に提供・販売することはありません。
              </p>
              <p style={P_STYLE}>
                ただし、お問い合わせ対応のために以下の外部サービスを利用しています。
                また、アクセス解析・広告配信のための外部サービスを今後導入する予定です。
                これらのサービスにおける情報の取り扱いは、各社のプライバシーポリシーに従います。
              </p>
              <table style={TABLE_STYLE}>
                <thead>
                  <tr>
                    <th style={TH_STYLE} scope="col">サービス</th>
                    <th style={TH_STYLE} scope="col">提供事業者</th>
                    <th style={TH_STYLE} scope="col">用途</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={TD_STYLE}>Discord</td>
                    <td style={TD_STYLE}>Discord Inc.</td>
                    <td style={TD_STYLE}>お問い合わせフォーム（利用中）</td>
                  </tr>
                  <tr>
                    <td style={TD_STYLE}>Google アナリティクス（GA4）</td>
                    <td style={TD_STYLE}>Google LLC</td>
                    <td style={TD_STYLE}>アクセス解析（導入予定）</td>
                  </tr>
                  <tr>
                    <td style={TD_STYLE}>Amazonアソシエイト</td>
                    <td style={TD_STYLE}>アマゾンジャパン合同会社</td>
                    <td style={TD_STYLE}>アフィリエイト広告（導入予定）</td>
                  </tr>
                  <tr>
                    <td style={TD_STYLE}>Google AdSense</td>
                    <td style={TD_STYLE}>Google LLC</td>
                    <td style={TD_STYLE}>広告配信（導入予定）</td>
                  </tr>
                </tbody>
              </table>
              <p style={P_STYLE}>
                アクセス解析・広告配信サービスの導入時には、本ポリシーを更新のうえ当サイトでお知らせします。
              </p>
            </section>

            <div style={DIVIDER} />

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>6. Cookie・オプトアウト</h2>
              <p style={P_STYLE}>
                当サイトでは、アクセス解析・広告配信・ツールの設定保存などのために Cookie および LocalStorage を使用することがあります。
                ユーザーは、ブラウザの設定により Cookie の使用を無効化したり、保存済みの Cookie を削除したりすることができます。
                ただし、Cookie を無効にした場合、一部の機能が正常に動作しないことがあります。
              </p>
              <ul style={UL_STYLE}>
                <li>
                  <strong>ブラウザ設定</strong>：お使いのブラウザの設定画面から、Cookie の受け入れ可否を個別に設定できます。
                </li>
              </ul>
              <h3 style={H3_STYLE}>Google アナリティクス（GA4・導入予定）</h3>
              <p style={P_STYLE}>
                当サイトでは、アクセス解析ツール「Google アナリティクス（GA4）」の導入を予定しています。
                Google アナリティクスは、トラフィックデータの収集のために Cookie を使用します。
                このデータは匿名で収集されており、個人を特定するものではありません。
                収集を希望されない場合は、ブラウザの Cookie 設定のほか、{" "}
                <a href="https://tools.google.com/dlpage/gaoptout?hl=ja" target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>
                  Google アナリティクス オプトアウト アドオン
                </a>
                {" "}を利用することでデータ収集を無効にできます。
              </p>
              <p style={P_STYLE}>
                広告配信に関する Cookie の取り扱いとオプトアウト方法は、次条「広告配信・アフィリエイトプログラムについて」をご確認ください。
              </p>
            </section>

            <div style={DIVIDER} />

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>7. 広告配信・アフィリエイトプログラムについて</h2>

              <h3 style={H3_STYLE}>Google AdSense（導入予定）</h3>
              <p style={P_STYLE}>
                当サイトでは、第三者配信の広告サービス「Google AdSense」の導入を予定しています。
                Google などの第三者配信事業者は Cookie を使用し、ユーザーの当サイトや他のウェブサイトへの過去のアクセス情報に基づいて広告を配信します。
                この Cookie によって、氏名・住所・メールアドレス・電話番号などの個人を特定する情報が収集されることはありません。
              </p>
              <p style={P_STYLE}>
                ユーザーは、{" "}
                <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>
                  Google の広告設定
                </a>
                {" "}でパーソナライズ広告を無効にできます。また、{" "}
                <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>
                  www.aboutads.info
                </a>
                {" "}にアクセスすることで、第三者配信事業者によるパーソナライズ広告の Cookie を無効にできます。
                Google の広告における Cookie の取り扱いの詳細は、{" "}
                <a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>
                  Google のポリシーと規約（広告）
                </a>
                {" "}をご確認ください。
              </p>

              <h3 style={H3_STYLE}>Amazonアソシエイト・プログラム（導入予定）</h3>
              <p style={P_STYLE}>
                当サイトでは、Amazonアソシエイト・プログラムへの参加を予定しています。
                参加承認後は、Amazon.co.jp へのリンクを経由した適格販売により収入を得ることがあります。
                導入後は、本ポリシーを更新のうえ当サイトでお知らせします。
              </p>

              <h3 style={H3_STYLE}>アフィリエイトリンクの表記について</h3>
              <p style={P_STYLE}>
                景品表示法にもとづき、アフィリエイトリンク（広告）を含むページには「PR」「広告」等の表記を行います。
                アフィリエイトリンクを経由して商品・サービスをご購入された場合、当サイトに紹介料が支払われることがありますが、
                ユーザーに追加の料金が発生することはありません。
              </p>
              <p style={P_STYLE}>
                商品・サービスの購入は、ユーザーと各販売事業者との間の取引であり、当サイトはその取引内容について責任を負いかねます。
                ご購入の際は、各販売事業者が定める利用規約・プライバシーポリシーをご確認ください。
              </p>
            </section>

            <div style={DIVIDER} />

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>8. 著作権について</h2>
              <p style={P_STYLE}>
                当サイトに掲載されているテキスト・画像・デザイン・プログラム等のコンテンツの著作権は、特に明示しない限り運営者に帰属します。
                無断での転載・複製・改変等はご遠慮ください。
              </p>
            </section>

            <div style={DIVIDER} />

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>9. 免責事項</h2>
              <p style={P_STYLE}>
                当サイトの情報は正確性を期しておりますが、内容の正確性・完全性・有用性等についていかなる保証も行いません。
                当サイトの利用により生じた損害については責任を負いかねます。
              </p>
              <p style={P_STYLE}>
                当サイトからリンクする外部ウェブサイトの内容については、運営者は責任を負いかねます。
                リンク先のサービス利用に際しては、各サービスの利用規約・プライバシーポリシーをご確認ください。
              </p>
            </section>

            <div style={DIVIDER} />

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>10. 個人情報の開示・訂正・削除について</h2>
              <p style={P_STYLE}>
                ユーザーは、当サイトが保有するご自身の個人情報について、開示・訂正・利用停止・削除等を請求することができます。
                ご請求の場合は、下記お問い合わせ窓口よりご連絡ください。合理的な期間内に対応いたします。
              </p>
            </section>

            <div style={DIVIDER} />

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>11. お問い合わせ窓口</h2>
              <p style={P_STYLE}>
                本ポリシーに関するお問い合わせ、ご自身の情報の取り扱いに関するご請求は、以下の窓口までご連絡ください。
              </p>
              <ul style={UL_STYLE}>
                <li>メールアドレス：info.tadatada@gmail.com</li>
                <li>
                  お問い合わせフォーム：
                  <Link href="/contact" style={LINK_STYLE}>当サイトのお問い合わせページ</Link>
                </li>
              </ul>
              <p style={P_STYLE}>
                当サイトは個人運営のため、ご連絡はメールまたはお問い合わせフォームにてお願いいたします。
              </p>
            </section>

            <div style={DIVIDER} />

            <section style={SECTION_STYLE}>
              <h2 style={H2_STYLE}>12. 改定について</h2>
              <p style={P_STYLE}>
                当サイトは、法令の改正やサービス内容の変更にともない、本ポリシーを予告なく変更することがあります。
                変更後の本ポリシーは、当ページに掲載した時点から効力を生じるものとします。
                重要な変更を行う場合は、当サイト上でお知らせします。
              </p>
            </section>

            <p style={{ color: "#9a96a8", fontSize: "0.8rem" }}>
              制定日: 2026年6月8日<br />
              最終改定日: 2026年6月12日
            </p>
          </div>
        </div>
      </main>

      <footer className="p-footer" style={{ background: "#fff" }}>
        <div className="p-footer-inner">
          <div>© 2026 ただただ。 <span className="p-heart">♥</span> All rights reserved.</div>
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>トップへ戻る →</Link>
        </div>
      </footer>
    </>
  );
}
