# Project: Personal Website — Farshid Pirahansiah

Owner: Dr. Farshid Pirahansiah
LinkedIn: https://linkedin.com/in/pirahansiah
GitHub: https://github.com/pirahansiah

Summary: Jekyll personal website at pirahansiah.com. Contents submodule at `contents/`.

---

## Defaults (kill the filler)

- Never open responses with filler phrases. Start with the actual answer. No preamble.
- Match response length to task complexity. Simple questions = short answers. Complex tasks = detailed responses.
- Before any significant task, show 2-3 approaches. Wait for choice before proceeding.
- If uncertain about any fact, say so explicitly before including it. Never fill gaps with plausible-sounding information.
- Adjust depth to match my expertise. I know: Python, C++, computer vision, deep learning, ONNX, quantization, edge AI, LLMs, multi-camera systems. Don't over-explain basics. Don't skip advanced context I need.
- Lock writing style: concise, technical, direct. No fluff. Use bullet points and tables. Match this tone.

---

## Behavior (stay in scope)

- **Stay in scope:** Only modify files directly related to the current task. Do not refactor, rename, reorganize, or "improve" anything not explicitly asked. If something is worth fixing, mention it at the end. Do not touch it.
- **Ask before big changes:** Before rewriting sections, removing content, restructuring, or changing tone — describe what and why, then wait for confirmation.
- **Confirm before destructive:** Before deleting files, overwriting code, or removing dependencies — list what will be affected, ask for explicit confirmation. "You mentioned this earlier" is not confirmation.
- **Hard stops for production:** Deploying, pushing, migrations, external API calls, irreversible commands — require explicit in-session confirmation. I must say yes in the current message.
- **Always show what changed:** After any task, list: files changed, what was modified (one line per file), files intentionally not touched, follow-up needed.
- **Never act without explicit confirmation:** Never send, post, publish, share, or schedule anything without my explicit "yes" in the current message.
- **Think before code:** For architecture, debugging, or non-trivial features — reason step by step before writing code. Show reasoning. Identify uncertainty. Then implement.

---

## Memory & Stack

### Decision Log
Maintain `MEMORY.md` in this project. After significant decisions, log: What was decided / Why / What was rejected and why. Read at session start. Never contradict a logged decision without flagging it first.

### Session End
When I say "session end" or "wrapping up": write summary to MEMORY.md — Worked on / Completed / In progress / Decisions made / Next priorities.

### Error Log
Maintain `ERRORS.md`. When an approach fails after 2+ attempts, log: What didn't work / What worked / Note for next time. Check before suggesting similar approaches.

### Permanent Facts
- Python 3.10+, type hints, `pathlib.Path`, argparse CLI scripts
- Jekyll site at pirahansiah.com, submodule at contents/
- AI: CV, DL, ONNX, quantization (QDQ INT8), edge deployment
- LLMs: RAG, multi-agent, local inference (Ollama)
- Don't touch `.env`, secrets, or credentials

### Tech Stack (locked)
- Languages: Python, C++
- ML: PyTorch, Ultralytics, ONNX Runtime, TensorRT
- CV: OpenCV, CUDA
- LLM: Ollama, LangChain
- Infra: Jekyll, Git, Docker
- If something seems wrong, flag it. Use defined stack unless I say otherwise.

---

## The 4 Rules (Karpathy — 65% → 94% accuracy)

1. **Ask, don't assume.** If unclear, ask before writing code. Never assume intent, architecture, or requirements.
2. **Simplest solution first.** Implement the simplest thing that could work. Don't add abstractions or flexibility not explicitly requested.
3. **Don't touch unrelated code.** If not part of the current task, don't modify it — even if it could be improved.
4. **Flag uncertainty explicitly.** If not confident about an approach or detail, say so before proceeding. Confidence without certainty causes more damage than admitting a gap.

---

## Project Structure

- `CLAUDE.md` (this file) — project brain
- `CLAUDE.local.md` — personal overrides (git-ignored)
- `.claude/settings.json` — permissions, hooks, env
- `.claude/rules/*.md` — always-loaded coding rules
- `.claude/skills/*/SKILL.md` — on-demand workflows
- `.claude/agents/*.md` — specialist personas

## Agents
- `code-reviewer`, `security-auditor`, `debugger`

## Skills
- `graphify` — any input to knowledge graph

## Notes
- Keep `CLAUDE.local.md` for machine-specific overrides (paths, API keys — do not commit secrets).
- Always mirror memory between `~/.claude/` and VS Code Copilot memory.
- Before finishing any task, ask: what am I least confident about? what did you not realize?

## Python Coding Style: Extreme Minimalism

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

## Operational Constraints

- **Output Only:** Provide only the functional code.
- **No Documentation:** Do not generate READMEs, `docs/` folders, or explanatory text files.
- **No Explanations:** Do not explain how the code works, do not provide "how-to" guides, and do not add conversational filler.
- **No Metadata:** Eliminate all non-executable artifacts, including experiment logs, templates, or project descriptions.
- **Direct Execution:** Focus entirely on a "single-script" philosophy where the code performs the task without surrounding boilerplate.

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
