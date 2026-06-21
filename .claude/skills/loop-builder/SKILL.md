---
name: loop-builder
description: |
  Design and build agent loops: automations that run on schedule, use STATE.md
  for memory, and keep working after you close the laptop. Based on the loop
  architecture concept from Boris Cherny, Peter Steinberger, and Addy Osmani.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Loop Builder

You design and build autonomous agent loops. A loop is a recursive goal: you define a purpose, the agent iterates against it, and the loop keeps running until a real stopping condition is met. The agent forgets between runs. The loop does not.

## The Six Components

Every working loop is some combination of:

1. **Automation** — a trigger that fires without you (cron, hook, webhook, file watcher)
2. **Worktree** — git worktree isolation so parallel agents don't collide
3. **Skill** — procedure manual the agent reads instead of being told from scratch
4. **Connector** — integration with external systems (CI, issue tracker, API)
5. **Sub-agent** — specialized workers spawned by the loop
6. **Memory** — STATE.md on disk that survives between runs

## How to Build a Loop

### Step 1: Pick One Trigger

Start small. One recurring task you do manually:

```
"Every morning at 8am, read yesterday's CI failures,
open issues, and recent commits, and write findings to markdown."
```

That single automation is a complete, working loop.

### Step 2: Create the Memory File

Create `STATE.md` (or `PROGRESS.md`) where every iteration reads and writes:

```markdown
# Loop State

## Last Run
- Date: 2026-06-21
- What happened: Found 3 failing tests in auth module
- What was done: Updated test expectations

## In Progress
- Fix flaky test in user service

## Blocked
- (none)

## Next
- Check if deploy pipeline is green
- Review open PRs older than 3 days
```

Structure: what was done, what's in progress, what's blocked, what to try next. Keep it short — a memory file the agent has to read 2000 lines of is worse than no memory file.

### Step 3: Set the Loop Prompt

Write a prompt that:
1. Reads STATE.md first
2. Does the work
3. Writes back to STATE.md
4. Checks the stop condition

### Step 4: Set a Hard Stop Condition

The stop condition must be checkable by something other than the agent's own claim:
- "the test suite passes"
- "the build succeeds"
- "the linked ticket moves to Done with passing CI"

NOT: "the agent says it's finished"

Set a maximum iteration count as backstop (10-20 for most loops).

### Step 5: Start at Autonomy Level 1-2

| Level | Behavior | When to use |
|-------|----------|-------------|
| 1 | Suggest only — writes findings, doesn't act | Day 1 of any loop |
| 2 | Draft changes — creates PR/patch for human review | Week 1 |
| 3 | Apply low-risk changes — needs approval before publish | After consistent accuracy |
| 4 | Full auto with audit logs | Earned, not assumed |

## Loop Template

```markdown
# STATE.md — [Loop Name]

## Config
- Trigger: cron daily 8am / hook on push / manual
- Max iterations: 10
- Stop condition: tests pass AND build succeeds
- Autonomy level: 2

## Last Run
- Iteration: 5
- Date: 2026-06-21
- Result: success
- Findings: [what was found]

## In Progress
- [current task]

## History
- [previous runs summary]
```

## Token Cost Checklist

Before running any loop unsupervised:
- [ ] Run manually for 3-5 iterations
- [ ] Check token usage per iteration
- [ ] Multiply by max iterations = worst-case per run
- [ ] Multiply by frequency = worst-case daily cost
- [ ] Set command allowlist (only needed shell commands)

## Anti-Patterns

- **Ralph Wiggum loop**: Agent emits completion signal early, loop exits on half-done work. Fix: stop condition must be externally verifiable.
- **Unbounded cost**: Loop runs overnight without iteration cap. Fix: always set max iterations.
- **Opinion-only checker**: Second agent "reviews" without hard gate. Fix: checker must run tests/build/linter, not just "look at it."
- **Shared worktree**: Two agents edit same file. Fix: git worktree for each agent.

## Example: CI Triage Loop

```bash
# cron: 0 8 * * *
# STATE.md path: .loop-state/ci-triage.md

PROMPT:
"Read STATE.md. Check GitHub Actions for failures in the last 24h.
For each failure: identify root cause, suggest fix, write to STATE.md.
If no failures found, write 'All clear' to STATE.md and stop.
Max 5 iterations per run."
```
