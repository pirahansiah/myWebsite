# Global Memory

**Auto-memory**: This file is auto-maintained during sessions.

## Quick Reminders
- Always use `pathlib.Path` for file operations
- Type-hint public function signatures
- Use `conda activate py314` for Python execution
- Target Python 3.13+ (3.14 in beta), C++23/26, OpenCV 5, CUDA 12.x

## Session History

### 2026-06-20: Full GitHub Portfolio Modernization + Multi-Chip AI

**Phase 1: Clone & Update**
- Cloned all 53 repos from github.com/pirahansiah to /Volumes/4tb/2026-6/fullGitHub
- Updated all requirements.txt to latest versions (52 repos)
- Updated all README.md with 2025-2026 SOTA research across 42 repos

**Phase 2: Deep Audit (8 repos)**
- BI4CV, cv-ml-pipline, workshop_LLM, opencv_python, farshid, Computer_Vison_IoT, cv-dashboard-cicd, cvtest
- Added tests, Docker, CI/CD, type hints, pathlib to each

**Phase 3: Portfolio Management**
- Created RESUME_ASSETS.md + ROADMAP.md for 30 repos
- Consolidated to ~/.claude/PROJECT_PORTFOLIO_ASSETS.md (244KB)
- Removed from all repos
- Updated website use-cases.md with all 43 projects

**Phase 4: Deep Feature Additions**

#### opencv_python — 6 New Modules
- `yolo_detector.py` — YOLOv11 detection, batch, video, webcam, ONNX export
- `segmentation.py` — SAM-2 segmentation, interactive mode, polygon extraction
- `video_analyzer.py` — Motion detection, object tracking, optical flow
- `edge_deploy.py` — ONNX export, INT8 quantization, Jetson deployment
- `augmentation.py` — Albumentations pipeline, batch augmentation, dataset export
- `features.py` — SIFT/ORB/AKAZE, feature matching, panorama stitching

#### Smart-Auto-Video-Annotation — Full Codebase Created
- `src/detector.py` — YOLOv11 object detection
- `src/tracker.py` — ByteTrack, Deep SORT, trajectory tracking
- `src/annotator.py` — COCO/YOLO/VOC annotation generation
- `src/auto_labeler.py` — Semi-auto labeling, label propagation
- `src/quality.py` — IoU, duplicate detection, quality metrics
- `src/pipeline.py` — End-to-end video → annotations workflow
- 4 test files, Dockerfile, pyproject.toml

#### Binary-DNN — Multi-Chip + AI Archaeology + NNCF

**Multi-Chip Support (18 AI Accelerators):**
- Hailo-8/8L/15/15M (13-30 TOPS/W)
- Axelera Metis AIPU (20 TOPS/W)
- Qualcomm Cloud AI 100, Hexagon DSP (12-15 TOPS/W)
- Apple Neural Engine (35 TOPS/W)
- NVIDIA Jetson Orin (15 TOPS/W)
- Google Coral Edge TPU (8 TOPS/W)
- ARM Ethos-U55/U85 (5-8 TOPS/W)
- Rockchip RK3588 (10 TOPS/W)
- Intel Movidius NCS2 (4 TOPS/W)
- Kneron KL730, Syntiant NDP120, MediaTek, Samsung

**AI Archaeology Document:**
- NCSDK → OpenVINO architectural pivot
- XNOR-Net math with LaTeX formulas
- 512MB RAM bottleneck analysis
- Why 1-bit fails for LLMs (no zero gate = hallucination)
- Modern alternatives: BitNet b1.58, vLLM, GPTQ, AWQ
- Edge AI timeline 2015-2026

**Intel NNCF Integration:**
- NNCFCompressor class (INT8, INT4, LLM quantization)
- SmoothQuant + group quantization for LLMs
- Export to OpenVINO IR and ONNX
- LLM quantization pipeline (HuggingFace → NNCF → OpenVINO)
- Comparison: XNOR-Net vs NNCF vs BitNet vs GPTQ vs AWQ

**XNOR-Net Module:**
- XNORBinarize with STE gradient
- BinaryConv2d, BinaryLinear
- TernaryQuantize (BitNet b1.58 style)
- Memory comparison (MobileNet → GPT-4)
- Benchmark: XNOR vs FP32 speedup

### Key Bugs Fixed
- BI4CV: `gather_metadata` counters commented out (infinite loop)
- cv-ml-pipline: `COLOR_RGB2GRAY` → `COLOR_BGR2GRAY`, TF1.15 → modern
- opencv_python: `save_image_opencv` passing lists to `imwrite`
- farshid: `th.manually()` → `self.manually()`, password in stdout
- Computer_Vison_IoT: lane detection crash on empty lists
- cvtest: off-by-one in histogram_gray (`< 255` → `< 256`)
- workshop_LLM: `ret == True` → `ret`, `found_pints` typo

## Permanent Facts
- Python 3.10+, type hints, `pathlib.Path`, argparse CLI scripts
- Jekyll site at pirahansiah.com, submodule at contents/
- AI: CV, DL, ONNX, quantization (QDQ INT8), edge deployment
- LLMs: RAG, multi-agent, local inference (Ollama)
- Don't touch `.env`, secrets, or credentials
- Website: /Volumes/4tb/myWebsite (Jekyll, git submodule at contents/ → PKM repo)
- All repos cloned to: /Volumes/4tb/2026-6/fullGitHub

## Tech Stack (Locked)
- Python 3.13+ (targeting 3.14), C++23/26
- OpenCV 5, CUDA 12.x
- PyTorch 2.x, Ultralytics YOLO11
- ONNX Runtime, TensorRT, NNCF
- Docker, Kubernetes, GitHub Actions CI/CD
- FastAPI, Ollama for local LLM inference
- Intel NNCF for quantization
- Multi-chip: Hailo, Axelera, Qualcomm, Apple NE, ARM Ethos

## Portfolio Stats
- 43 repos (32 own + 11 forks)
- 30 repos with RESUME_ASSETS.md consolidated to ~/.claude/
- 8 repos fully audited with tests, Docker, CI/CD
- 3 repos deep-modernized with new features (opencv_python, Smart-Auto-Video, Binary-DNN)
- All READMEs updated with 2025-2026 SOTA references
- Website updated with comprehensive project portfolio
