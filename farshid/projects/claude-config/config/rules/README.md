# Rules - always loaded

Keep this set small. Every file here costs tokens on every turn.

| Rule | Covers |
|---|---|
| `python-style.md` | Python 3.14+, type hints, pathlib, CLI shape, logging |
| `cpp-style.md` | C++29, RAII, filesystem, structured bindings |
| `onnx-quantization.md` | Export, QDQ INT8, calibration, validation |
| `edge-deployment.md` | Per-accelerator compile and accuracy gates |
| `data-labelling.md` | Capture format, SAM2 auto-label, YOLO label layout |
| `token-budget.md` | Model routing, prompt caching, context hygiene |
| `explaining-outputs.md` | Output ladder: ASD-STE100 text, diagram, HTML page, explainer video |

Load 2-3 at most for a focused task. Never duplicate rule text into `CLAUDE.md`.
