# Local preferences — CLAUDE.local.md

- Prefer plan-first approach for architecture changes
- Explain risky changes before making them
- Always show the exact test/build command you ran
- Use the existing conda environments only; do not create `.venv`, `venv`, `virtualenv`, or uv-managed environments in this workspace unless the user explicitly asks.
- Use `conda activate py314` for Python work by default (`py312` only for zero-point-calibration if explicitly needed).
- Mirror memory systems bidirectionally in same session:
	- Claude memory: `C:\Users\fpirahansiah\.claude`
	- Copilot memory: `C:\Users\fpirahansiah\AppData\Roaming\Code\User\globalStorage\github.copilot-chat\memory-tool\memories\`
- If data changes in either location, update the other location in the same session.
- Before finishing any task, always ask these two questions (save both answers into `README.md`):
	- what are you least confidence about it right now?
	- what is the biggest things that i do not relised it now ?
- Completion trigger rule:
	- If the user says any of these words, treat it as project completion status and summarize full completion/fix state: `job done`, `good`, `finished`, `sucessful`, `complite`, `test ok`.

<!-- Put machine-specific notes here (paths, hardware, quick commands). Do NOT include secrets. -->
hand_landmarker.task download URL used in this workspace: https://raw.githubusercontent.com/alizafarbaig/AI-Virtual-Keyboard/main/hand_landmarker.task 