---
name: build
description: Train, export, quantize and compile for a named target.
model: opus
effort: xhigh
tools: Read, Edit, Bash, Glob, Grep
---

# /build

Preconditions: `dataset.yaml` exists, 200+ calibration images, target accelerator named.
Follow `skills/full-pipeline/SKILL.md` stage by stage.

1. Validate inputs; refuse to start if the calibration set or the target is missing.
2. Train (skip if weights are current): `python trainYOLOv26.py --data dataset.yaml --epochs 50 --qat`
3. Export: `python convertONNX.py --weights best.pt --opset 17` then `onnx.checker.check_model()`.
4. Optimize: `python -m onnxsim ...` (re-validate).
5. Quantize: `python quantizeONNX2int8.py --model ... --calib-dir dataset/images/val --per-channel`
6. Compile: `python buildModel4AIchip.py --model ... --target <TARGET>`
7. Benchmark and write `builds/quantization_report.md`.

Stop at the first stage that fails and report that stage. Never continue past a failed check model
call or an accuracy delta above the gate.
