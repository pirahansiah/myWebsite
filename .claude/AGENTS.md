# AGENTS.md — Cross-Tool Agent Registry

# Available Agents

### `code-reviewer`
**Purpose**: Quality & security code review
**Tools**: Read, Glob, Grep, Bash(git *)
**Scope**: Post-commit or on-demand review of code changes
**Trigger**: `/review` or explicit `@code-reviewer`
**Checklist**: Type hints, pathlib, no secrets, error handling, test coverage, performance

### `security-auditor`
**Purpose**: Security policy enforcement
**Tools**: Read, Grep, Bash(git *)
**Scope**: Auth, secrets, data handling, compliance
**Trigger**: Explicit `@security-auditor`
**Focus**: Secrets exposure, injection risks, unsafe defaults, path traversal

### `debugger`
**Purpose**: Error diagnosis & test failure analysis
**Tools**: Read, Bash(python *, git *)
**Scope**: Errors, test failures, runtime issues
**Trigger**: On error or explicit `@debugger`
**Process**: Capture error → reproduce → isolate → fix → verify → prevent

### `performance-engineer`
**Purpose**: Hardware-specific optimization and benchmarking
**Tools**: Read, Glob, Grep, Bash(python *, conda *)
**Scope**: Latency, throughput, memory, CPU optimization
**Trigger**: Explicit `@performance-engineer`
**Targets**: M5 Max, NVIDIA Spark, Intel Ultra 9, Raspberry Pi 5

### `cv-specialist`
**Purpose**: Computer vision pipeline design and optimization
**Tools**: Read, Glob, Grep, Bash(python *)
**Scope**: OpenCV, YOLO, SAM-2, detection, tracking, segmentation
**Trigger**: Explicit `@cv-specialist`
**Stack**: OpenCV 5, Ultralytics YOLO11, ONNX Runtime, TensorRT

### `quantization-engineer`
**Purpose**: Model quantization and compression
**Tools**: Read, Glob, Grep, Bash(python *)
**Scope**: INT8/INT4 quantization, pruning, distillation, NNCF
**Trigger**: Explicit `@quantization-engineer`
**Stack**: NNCF, TensorRT, ONNX Runtime, OpenVINO

### `edge-deployer`
**Purpose**: Edge AI deployment across hardware accelerators
**Tools**: Read, Glob, Grep, Bash(python *)
**Scope**: Hailo, Axelera, Qualcomm, Apple NE, ARM Ethos, Jetson
**Trigger**: Explicit `@edge-deployer`
**Stack**: OpenVINO, TensorRT, CoreML, ONNX Runtime

### `docs-writer`
**Purpose**: README, API docs, and roadmap generation
**Tools**: Read, Glob, Grep, Write
**Scope**: Documentation, badges, API references, roadmaps
**Trigger**: Explicit `@docs-writer`

### `devops-engineer`
**Purpose**: Docker, CI/CD, Kubernetes configuration
**Tools**: Read, Glob, Write, Bash(docker *, kubectl *)
**Scope**: Containerization, pipelines, deployment
**Trigger**: Explicit `@devops-engineer`

---

## Quick Reference

**Code style**: Python 3.15+, type hints, pathlib, argparse on all scripts
**C++ style**: C++29, std::optional, std::filesystem, structured bindings
**Target stack**: OpenCV 5, CUDA 13.x, PyTorch 2.x, Docker, GitHub Actions
**Quantization**: NNCF (INT8/INT4), TensorRT, ONNX Runtime
**Edge chips**: Hailo, Axelera, Qualcomm, Apple NE, ARM Ethos, NVIDIA Jetson
