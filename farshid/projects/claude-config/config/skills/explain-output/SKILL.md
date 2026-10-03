---
name: explain-output
description: Turn a dense result into the right explanatory artifact - ASD-STE100 text, a diagram, an interactive HTML page, or a 3b1b-style explainer video (ElevenLabs or free local TTS). Use when asked to explain, walk through, visualise, or make something understandable.
effort: high
---

# Explain an output

Follow `rules/explaining-outputs.md`. Pick the rung from the question, not from habit. Rungs compose:
a video explainer usually contains a diagram, and every rung ends with a verification.

## 0. Choose the rung

| The question is about | Rung |
|---|---|
| What do I type next / what went wrong | 1 - ASD-STE100 text |
| How the parts connect, where data flows | 2 - diagram |
| What happens if I change this number | 3 - interactive HTML |
| How the idea unfolds over time | 4 - explainer video |

Tell the user which rung you chose and why, in one line. Offer the next rung up if the answer is
going to be long.

## 1. Text

Ask the model for ASD-STE100 (or "80% of the way to ASD-STE100"). Then cut: one idea per sentence,
active voice, no nominalisations, no hedging. If the result is longer than 15 lines, it should have
been a diagram.

## 2. Diagram

- Mermaid when it lives beside the code; Excalidraw JSON (`creative/excalidraw` skill) for sketches.
- Rasterise with ImageMagick only if a consumer needs a PNG.
- Label every edge with what actually flows (tensor shape, file, request) and every axis with a unit.

## 3. Interactive HTML

```bash
# write one self-contained file, then verify it in the bundled Chromium
chromium=$(ls -d /Users/farshid/.hermes/tools/chromium-*/ 2>/dev/null | head -1)
# open it with the agent-browser helper and read back the rendered DOM / screenshot
```
- Inline CSS + vanilla JS. No framework, no build step, no npm install.
- Ship the control that answers the question (slider, toggle, replay) and nothing else.
- Check it renders with real data before reporting done: an unopened page is not a deliverable.

## 4. Explainer video (3b1b style)

```bash
# 1. visuals: Manim + LaTeX (not installed yet - install into the py314 conda env, never system python)
conda activate py314 && pip install manim && manim -qh scene.py Scene
# 2. narration - free/local first
say -o narr.aiff "Narration text." && afconvert -f m4af -d aac narr.aiff narr.m4a
#    or Hermes TTS (configured provider); or ElevenLabs -- key lives in ~/.hermes/.env, reference by path only
# 3. mux and verify
ffmpeg -i scene.mp4 -i narr.m4a -c:v copy -c:a aac -shortest out.mp4
ffprobe -show_entries format=duration -show_entries stream=codec_type out.mp4
```

- Render at 1080p60 (`-qh`); keep one scene per idea so a bad scene is cheap to re-render.
- Match scene duration to narration duration; never let audio get truncated by `-shortest` silently.
- Report the verified duration, the audio codec, and the exact commands used.
- If Manim cannot be installed in the time budget, fall back to a rung-3 HTML page with an animation
  timeline and say so - a working page beats a promised video.

## Rules

- Never paste an API key or a voice id into a file, a command line, or the chat. Reference the path.
- Every rung ends with evidence: the file opens, the diagram renders, the video has audio.
- Discardable is fine; unverified is not.
