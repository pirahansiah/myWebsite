# Edge deployment

| Target | Toolchain | Notes |
|---|---|---|
| Axelera Metis (primary) | Voyager SDK | INT8 QDQ ONNX, per-channel weights |
| Hailo-8 | Hailo Dataflow Compiler | parser -> optimize -> compile; check unsupported ops early |
| NVIDIA Jetson | TensorRT | FP16 or INT8 with calibration cache; no dynamic shapes unless required |
| x86 CPU | OpenVINO | NNCF INT8, throughput mode |
| Coral / MCU | TFLite / TFLite Micro | full-integer only, no float fallback on MCU |

- Pin the toolchain version in the build script; accelerator SDKs break across releases.
- Validate on device, not in the simulator. Record latency, throughput, peak memory and accuracy.
- Keep one build script per target and name outputs `builds/<target>/`.
- Quantization for an accelerator is an accuracy risk: always run the accuracy gate from
  `rules/onnx-quantization.md` before declaring a target done.
