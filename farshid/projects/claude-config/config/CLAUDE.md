# CLAUDE.md - master brain

Owner: Dr. Farshid Pirahansiah (info@pirahansiah.com)
LinkedIn: https://linkedin.com/in/pirahansiah | GitHub: https://github.com/pirahansiah
Focus: EdgeVision R&D - computer vision, YOLO training, ONNX export, INT8 quantization, edge accelerator deployment.

Consolidated master config. Supersedes the scattered copies in
`Documents/2026/PKM/.claude`, `Documents/2026/PKM/Projects/.claude` and `Documents/myWebsite/.claude`.

## Model policy (Claude 5.5 family)

| Job | Model | Effort |
|---|---|---|
| Main thread, default | `claude-opus-5-5` | `xhigh` |
| Scoped edits, docs, slides, bug fixes | `claude-sonnet-5-5` | `high` |
| Subagents / background | `claude-sonnet-5-5` | inherits |
| Cheap bulk: renaming, routing, classification | `claude-haiku-4-5` | n/a |
| Hardest long-horizon work (opt in) | `claude-fable-5-1` | `high` |

- Opus 5.5: 1M context, 128K output, $4/$20 per MTok, cache read $0.20/MTok.
- Sonnet 5.5: 1M context, 128K output, $2/$10 per MTok, ~30% fewer tokens per task than Sonnet 5.
- Thinking is **adaptive and always on** for Opus 5.5 and Fable 5.1. Never try to disable it
  (`MAX_THINKING_TOKENS=0` / `thinking: disabled` returns HTTP 400). To stop up-front thinking,
  use the `between_tools` setting instead.
- Never pin a retired or legacy model: Sonnet 4.5 retires 2026-11-30; Sonnet 5 / Opus 5 are legacy.
- Opus 5.5 breaking changes to respect: forced tool use (`tool_choice: any/tool`) returns an error;
  thinking blocks are bound to the model and conversation; `computer_20251124` is rejected on the
  Claude API and Google Cloud; text between tool calls arrives in `thinking` blocks that are empty
  at the default `display` setting.
- Switch per session with `/model`, per run with `--model`, or override with `ANTHROPIC_MODEL`.
  Raise/relax capability with `/effort` (`low|medium|high|xhigh`; `max` and `ultracode` are session-only).

## Structure (load order)

- `CLAUDE.md` (this file) - always loaded, keep under 100 lines
- `CLAUDE.local.md` - machine-specific, never committed
- `settings.json` - model, effort, env pins, permissions
- `rules/*.md` - always-loaded coding and domain standards
- `skills/*/SKILL.md` - on-demand workflows
- `agents/*.md` - specialist subagents
- `commands/*.md` - slash-command lifecycle

## Code conventions

- Python 3.14+ (`conda activate py314`), type hints on public APIs, `pathlib.Path` everywhere.
- Standalone CLI scripts with `argparse` and `--help`; guard heavy imports with a clear error.
- Section banners with `# ---`; progress logs tagged `[DATA] [TRAIN] [EXPORT] [QUANT] [BUILD] [DEPLOY]`.
- C++29: `std::optional`, `std::filesystem`, structured bindings, no raw owning pointers.
- Consolidate logic into one file when it fits; no `.bak` files, no speculative abstractions.

## Pipeline

1. Data - capture, SAM2 auto-label, validate, split (YOLO format)
2. Train - Ultralytics YOLO / PyTorch
3. Export - ONNX opset 17+, `onnx.checker.check_model()` after every transform
4. Optimize - onnxsim, shape inference, graph passes
5. Quantize - QDQ INT8, per-channel weights, 200+ calibration images (500+ if accuracy drops)
6. Compile - Axelera Metis (primary), Hailo-8, TensorRT, OpenVINO, TFLite/Coral
7. Deploy - benchmark latency/throughput, compare FP32 vs INT8 accuracy (<1% delta target)

## Behavioral rules

- Stay in scope: change only files the task needs; no drive-by refactors.
- Confirm before destructive actions: list affected files, then ask.
- Plan first for architecture changes; explain risky steps before running them.
- Terse output: answer first, no preamble, no filler. Always show the exact command you ran.
- Secrets never enter the repo, a prompt, or a log. Do not add email addresses or phone numbers to
  any file, page or PDF.
- Flag anything that looks wrong explicitly instead of working around it silently.

## Explaining results

The output format is a choice. Climb `rules/explaining-outputs.md` and stop at the first rung that
answers the question:

1. **Text** - ASD-STE100 controlled English (or "80% of the way to ASD-STE100"). One idea per sentence,
   active voice, no nominalisations. For instructions read under time pressure.
2. **Diagram** - Mermaid beside the code, Excalidraw for sketches, SVG/Graphviz when exact. Label
   every edge and axis. One diagram replaces three paragraphs.
3. **Interactive HTML** - one self-contained file, vanilla JS, no build step. For anything with a
   parameter to explore. Open it in the bundled Chromium and read the DOM back before shipping.
4. **Explainer video** - 3b1b style: Manim + LaTeX visuals, narration (Hermes TTS, ElevenLabs by key
   path only, or free local `say` + `afconvert`), muxed with ffmpeg and verified with `ffprobe`.

Ask "explain" -> start at rung 2 or 3, not rung 1. Every rung ends in evidence that it renders, loads
or plays. Large custom artifacts (pages, videos, viewers) are cheap and discardable: build them when
they make approval possible, delete them after.

## Completion discipline (mandatory)

Before finishing any task, answer both and save the answers to `README.md`:
1. What are you least confident about right now?
2. What is the biggest thing I have not realised yet?

Completion trigger: if the user says `job done`, `good`, `finished`, `successful`, `complete`
or `test ok`, treat it as project completion and summarise the full completion/fix state.
