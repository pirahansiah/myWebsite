---
name: ship
description: Pre-release audit: security, review, model validation, docs.
model: opus
effort: xhigh
tools: Read, Grep, Glob, Bash(git *)
---

# /ship

1. `@security-auditor`: secrets, PII (no email addresses or phone numbers anywhere), injection,
   unsafe defaults, dependency pins.
2. `@code-reviewer`: `git log --oneline -10`, diff against the release branch, no undocumented change.
3. Model validation: accuracy vs baseline, quantization delta, on-device latency, target compatibility.
4. Docs: README accurate, commands runnable, limitations listed, changelog entry written.
5. Checklist - each item must be verified, not assumed:
   `[ ] tests pass  [ ] no secrets/PII  [ ] review approved  [ ] metrics in gate  [ ] docs current  [ ] version bumped`
6. Output a ship / no-ship recommendation with the single reason for the verdict.

Never recommend ship with an unverified item; mark it unverified and say what it would take.
