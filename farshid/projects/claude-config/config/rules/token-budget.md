# Token budget and context hygiene

Cost is driven by tokens per task, not only price per token. Claude 5.5 models needed fewer tokens
per task than their predecessors, so re-measure instead of assuming old numbers.

## Route by job

- `claude-opus-5-5` (`xhigh`) for architecture, hard debugging, quantization triage, anything open-ended.
- `claude-sonnet-5-5` (`high`) for scoped edits, docs, slides, spreadsheets, tests, subagents.
- `claude-haiku-4-5` for classification, renaming, routing, log triage. 200K context only.
- `claude-fable-5-1` only when Opus 5.5 genuinely fails. Never a default.

## Caching

- Keep stable context (`CLAUDE.md`, loaded rules, the file being edited) at the **start** of the
  prompt so it lands in the cache block.
- Cache reads are $0.20/MTok across the 5.5 family (60-75% cheaper than before); a re-read of a warm
  prefix costs ~5% of fresh input. Do not rewrite the top of the prompt mid-session for no reason.
- Batch offline work through the Message Batches API (50% cheaper) rather than many interactive calls.

## Hygiene

- Keep `CLAUDE.md` under 100 lines. Everything else lives in `rules/`, `skills/` or `agents/` and loads on demand.
- One fact, one place. If a rule is stated in `CLAUDE.md` it must not be repeated in a rule file.
- Delete stale memory files rather than accumulating them; `cleanupPeriodDays` is 30 in `settings.json`.
- Prefer a graph/outline query over reading a whole tree when a codebase index exists.
- Ask for a unified diff, not whole-file rewrites, when a change is smaller than the file.
- Never let "reduce tokens" mean "guess instead of verify": verification wins every trade-off.
