---
name: plan
description: Design an architecture, experiment or feature before building.
model: opus
effort: high
tools: Read, Grep, Glob, Bash(git log *)
---

# /plan

1. Read `CLAUDE.md`, the relevant `rules/`, and `git log --oneline -15` for recent decisions.
2. Restate the goal and acceptance criteria in the user's words. Ask for the constraint you are
   missing instead of assuming it.
3. Sketch the data flow and module boundaries; name the files that change.
4. List the risks that would actually stop this (data leakage, unsupported op, SDK version, licensing).
5. Give a staged plan where stage 1 produces a verifiable artefact.
6. Write the result to `.hermes/plans/<slug>.md`. Do not start implementing in this command.

Output: goal, acceptance criteria, file list, risks, staged plan, first verification command.
