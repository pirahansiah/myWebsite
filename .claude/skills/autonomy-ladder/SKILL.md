---
name: autonomy-ladder
description: |
  Graduated autonomy levels for agent loops. Start at level 1 (suggest only),
  earn your way to level 4 (full auto with audit logs). Based on Boris Cherny's
  autonomy framework from Anthropic.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Autonomy Ladder

Not every loop should run fully unattended from day one. Earn autonomy through demonstrated reliability.

## The Four Levels

### Level 1: Suggest Only
**Agent writes findings, takes no action.**

- Reads data, writes analysis to markdown
- Creates a report for human review
- No files modified, no PRs created
- Human reads and decides what to do

**When to use:** Day 1 of any new loop. First week of any automation.

**Output format:**
```markdown
## Findings
- [issue 1]: description, severity, suggested fix
- [issue 2]: description, severity, suggested fix

## Recommended Actions
1. Fix X by doing Y
2. Update Z to handle W
```

### Level 2: Draft Changes
**Agent creates PR/patch, human applies it.**

- Creates a branch with proposed changes
- Opens a PR or generates a diff
- Human reviews, approves, and merges
- Agent never touches main directly

**When to use:** Week 1-2 after Level 1 proves consistent.

**Output format:**
```bash
# Agent runs:
git checkout -b auto/fix-auth-test
# makes changes
git commit -m "fix: update auth test expectations"
# creates PR or diff for human review
```

### Level 3: Apply Low-Risk Changes
**Agent applies changes, needs approval before publish/merge.**

- Can modify files, run tests, fix lint errors
- Cannot push to main without approval
- Cannot deploy or publish without approval
- Human approves the final step

**When to use:** After Level 2 produces work you'd approve without changes for 1+ week.

**Hard gates at this level:**
- Tests must pass before PR
- Lint must pass before PR
- Build must succeed before PR
- No secrets or credentials in changes

### Level 4: Full Auto with Audit Logs
**Agent applies, tests, merges, and deploys with logging.**

- Can push to main after all gates pass
- Can deploy after tests pass
- All actions logged to audit file
- Human reviews audit logs periodically

**When to use:** After Level 3 proves reliable for 2+ weeks. Earned, never assumed.

**Required at this level:**
- Audit log of all actions: `audit/YYYY-MM-DD.md`
- Rollback capability for every action
- Alert on failure (email, Slack, etc.)
- Daily summary sent to human

## Decision Framework

```
New Loop Created
       │
       ▼
   Level 1 ─── run for 1 week ──→ consistent? ──→ Level 2
                                       │
                                       no → fix loop, stay at Level 1
                                       
   Level 2 ─── run for 1 week ──→ would approve without changes? ──→ Level 3
                                       │
                                       no → fix loop, stay at Level 2
                                       
   Level 3 ─── run for 2 weeks ──→ reliable? ──→ Level 4
                                       │
                                       no → fix loop, stay at Level 3
```

## Monitoring

### Level 1-2: Daily Review
- Read the output file each morning
- Note what was right, what was wrong
- Adjust the loop prompt based on feedback

### Level 3: Weekly Review
- Check PR quality over the week
- Review any changes that needed manual fix
- Update criteria if false positives/negatives

### Level 4: Audit Review
- Read audit logs weekly
- Check for anomalies or unexpected actions
- Verify rollback capability works

## Promotion Checklist

Before moving up a level, confirm:

- [ ] Loop has been running at current level for minimum time
- [ ] Output quality is consistently acceptable
- [ ] False positive rate is low (<5%)
- [ ] No critical failures in last N runs
- [ ] Stop condition is working correctly
- [ ] Token cost is within budget
- [ ] Audit trail exists (Level 3+)

## Demotion Triggers

Drop back a level if:
- More than 2 consecutive failures
- False positive rate exceeds 10%
- Human has to fix >30% of output
- Stop condition fails to trigger
- Token cost exceeds budget

## Autonomy Config

```yaml
# .claude/loop-config.yml
loop: daily-triage
level: 2
max_iterations: 10
stop_condition: "tests pass"
promotion_criteria:
  min_runs: 7
  max_false_positives: 0.05
demotion_triggers:
  consecutive_failures: 2
  false_positive_rate: 0.10
audit:
  enabled: true
  path: "audit/"
  frequency: daily
```
