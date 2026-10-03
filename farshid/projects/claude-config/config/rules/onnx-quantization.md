# ONNX export and quantization

## Export
- Opset 17 or newer. Validate with `onnx.checker.check_model()` after **every** transform.
- `model.eval()` + `torch.no_grad()` before tracing; dynamic axes only where needed.
- Preprocessing baked in: resize -> /255.0 -> HWC to CHW -> batch dim (keep it explicit and documented).

## Quantize
- QDQ format (`QuantizeLinear`/`DequantizeLinear`), never QOperator for new work.
- Per-channel weight quantization by default; per-tensor only if the target demands it.
- Calibration: 200+ representative images, dataset order shuffled, 500+ when accuracy drifts.
- Alternatives: NNCF (Intel), TensorRT PTQ/QAT, ONNX Runtime static quantization, QAT for <1% loss.
- INT4/ternary only when the target hardware exposes those kernels; verify with a real run, not a schema.

## Gate
- Compare FP32 vs INT8: size, latency, mAP50/mAP75 or task metric. INT8 delta target < 1%.
- Fail the build if `onnx.checker` fails or the delta exceeds the gate; do not ship "probably fine".
- Log the report to `builds/quantization_report.md`.
