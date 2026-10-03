---
layout: farshid_default
title: "claude-config"
permalink: /projects/claude-config/
description: "A downloadable agent workspace that turns dense model output into controlled-English text, diagrams, interactive pages and explainer videos — the explainer ladder as working configuration."
---

# Understanding model output — text, diagrams, pages, video

> We'll be spending a lot more time trying to understand the outputs of language models. A few thoughts, tips & tricks:
>
> **Writing.** Something I've had success with: Ask your LLM to explain something in ASD-STE100, it's a controlled language specification originally developed for aerospace maintenance documentation. LLMs well-versed in this language and it comes with heavy constraints on clean writing style that I often find a lot more readable. Sometimes I've tried to soften it a bit e.g. ask for "80% of the way to ASD-STE100" because the spec is quite stringent. But even better:
>
> **Diagrams / images.** Instead of writing, ask your LLM to create a diagram. These can be a lot easier to process, parse, and understand. But even better:
>
> **Web pages.** Ask for output "in HTML" to get a beautiful, interactive webpage. LLMs are getting really good at frontend and can create beautiful experiences, animations, etc. But even better:
>
> **Explainer videos.** The output format I am most bullish on is fully custom / bespoke explainer videos generated on any arbitrary topic. Experiment with things like "Create a 3b1b style video explainer on X. Use my ElevenLabs API key for audio narration" (you'd need an API key for the latter or you can ask your LLM to find you decent free alternatives that use your local compute). This is actually starting to work!
>
> In summary: as LLMs get better, they will do more and more of the legwork autonomously, and a lot more of our work will rise up the abstractions into oversight and understanding. Luckily, LLMs can help here too because as intelligence and code are increasingly abundant, you can ask for large, custom, discardable software artifacts (e.g. web apps, video explainers) that would have never made sense to create before. Push the boundaries here and you'll be surprised.
>
> — Andrej Karpathy ([@karpathy](https://x.com/karpathy))

That observation is correct, and the practical version of it is a **ladder**: when you ask a model to explain something, it should climb to the first rung that fits the question instead of answering everything with prose.

## The explainer ladder

| Rung | Format | Best for | On this machine |
|---|---|---|---|
| 1 | Text in **ASD-STE100** controlled English | instructions read under time pressure | prompt-level, no install |
| 2 | **Diagram** | how parts connect, where data flows | Mermaid, Excalidraw, SVG, ImageMagick 7 |
| 3 | **Interactive HTML** | anything with a number to explore | one self-contained file, bundled Chromium to verify |
| 4 | **Explainer video** | a concept with a time axis | Manim + LaTeX visuals, narration, ffmpeg to mux |

Rung 4 is where it stops being a summary and becomes an artifact: narration is generated locally with
macOS `say` (free, no key, no network) or through a configured ElevenLabs voice, matched to the scene
duration, and the result is verified with `ffprobe` before anyone watches it.

The last paragraph of the quote is the part people skip: as more of the work moves up into oversight,
the useful output is not more text — it is a **large, custom, discardable artifact** that makes approval
possible. A page you can drag a slider on, or a 60-second video, beats a 2,000-word answer. And it costs
about the same to produce now.

## What is in this download

A complete, working agent workspace — 46 files — that encodes the ladder as rules, skills, commands and
subagents for the Claude 5.5 family:

- `CLAUDE.md` — the master brain: model policy, pipeline, behavioural and privacy rules, the ladder
- `rules/explaining-outputs.md` — the ladder itself, with the ASD-STE100 guidance and the video recipes
- `skills/explain-output/` — the executable version: pick a rung, build it, verify it
- `commands/explain.md` — `/explain`, `/explain video`, `/explain 80`
- `agents/explainer.md` — a subagent that owns rungs 2–4
- `rules/`, `agents/`, `skills/`, `commands/` — vision/edge-ML standards, quantisation and deployment
  gates, and the model-routing policy used to keep cost sane

**Download:**

<a href="/farshid/projects/claude-config/claude-config.zip" download>claude-config.zip — 44 KB, 46 files</a>

Browse it without downloading: the folder is readable on the site from
[`config/README.md`](/farshid/projects/claude-config/config/README.md).

## Install

```bash
cd ~/Documents          # or any project root
unzip claude-config.zip
mv config .claude       # the archive unpacks to config/
claude update           # needs the 2.1.2xx line for Opus 5.5, xhigh effort and mods
```

The archived folder is named `config/` deliberately: unzip it and rename to `.claude` in whichever
directory you want it to apply to. Nothing outside that directory is touched.

## Model policy it ships with

| Job | Model | Effort |
|---|---|---|
| Main thread, default | `claude-opus-5-5` | `xhigh` |
| Scoped edits, documents, subagents | `claude-sonnet-5-5` | `high` |
| Trivial fan-out only | `claude-haiku-4-5` | — |
| Hardest long-horizon work, opt-in | `claude-fable-5-1` | `high` |

Fallback chain is `claude-sonnet-5-5` → `claude-haiku-4-5`, so the configuration degrades instead of
breaking if a model is unavailable on your plan. Opus 5.5's thinking is adaptive and always on: the
configuration never tries to disable it, and it uses `between_tools` when up-front thinking must stop.

## Limits, stated honestly

- The model ids are pinned to the 5.5 family as published in September 2026. Haiku 5.5 is announced but
  unreleased, so the cheap tier is still Haiku 4.5.
- The visual half of rung 4 (Manim + LaTeX) is **not** installed here yet; the recipes are in the
  config, the dependency is not. The free local narration path (`say` + `afconvert` → `ffmpeg`) is
  verified working.
- Nothing here is a framework. Every artifact it produces is meant to be deleted once the question is
  answered.

## Two questions this site always asks

**What are you least confident about right now?** That the pinned model ids are selectable on every
plan, and that the archived config stays in step with the version it is unzipped into — it is a
snapshot, not a mirror. The fallback chain limits the damage; it does not remove it.

**What is the biggest thing I have not realised yet?** That the download is the least important part.
The rule that matters is one line — *climb the ladder and stop at the first rung that answers the
question* — and it is worth copying into any agent configuration, with or without the other 45 files.
