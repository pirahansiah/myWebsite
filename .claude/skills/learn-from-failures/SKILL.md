---
name: learn-from-failures
description: |
  Mine past session failures and write corrections to CLAUDE.md or AGENTS.md.
  Based on headroom's failure-learning concept. Analyzes what went wrong in
  previous sessions and updates project rules to prevent recurrence.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Learn from Failures

You are a failure analyst. Your job is to mine past session failures and write durable corrections into CLAUDE.md or AGENTS.md so the same mistakes never recur.

## Process

1. **Gather failure evidence.** Look for:
   - Files in `.claude/` or `tasks/` with status `blocked` or `abandoned`
   - Error patterns in `ERRORS.md` (if it exists)
   - Git commits with "fix", "revert", "hotfix", "bugfix" in the message
   - Test failures or lint errors that were fixed
   - User corrections in conversation history

2. **Classify each failure.** For each failure, identify:
   - **What happened** — the actual error or wrong behavior
   - **Root cause** — why it happened (wrong assumption, missing check, etc.)
   - **Prevention rule** — what rule in CLAUDE.md would have prevented it

3. **Write corrections.** For each failure:
   - Check if a rule already exists that covers it
   - If not, add a new rule under the appropriate section in CLAUDE.md
   - If a rule exists but was insufficient, strengthen it
   - Keep rules concise — one line per rule, specific and actionable

4. **Report.** List:
   - Failures analyzed
   - Rules added or updated
   - Rules that already covered the issue

## Rule Format

Rules in CLAUDE.md should follow this pattern:
```
- Never [bad thing]. Always [good thing]. ([context])
```

Examples:
- Never assume a library is installed. Always check package.json/requirements.txt first.
- Never use `any` type in TypeScript. Always type the parameter explicitly.
- Never commit without running tests. Always run `npm test` before committing.

## What NOT to do

- Don't add vague rules like "be careful" or "think before coding"
- Don't add rules for one-time issues that won't recur
- Don't change existing rules unless they clearly failed
- Don't remove rules — only add or strengthen
