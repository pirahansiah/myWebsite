---
name: explain
description: Explain the last result as text, a diagram, an interactive page, or an explainer video.
model: opus
effort: high
tools: Read, Write, Edit, Bash, Glob, Grep
---

# /explain

Turn the current result into the artifact that makes it understandable. Rung ladder:
`rules/explaining-outputs.md`. Recipes: `skills/explain-output/SKILL.md`.

## Flow

1. Name the question being answered, in one sentence. If you cannot, ask before building anything.
2. Choose the rung (text / diagram / HTML / video) and say why in one line.
3. Build the artifact into a single path, `explain/<slug>.<ext>`, and keep it self-contained.
4. Verify it: open the page and read back the DOM, render the diagram, `ffprobe` the video.
5. Report the artifact path, the rung, and the exact verification command.

## Defaults

- `/explain` with no argument: rung 2 for structural topics, rung 3 for anything with parameters,
  rung 1 only for instructions a human will read under pressure.
- `/explain video` or `/explain --video`: rung 4. Manim + LaTeX for visuals; narration via Hermes
  TTS, ElevenLabs if configured (key in `~/.hermes/.env`, never echoed), or free local `say`+afconvert.
- `/explain 80`: ASD-STE100 at 80% strictness.

## Never

- Never hand over an artifact you did not open or probe.
- Never ask for, print, or store an API key; use the path and let the tool read it.
- Never build a framework. The artifact is throwaway by design; the answer is the deliverable.
