---
name: debug-quantization
description: "Debug INT8 quantization accuracy issues, calibration failures, QAT divergence, or hardware rejection of quantized models."
---
# Debug Quantization

Systematic troubleshooting for INT8 accuracy drop, calibration crashes, hardware compiler rejection, and inference failures (NaN / all zeros).

## Diagnostic Workflow
1. **Verify integrity** — `onnx.checker.check_model()` on the INT8 model
2. **Test on CPU first** — run a dummy input through ONNX Runtime before the device
3. **Compare FP32 vs INT8** — same input through both; check output range and max/mean diff
4. **Investigate calibration** — increase images (200 → 500 → 1000), match deployment distribution, ensure all classes represented, try symmetric vs asymmetric
5. **Hardware tuning** — Axelera: `reduce_range=True`; Hailo: per-channel weights; TensorRT: INT8+FP16 hybrid

## Common Issues & Fixes
| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| Accuracy drops 5%+ | Calibration data unrepresentative | 500+ images from real deployment distribution |
| All zeros output | Quantization range too tight | Disable reduce_range; use symmetric quantization |
| Won't compile | Invalid quant format | Verify QDQ nodes; opset 17+ |
| Inference hangs | Model too large for device | Reduce batch size; profile memory |

## Output
Generates `builds/quantization_debug_report.md` with FP32-vs-INT8 metric comparison and issues found.
