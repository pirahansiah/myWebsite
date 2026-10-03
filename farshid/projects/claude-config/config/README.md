# .claude - consolidated agent workspace

Owner: Dr. Farshid Pirahansiah (info@pirahansiah.com)
Rebuilt for the Claude 5.5 family: `claude-opus-5-5` (default, `xhigh`), `claude-sonnet-5-5`
(scoped work + subagents), `claude-haiku-4-5` (trivial fan-out).

## Layout

- `CLAUDE.md` - always loaded, master brain (<100 lines by policy)
- `CLAUDE.local.md` - machine-specific, git-ignored
- `settings.json` - model, effort, env pins, fallback chain, permissions
- `rules/` - 7 always-loaded standards
- `skills/` - 10 on-demand workflows
- `agents/` - 11 specialist subagents, each with an explicit model + effort
- `commands/` - `/plan /build /test /review /ship /explain`
- `MIGRATION.md` - where every file came from and what was dropped

## Model pinning

`settings.json` pins exact model ids and pins the aliases through `env`, so a rename upstream cannot
silently move this config onto a different model:

```
model           claude-opus-5-5
effortLevel     xhigh            (low | medium | high | xhigh)
fallbackModel   claude-sonnet-5-5 -> claude-haiku-4-5
subagents       claude-sonnet-5-5 via CLAUDE_CODE_SUBAGENT_MODEL
```

Cheaper run: `/model sonnet` or set `"model": "claude-sonnet-5-5"`. Deeper single run: `/effort max`
(session-only) or `/effort ultracode` to add dynamic-workflow orchestration on top of `xhigh`.

## Memory mirroring

Keep both in sync in the same session:
- Claude: `~/Documents/.claude`
- Copilot: `~/Library/Application Support/Code/User/globalStorage/github.copilot-chat/memory-tool/memories/`

## Quick start

```bash
conda activate py314
claude update          # this Mac was on 2.1.177; the config targets the 2.1.2xx line
```

## Reflection log (mandatory, appended every task)

### What are you least confident about right now?
- That `claude-opus-5-5` is selectable on this account's plan. Claude Code defaults to Opus 5.5 on
  paid plans, but the CLI here is 2.1.177 and may not offer it in the `/model` picker until updated.
  Fallback is pinned (`claude-sonnet-5-5`), so the config degrades rather than breaks.
- That `xhigh` is accepted by this account's Opus 5.5 routing; if it errors, use `high` (the model
  default is `medium`).

### What is the biggest thing I have not realised yet?
- The other three `.claude` trees (`Documents/2026/PKM/.claude`, `.../PKM/Projects/.claude`,
  `Documents/myWebsite/.claude`) are still on the old model family and still contain the forbidden
  email address. This config supersedes them, but they will keep being loaded whenever Claude Code
  runs in those directories. Either migrate them to this config or delete them.
- `~/.claude` does not exist on this Mac, so nothing here is global yet - it only applies when Claude
  Code runs inside `~/Documents`.

## Completion trigger

`job done`, `good`, `finished`, `successful`, `complete`, `test ok` -> summarise the full completion state.
