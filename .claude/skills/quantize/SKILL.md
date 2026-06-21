---
name: quantize
description: "Quantize models to INT8/INT4 using Intel NNCF, TensorRT, or ONNX Runtime. Modern successor to XNOR-Net binarization."
trigger: /quantize
---

# /quantize

Model quantization and compression workflow using Intel NNCF and other tools.

## Usage

```
/quantize <model_path> --precision int8             # INT8 quantization
/quantize <model_path> --precision int4             # INT4 quantization
/quantize <model_path> --llm                        # LLM-specific quantization
/quantize <model_path> --compare                    # Compare all methods
/quantize <model_path> --export openvino            # Export to OpenVINO IR
/quantize <model_path> --export onnx                # Export to ONNX
```

## Quantization Methods

| Method | Precision | Speedup | Quality | Best For |
|--------|-----------|---------|---------|----------|
| NNCF PTQ INT8 | 8-bit | 2-4x | Excellent | Intel CPU/GPU/VPU |
| NNCF QAT INT8 | 8-bit | 2-4x | Excellent | Training pipeline |
| NNCF INT4 | 4-bit | 2-3x | Excellent | LLMs on Intel |
| TensorRT FP16 | 16-bit | 2x | Excellent | NVIDIA GPU |
| TensorRT INT8 | 8-bit | 3-4x | Good | NVIDIA GPU |
| ONNX Runtime INT8 | 8-bit | 2-3x | Good | Cross-platform |
| GPTQ | 4-bit | 2-3x | Excellent | LLM serving |
| AWQ | 4-bit (W4A16) | 2-3x | Excellent | LLM serving |
| BitNet b1.58 | 1.58-bit | 3-5x | Good | Research |
| XNOR-Net | 1-bit | 5-10x | Poor for LLMs | Vision CNNs |

## Workflow

### Step 1 — Load Model
```python
from src.nncf_integration import NNCFCompressor, NNCFConfig, TargetDevice

compressor = NNCFCompressor(NNCFConfig(target_device=TargetDevice.CPU))
```

### Step 2 — Create Calibration Data
```python
calibration_data = [...]  # Representative input samples
```

### Step 3 — Quantize
```python
# INT8
quantized = compressor.quantize_int8(model, calibration_data)

# INT4 (for LLMs)
quantized = compressor.quantize_int4(model, calibration_data, group_size=128)

# LLM with SmoothQuant
quantized_llm = compressor.quantize_llm(model, precision="int4", smooth_quant=True)
```

### Step 4 — Export
```python
# OpenVINO IR
compressor.export_openvino(quantized, "output/model.xml")

# ONNX
compressor.export_onnx(quantized, "output/model.onnx")
```

### Step 5 — Benchmark
```python
results = compressor.benchmark(quantized, input_shape=(1, 3, 224, 224))
print(f"Latency: {results['avg_latency_ms']:.2f}ms")
print(f"Throughput: {results['throughput_fps']:.1f} FPS")
```

## LLM Quantization Pipeline

```python
from src.nncf_integration import quantize_llm_with_nncf

# Complete pipeline: HuggingFace → NNCF → OpenVINO
result = quantize_llm_with_nncf(
    model_name="Qwen/Qwen2-0.5B",
    output_dir="./quantized_qwen",
    precision="int4",
)
```

## Compare All Methods

```python
from src.nncf_integration import compare_legacy_vs_modern

methods = compare_legacy_vs_modern()
for m in methods:
    print(f"{m.method}: {m.precision} → {m.speedup} speedup")
```

## Output
- Quantized model (INT8/INT4)
- OpenVINO IR or ONNX export
- Benchmark results
- Comparison table
