# MIGRATION - what changed and what is still stale

Rebuilt 2026-10-03 for the Claude 5.5 family (Opus 5.5, 2026-09-22; Sonnet 5.5, 2026-09-28) and
Claude Code 2.1.288 (2026-10-02).

## Removed from `Documents/.claude` (target now holds only real config)

| Item | Why |
|---|---|
| `.claude/.DS_Store` | Finder junk |
| `sessions/` | empty directory, no sessions |
| `backups/.claude.json.backup.1787949684189` | 50-byte `firstStartTime` stub, superseded by `~/.claude.json` |
| `skills/typesafe-ai` | **broken** symlink to `../../.agents/skills/typesafe-ai` (target does not exist) |

## Sources combined

| New file | Came from |
|---|---|
| `CLAUDE.md` | `PKM/.claude/CLAUDE.md` + `myWebsite/.claude/CLAUDE.md` (behavioural rules, pipeline, completion rules), merged and deduped |
| `AGENTS.md`, `agents/*` | `myWebsite/.claude/AGENTS.md` (12-agent registry) + `PKM/.claude/agents/*` |
| `rules/*` | `myWebsite/.claude/rules/*` (python, cpp, onnx-quantization, edge-deployment, data-labelling) + `PKM/.claude/rules/*` |
| `commands/*` | `PKM/.claude/commands/*` (plan, build, test, review, ship), rewritten with model + effort frontmatter |
| `skills/*` | `myWebsite/.claude/skills/*` (richer set) merged with `PKM/.claude/skills/*` |
| `settings.json` | `myWebsite/.claude/settings.json` + `PKM/Projects/.claude/settings.json` permission lists |

## Dropped (with reason)

- `PKM/Projects/.claude/.claude/**` - a verbatim nested copy of `PKM/.claude` (plus `.claude.zip`,
  two `.pptx`, mindmap PNG/scripts). Pure duplication, ~40 files.
- `PKM/.claude/agent-memory/*` - per-agent memory files for agents that are not defined here;
  `rules/token-budget.md` says delete stale memory instead of accumulating it.
- `PKM/.claude/workflows/*` - 4 long workflow docs subsumed by `skills/full-pipeline`.
- `PKM/.claude/settings.local.json` - used a **Windows Copilot path** and pinned a foreign
  GPT model id as the default (wrong model family entirely for this config).
- `myWebsite/.claude/skills/graphify`, `humanizer` - vendored/oversized (58 KB, 34 KB) and not
  vision-specific; they stay where they are. `humanizer` also exists as a Hermes skill.
- Engineering-process skills (`tdd`, `to-prd`, `to-issues`, `triage`, `prototype`, `grill-*`,
  `teach`, `codebase-design`, `domain-modeling`) - duplicated by the Hermes skill library.
- Every reference to the retired/legacy models previously named in the old files.

## Still stale - not touched (destructive, needs your go-ahead)

1. `Documents/2026/PKM/.claude/` - old model family; `README.md` and `CLAUDE.md` both contain the forbidden personal
   Gmail address; `CLAUDE.local.md` points memory mirroring at a Windows
   path (`C:\Users\fpirahansiah\.claude`).
2. `Documents/2026/PKM/Projects/.claude/` - the nested duplicate above, plus its own `.claude/`
   sub-copy, `statsig/`, `debug/`, `todos/`, `shell-snapshots/` (Claude Code runtime junk).
3. `Documents/myWebsite/.claude/` - `CLAUDE.local.md` has the same Windows paths and
   `rules/token-reduction.md` quotes pre-5.5 cost assumptions.
4. `~/.claude` **does not exist** on this Mac, so no config here is global yet; it applies only when
   Claude Code runs from `~/Documents`.
5. Local CLI is `2.1.177`; `claude update` is needed for Opus 5.5 in the picker, `xhigh`, mods and
   `/code-review --max-findings`.
