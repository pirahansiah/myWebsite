---
name: review
description: Review the current diff for quality, security and correctness.
model: opus
effort: high
tools: Read, Grep, Glob, Bash(git diff *), Bash(git log *)
---

# /review

1. Determine scope: `git diff --stat` against the base branch, or the user-named files.
2. Run `@code-reviewer` findings in priority order: correctness, security, contract, tests, performance.
3. Every finding carries `file:line` and a concrete failure scenario.
4. Run the test suite if it is cheap; report the real result.
5. Output: blocking / should-fix / nit. If the diff is clean, say so in one line.

Do not rewrite the code in this command - report, then ask.
