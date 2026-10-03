# Explaining outputs

The output format is a choice, not a default. Climb this ladder until the format matches the
question, and stop at the first rung that answers it. Never answer a structural question with prose.

## Rung 1 - Writing, in ASD-STE100

ASD-STE100 (Simplified Technical English) is a controlled-language spec written for aerospace
maintenance documentation: one word has one meaning, short sentences, active voice, one instruction
per sentence. It reads far faster than ordinary model prose.

- Ask for "ASD-STE100" for runbooks, error explanations and instructions. Ask for "80% of the way to
  ASD-STE100" when the full spec is too stiff for a discussion.
- Keep the constraints even outside the spec: no nominalisations, no stacked noun phrases, no
  "utilize/leverage/facilitate", no hedging, one idea per sentence.
- Use for text a human must parse under time pressure. Do not use for creative or persuasive writing.

## Rung 2 - Diagrams

Prefer a picture when the answer is structural: data flow, module boundary, state machine, sequence,
timeline, tensor shape, dependency graph.

- Inline Mermaid for anything that belongs next to the code.
- Excalidraw JSON (`creative/excalidraw` skill) for hand-drawn architecture sketches.
- SVG/Graphviz when exactness matters. ImageMagick is available to rasterise when a raster is required.
- Label every edge, axis and unit. An unlabelled arrow is a guess in a costume.
- One good diagram replaces three paragraphs.

## Rung 3 - Interactive web page

Default artifact for anything the user should explore rather than read: parameter sliders,
before/after toggles, live charts, step-through animations, a quantization error curve they can drag.

- One self-contained `.html`: inline CSS, vanilla JS, no build step, no framework.
- CDN is acceptable unless the page must work offline; if offline is required, inline everything.
- Verify before shipping: load it in the bundled Chromium and read the rendered DOM or a screenshot
  back. Never hand over a page you did not open.
- Keep it discardable. It exists to answer one question, not to become a product.

## Rung 4 - Explainer video

The strongest format for a concept with a time axis. 3Blue1Brown style = Manim + LaTeX for the
visuals, narration over the top, ffmpeg to mux.

- Audio, in preference order:
  1. Hermes TTS (configured provider, per-`~/.hermes/.env`). Never echo a key or a voice id from it.
  2. ElevenLabs when the key is present - reference it by path only, never paste it into a file, a
     command line, or a prompt.
  3. Free and fully local: macOS `say` + `afconvert`, or the Hermes local Piper voice.
- Verify the artifact: duration, frame count, an audio track that actually carries sound, and a
  human-watchable first 10 seconds. `ffprobe` output is the evidence.

## Meta

- As models get stronger, more work moves up into oversight and understanding. Produce the artifact
  that makes approval possible, not the artifact that maximises output text.
- Large custom artifacts (web app, video, dataset viewer) that would never have justified their own
  project are now cheap and disposable. Build them when they help; delete them after.
- Do not confuse "more artifacts" with "more understanding". Every artifact must answer a named question.
- If the user asks "explain", start at rung 2 or 3, never at rung 1, unless they explicitly asked for text.
