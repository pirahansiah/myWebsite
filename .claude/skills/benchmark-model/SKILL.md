---
name: benchmark-model
description: "Benchmark model latency, throughput, and size. Compare FP32 vs INT8 performance. Use when evaluating inference speed."
---
# Benchmark Model

Objectively measure latency (ms/inference), throughput (img/s), peak memory (MB), size on disk (MB), and accuracy regression (mAP vs baseline).

## When to Use
- After training a new model
- After quantization, to confirm no accuracy loss
- Before deployment, to validate SLA targets
- Comparing hardware targets (Axelera vs Hailo vs TensorRT)

## Quickstart
```bash
# FP32 baseline
python benchmarkModel.py --model best_opt.onnx --format fp32
# INT8 variant
python benchmarkModel.py --model best_opt_preproc_int8.onnx --format int8
# Compare targets
python benchmarkModel.py --model best_opt_preproc_int8.onnx --targets axelera hailo tensorrt
```

## Targets
- Size reduction: > 3x (FP32 → INT8)
- CPU latency speedup: > 2x
- mAP50 drop: < 2%

## Output
Generates `builds/benchmark_results.md`:
```
| Target  | Format | Latency | Throughput | Size  | mAP50 | Notes    |
|---------|--------|---------|------------|-------|-------|----------|
| CPU     | FP32   | 145ms   | 6.9 img/s  | 20 MB | 0.892 | Baseline |
| Axelera | INT8   | 12ms    | 83.3 img/s | 5.8MB | 0.884 | Primary  |
| Hailo   | INT8   | 15ms    | 66.7 img/s | 5.5MB | 0.881 | Fallback |
```
