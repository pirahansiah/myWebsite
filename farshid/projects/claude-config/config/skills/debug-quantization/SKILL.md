---
name: debug-quantization
description: Diagnose INT8/INT4 accuracy loss, calibration failure, QAT divergence or hardware rejection. Use when a quantized model underperforms or will not compile.
effort: xhigh
---

# Debug quantization

Triage in this order. Stop as soon as the delta is inside the gate.

1. **Is the baseline right?** Compare FP32 ONNX against the original framework output on the same
   input. If FP32 already differs, the bug is the export, not the quantization.
2. **Calibration set.** Wrong distribution, too few images (<200), or unshuffled (all one class).
   Recalibrate with 500 real images before touching the algorithm.
3. **Preprocessing parity.** Resize, /255.0, HWC->CHW, batch dim - identical in calibration, export
   and inference. This is the most common silent cause.
4. **Sensitive layers.** First/last conv, detection heads, attention: keep them FP16/FP32 or use
   per-channel + higher bit-width there.
5. **Per-tensor fallback.** If a layer refuses per-channel, find out why before accepting it.
6. **QAT.** Only after 1-5. Fine-tune with the frozen regression set held out.
7. **Hardware rejection.** Unsupported op or shape -> decompose the op, or pin shapes statically.

## Report
The stage that was actually the cause, the FP32 vs INT8 numbers, and the change that fixed it.
If it is not fixed, say exactly which stage is still failing - do not report "improved a bit".
