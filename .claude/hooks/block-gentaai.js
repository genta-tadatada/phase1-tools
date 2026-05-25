/**
 * Pre-tool-use hook: gentaai プロジェクトへのアクセスを100%ブロックする。
 * CLAUDE.md の宣言は確率論的なため、このHookで決定論的に強制する。
 *
 * Claude Code から stdin にJSON形式で tool_input が渡される。
 * 終了コード1 → 操作をブロック
 * 終了コード0 → 操作を許可
 */
const chunks = [];
process.stdin.on("data", (chunk) => chunks.push(chunk));
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    const toolInput = input.tool_input || {};

    // Write / Edit / Read のファイルパスチェック
    const filePath = toolInput.file_path || toolInput.path || "";
    // Bash コマンドチェック
    const command = toolInput.command || "";

    const targets = [filePath, command];
    const isBlocked = targets.some((t) =>
      t.toLowerCase().replace(/\\/g, "/").includes("gentaai")
    );

    if (isBlocked) {
      process.stderr.write(
        "\n🚫 BLOCKED: gentaai プロジェクトへのアクセスは禁止されています。\n" +
        "   このプロジェクト (webdev) は gentaai と完全に独立しています。\n\n"
      );
      process.exit(1);
    }
  } catch {
    // JSONパース失敗時は通過させる（フォールバック）
  }
});
