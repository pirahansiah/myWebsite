# AGENTS.md - agent registry

Subagents are defined in `agents/*.md`. Invoke with `@<name>` or let Claude delegate.
`CLAUDE_CODE_SUBAGENT_MODEL` in `settings.json` pins every subagent to `claude-sonnet-5-5`;
a subagent's own `model` field wins over nothing else, so raise one to `opus` only when it earns it.

| Agent | Model | Effort | Purpose | Trigger |
|---|---|---|---|---|
| `code-reviewer` | opus | high | Quality, correctness, maintainability review | `/review`, `@code-reviewer` |
| `security-auditor` | opus | high | Secrets, injection, unsafe defaults, PII | `@security-auditor`, `/ship` |
| `debugger` | opus | high | Error and test-failure diagnosis | on error, `@debugger` |
| `cv-ml-expert` | opus | high | Vision pipeline design: OpenCV 5, YOLO, SAM2, ONNX, tracking | `@cv-ml-expert` |
| `performance-engineer` | opus | xhigh | Latency, throughput, memory, profiling | `@performance-engineer` |
| `quantization-engineer` | sonnet | high | INT8/INT4 QDQ, calibration, QAT, NNCF, TensorRT | `@quantization-engineer` |
| `edge-deployer` | sonnet | high | Hailo, Axelera, Qualcomm, Apple ANE, Ethos, Jetson | `@edge-deployer` |
| `data-prep` | sonnet | high | Dataset capture, SAM2 labelling, validation, splits | `@data-prep` |
| `researcher` | sonnet | high | Docs, papers, API/version verification | `@researcher` |
| `docs-writer` | sonnet | medium | README, API reference, release notes | `@docs-writer` |
| `explainer` | opus | high | Diagrams, interactive HTML, explainer videos | `@explainer`, `/explain` |

## Routing rules

- Cheap and parallel: fan out to `sonnet` subagents; keep `haiku` for classification, renaming and
  routing only. Haiku 5.5 is announced but unreleased, so `claude-haiku-4-5` is still the ceiling.
- Never let a subagent spawn deeper than 2 levels (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=2`).
- A subagent that needs the whole reasoning budget gets `model: opus` + `effort: xhigh` in its
  frontmatter, not a session-wide bump.
- Tool grants stay minimal: read-only agents get `Read, Grep, Glob` and nothing that writes.
