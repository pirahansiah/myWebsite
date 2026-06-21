# Claude Configuration — Dr. Farshid Pirahansiah

Global Claude Code configuration and preferences.

## Files

- `CLAUDE.md` — Main preferences and behavior rules
- `CLAUDE.local.md` — Machine-specific overrides (macOS)
- `MEMORY.md` — Persistent memory across sessions
- `AGENTS.md` — Agent registry and quick reference
- `settings.json` — Permissions and environment config
- `PROJECT_PORTFOLIO_ASSETS.md` — Consolidated resume assets for all projects
- `PROJECT_REGISTRY.md` — All 43 repos with descriptions, stack, and project ideas

## Rules

- `rules/python-style.md` — Python coding standards
- `rules/cpp-style.md` — C++ coding standards
- `rules/hardware-optimization.md` — Hardware-specific optimization guidelines

## Agents (9)

| Agent | Purpose |
|-------|---------|
| `code-reviewer` | Quality & security code review |
| `security-auditor` | Security policy enforcement |
| `debugger` | Error diagnosis & test failure analysis |
| `performance-engineer` | Hardware optimization & benchmarking |
| `cv-specialist` | Computer vision pipeline design |
| `quantization-engineer` | Model quantization and compression |
| `edge-deployer` | Edge AI deployment across accelerators |
| `docs-writer` | Documentation & roadmap generation |
| `devops-engineer` | Docker, CI/CD, Kubernetes |

## Skills (8)

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `graphify` | `/graphify` | Any input to knowledge graph |
| `modernize` | `/modernize` | Full-stack project modernization |
| `portfolio` | `/portfolio` | Portfolio management & career docs |
| `edge-deploy` | `/edge-deploy` | Deploy to Hailo, Axelera, Qualcomm, Apple NE, etc. |
| `quantize` | `/quantize` | INT8/INT4 quantization with NNCF, TensorRT |
| `cv-pipeline` | `/cv-pipeline` | Detection, tracking, segmentation, annotation |

## Quick Commands

```bash
# Code review
@code-reviewer

# Modernize a project
/modernize /Volumes/4tb/2026-6/fullGitHub/BI4CV

# Generate portfolio assets
/portfolio generate /Volumes/4tb/2026-6/fullGitHub/BI4CV

# Deploy to edge chip
/edge-deploy model.onnx --chip hailo8

# Quantize model
/quantize model.onnx --precision int8

# Build CV pipeline
/cv-pipeline detect video.mp4

# Security audit
@security-auditor

# Debug error
@debugger
```

## Portfolio Stats

- 43 repos (32 own + 11 forks)
- 30 projects with RESUME_ASSETS.md consolidated
- 8 repos fully audited with tests, Docker, CI/CD
- 3 repos deep-modernized (opencv_python, Smart-Auto-Video, Binary-DNN)
- All READMEs updated with 2025-2026 SOTA references
- Website updated with comprehensive project portfolio

## Hardware Targets

- Apple M5 Max (Neural Engine, Unified Memory)
- NVIDIA Spark (128GB VRAM, Tensor Cores)
- Intel Ultra 9 Gen 2 (AVX-512, hybrid cores)
- Raspberry Pi 5 (16GB, ARM64)

## Edge AI Chips Supported

- Hailo-8/8L/15/15M (13-30 TOPS/W)
- Axelera Metis AIPU (20 TOPS/W)
- Qualcomm Cloud AI 100, Hexagon DSP (12-15 TOPS/W)
- Apple Neural Engine (35 TOPS/W)
- NVIDIA Jetson Orin (15 TOPS/W)
- Google Coral Edge TPU (8 TOPS/W)
- ARM Ethos-U55/U85 (5-8 TOPS/W)
- Rockchip RK3588 (10 TOPS/W)
- Intel Movidius NCS2 (4 TOPS/W)
- Kneron KL730, Syntiant NDP120

## Tech Stack

- Python 3.15+ (targeting 3.14)
- C++29
- OpenCV 5
- CUDA 13.x
- PyTorch 2.x
- Docker, Kubernetes, GitHub Actions
- FastAPI, Ollama, LangChain
- Intel NNCF for quantization
