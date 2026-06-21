type Mark = {
  name: string;
  owner: string;
};

export function TrademarkNotice({ marks }: { marks: Mark[] }) {
  return (
    <aside
      aria-label="商標について"
      className="mt-6 rounded-2xl border border-dashed border-border bg-background/40 p-4 text-xs leading-relaxed text-muted-foreground"
    >
      <p className="mb-2">
        本ページに記載されている会社名・製品名・サービス名は、各社の商標または登録商標です。本文中では ®・™ 等の表記を省略する場合があります。記載されている名称は各製品を識別する目的でのみ使用しており、各社による当サイトの推奨や提携を意味するものではありません。
      </p>
      <ul className="list-disc pl-5 space-y-0.5">
        {marks.map((m) => (
          <li key={`${m.owner}-${m.name}`}>
            {m.name} は、{m.owner} の商標または登録商標です。
          </li>
        ))}
      </ul>
    </aside>
  );
}
