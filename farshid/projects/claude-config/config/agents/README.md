# Agents - specialist subagents

Each file is a Claude Code subagent: YAML frontmatter (`name`, `description`, `model`, `effort`,
`tools`) plus a system prompt. Registry and routing table: `../AGENTS.md`.

Model choice is deliberate - `opus` only where sustained judgment is needed, `sonnet` for everything
scoped, `haiku` only for trivial fan-out. Effort raises only that subagent for the duration of its run.
