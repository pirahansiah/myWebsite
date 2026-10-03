---
name: edge-deploy
description: Compile and validate a quantized model for Hailo, Axelera, Jetson/TensorRT, OpenVINO, Coral or TFLite Micro.
effort: high
---

# Edge deploy

1. **Pin the SDK.** Record the exact toolchain version in the build script; these SDKs are not
   backward compatible.
2. **Compile the graph you quantized.** Verify by hash, not filename.
   ```bash
   python buildModel4AIchip.py --model best_opt_preproc_int8.onnx --target <TARGET>
   ```
3. **Unsupported ops.** List them, then decompose or fall back per op. Do not silently accept a
   CPU fallback - it changes the latency you are about to quote.
4. **On-device validation.** Real input, real device: latency mean/P95, accuracy, peak memory.
   Simulator output is not a result.
5. **Record** the artefact path, the SDK version, the command and the measured numbers in
   `builds/<target>/REPORT.md`.

## Target notes
- Hailo-8: parser -> optimize -> compile; check op support at the parser stage, it fails late otherwise.
- Axelera Metis: Voyager SDK, INT8 QDQ per-channel.
- TensorRT: build the engine on the target GPU class; engines are not portable across archs.
- TFLite Micro: full-integer only; there is no float fallback on an MCU.
