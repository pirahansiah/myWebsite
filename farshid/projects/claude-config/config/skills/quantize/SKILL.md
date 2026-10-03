---
name: quantize
description: Quantize a model to INT8/INT4 (ONNX QDQ, NNCF, TensorRT, ONNX Runtime). Use when compressing a model for an accelerator.
effort: high
---

# Quantize

Pick the toolchain for the target: NNCF (Intel/OpenVINO), TensorRT (NVIDIA), ONNX Runtime static
quantization (generic), vendor SDK (Hailo/Axelera).

## ONNX Runtime / generic path
```bash
python quantizeONNX2int8.py --model model_opt.onnx --calib-dir dataset/images/val \
  --per-channel --format QDQ --out model_int8.onnx
```

## Rules
- QDQ format, per-channel weights, calibration from the **real** input distribution and shuffled.
- Bake preprocessing into the graph and record it; a mismatch here shows up as an accuracy loss.
- Validate every step: `onnx.checker.check_model()` after each transform.
- INT4/ternary only if the target exposes those kernels, and only after INT8 is verified.
- Then run the accuracy gate: see `debug-quantization` for the triage order if the delta exceeds 1%.

## Output
`builds/quantization_report.md`: size before/after, latency before/after, metric delta, calibration recipe.
