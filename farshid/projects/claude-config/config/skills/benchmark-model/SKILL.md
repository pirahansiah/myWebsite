---
name: benchmark-model
description: Benchmark latency, throughput, size and accuracy. Use when comparing FP32 vs INT8 or two targets.
effort: high
---

# Benchmark

## Protocol
- Same input, same preprocessing, same warmup (min 20 iterations) for every variant.
- Report mean **and** P95/P99 latency, throughput, peak memory, and model size on disk.
- Accuracy on the frozen regression set only - never on data used for calibration or training.

## Run
```bash
python benchmarkModel.py --model <artifact> --target cpu --iters 200 --warmup 20
```

## Report table
| Variant | Size | Latency mean | P95 | Throughput | Metric |
|---|---|---|---|---|---|
| FP32 ONNX | | | | | |
| INT8 QDQ | | | | | |
| Compiled `<target>` | | | | | |

## Rules
- Never quote a vendor's number as your own measurement; label it as vendor-published.
- One variable changes per row. If two changed, the comparison is void.
- Refuse to declare a speedup without both numbers in the same message.
