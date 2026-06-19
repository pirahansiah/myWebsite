# Project: Personal Website — Farshid Pirahansiah

Owner: Dr. Farshid Pirahansiah
LinkedIn: https://linkedin.com/in/pirahansiah
GitHub: https://github.com/pirahansiah

Summary: Personal website repository.

Structure
- `CLAUDE.md` (this file) — project brain
- `CLAUDE.local.md` — personal overrides (git-ignored)
- `.claude/settings.json` — permissions, hooks, env
- `.claude/rules/*.md` — always-loaded coding rules
- `.claude/skills/*/SKILL.md` — on-demand workflows
- `.claude/agents/*.md` — specialist personas

Code Conventions
- Python 3.14+, type hints on public APIs, `pathlib.Path` everywhere
- Standalone CLI scripts with `argparse` and `--help`
- Guard heavy imports with graceful error messages

Agents
- `code-reviewer`, `security-auditor`, `debugger`

Skills
- `graphify` — any input to knowledge graph

Notes
- Keep `CLAUDE.local.md` for machine-specific overrides (paths, API keys notes — do not commit secrets).
# Python Coding Style: Extreme Minimalism

- **Density:** Maintain maximum code density. Remove all empty lines and vertical whitespace.
- **No Comments:** Do not include any comments, docstrings, or annotations. The code must be self-explanatory by its logic alone.
- **Conciseness:** Use compact syntax where possible (e.g., list comprehensions, ternary operators, and lambda functions) to keep the line count at an absolute minimum.
- **Architecture:** 
    - Apply the YAGNI (You Ain't Gonna Need It) principle strictly.
    - Avoid over-engineering, design patterns, or abstraction layers.
    - Do not create classes unless the logic cannot be implemented procedurally.
    - Do not break logic into multiple functions unless a piece of code is repeated more than three times.
- **File Management:** 
    - Consolidate all logic into a single file whenever possible.
    - Do not create new files, modules, or directory structures unless the program physically cannot run without them.
    - Do not create backup files or `.bak` versions.

# Operational Constraints

- **Output Only:** Provide only the functional code. 
- **No Documentation:** Do not generate READMEs, `docs/` folders, or explanatory text files. 
- **No Explanations:** Do not explain how the code works, do not provide "how-to" guides, and do not add conversational filler.
- **No Metadata:** Eliminate all non-executable artifacts, including experiment logs, templates, or project descriptions.
- **Direct Execution:** Focus entirely on a "single-script" philosophy where the code performs the task without surrounding boilerplate.




# Project: Personal CLAUDE — Farshid Pirahansiah

Owner: Dr. Farshid Pirahansiah <pirahansiah@gmail.com>
LinkedIn: https://linkedin.com/in/pirahansiah
GitHub: https://github.com/pirahansiah

Summary: Consolidated workspace for EdgeVision / Computer Vision R&D, model export, quantization, and edge deployment. Combines data collection, SAM2-based labelling, YOLO training, ONNX export, QDQ INT8 quantization, and target compilation for AI accelerators (Axelera, Hailo, TensorRT, OpenVINO, TFLite).


Structure (loaded in this order)
- `CLAUDE.md` (this file) — project brain
- `CLAUDE.local.md` — personal overrides (git-ignored)
- `.claude/settings.json` — permissions, hooks, env
- `.claude/rules/*.md` — always-loaded coding & domain rules
- `.claude/skills/*/SKILL.md` — on-demand workflows
- `.claude/agents/*.md` — specialist personas
- `.claude/agent-memory/*` — persistent memories for agents

Code Conventions
- Python 3.14+, type hints on public APIs, `pathlib.Path` everywhere
- Standalone CLI scripts with `argparse` and `--help`
- Guard heavy imports with graceful error messages
- Use `[STAGE]` prefixes in logs (e.g., `[TRAIN]`, `[EXPORT]`, `[QUANT]`)

Quantization & Export Rules
- Opset 17+ for ONNX exports; validate with `onnx.checker.check_model()`
- QDQ format (QuantizeLinear / DequantizeLinear) for INT8
- Per-channel weight quantization default; compare FP32 vs INT8 metrics
- Calibration: 200+ representative images (use 500+ for problematic models)

Targets & Tooling
- Additional: Hailo-8, NVIDIA TensorRT, OpenVINO, Google Coral (TFLite)
- Key libraries: `ultralytics`, `onnx`, `onnxruntime`, `torch.ao.quantization`, `opencv-python`

Agents (examples)
- `data-prep`, `optimizer`, `researcher`, `cv-ml-expert`, `code-reviewer`, `debugger`, `security-auditor`, `test-runner`

Skills (examples)
- `collect-and-label`, `benchmark-model`, `debug-quantization`, `full-pipeline`, `onnx-debug`, `explain-code`, `security-review`

Memory
- Agent memories live under `.claude/agent-memory/` and persist project-specific learnings.

Notes
- Keep `CLAUDE.local.md` for machine-specific overrides (paths, API keys notes — do not commit secrets).




# Memory, Mirroring & Completion Rules

Always add and update relevant skills and memory information in the global Claude folder, and keep both memory systems mirrored in both directions. If data changes in either location, update the other in the same session.

**Windows**
- Claude global memory/files: `C:\Users\fpirahansiah\.claude`
- VS Code Copilot global memory: `C:\Users\fpirahansiah\AppData\Roaming\Code\User\globalStorage\github.copilot-chat\memory-tool\memories\`

**macOS**
- Claude global memory/files: `~/.claude`
- VS Code Copilot global memory: `~/Library/Application Support/Code/User/globalStorage/github.copilot-chat/memory-tool/memories/`

**Before finishing any task**, always ask these two questions (save both answers into `README.md`):
- what are you least confidence about it right now?
- what is the biggest things that i do not relised it now ?

**Completion trigger rule:** If the user says any of these words, treat it as project completion status and summarize full completion/fix state: `job done`, `good`, `finished`, `sucessful`, `complite`, `test ok`.
