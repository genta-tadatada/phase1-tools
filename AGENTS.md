<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:model-usage-rules -->
# Model selection policy

Use **Opus** when:
- Starting a new tool (read spec → decide implementation approach)
- A UI/UX decision has multiple valid options and quality matters
- Debugging a non-obvious bug (hypothesis generation)
- Any task where the cost of a wrong decision exceeds the cost of Opus

Use **Sonnet** (default) for everything else:
- Routine implementation following a clear spec
- File edits, refactoring, formatting
- Build/test commands

Switch with: `/model opus` or `/model sonnet`
<!-- END:model-usage-rules -->
