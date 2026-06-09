const VALID_CATEGORIES = ["不具合報告", "機能要望", "その他"] as const;

const CATEGORY_COLOR: Record<string, number> = {
  "不具合報告": 0xef4444,
  "機能要望":   0x3b82f6,
  "その他":     0x8b5cf6,
};

export async function onRequestPost(context: {
  request: Request;
  env: { DISCORD_WEBHOOK_URL?: string };
}) {
  const webhookUrl = context.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return json({ error: "not configured" }, 500);
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const { category, message, _hp } = body as Record<string, unknown>;

  // ハニーポット：ボットが埋めるフィールドが入力されていたら黙って成功返す
  if (_hp) return json({ ok: true }, 200);

  if (
    typeof category !== "string" ||
    !VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])
  ) {
    return json({ error: "invalid category" }, 400);
  }

  if (
    typeof message !== "string" ||
    message.trim().length === 0 ||
    message.length > 1000
  ) {
    return json({ error: "invalid message" }, 400);
  }

  const payload = {
    embeds: [{
      title: `📬 ${category}`,
      description: message.trim(),
      color: CATEGORY_COLOR[category] ?? 0x8b5cf6,
      footer: { text: "tadatada.net お問い合わせ" },
      timestamp: new Date().toISOString(),
    }],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok ? json({ ok: true }, 200) : json({ error: "webhook failed" }, 502);
  } catch {
    return json({ error: "network error" }, 500);
  }
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
