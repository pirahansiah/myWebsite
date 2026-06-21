---
name: edge-deploy
description: "Deploy models to edge AI accelerators — Hailo, Axelera, Qualcomm, Apple NE, ARM Ethos, NVIDIA Jetson, Intel Movidius."
trigger: /edge-deploy
---

# /edge-deploy

Edge AI deployment workflow for all major AI accelerators.

## Usage

```
/edge-deploy <model_path> --chip hailo8           # Deploy to Hailo-8
/edge-deploy <model_path> --chip axelera_metis     # Deploy to Axelera Metis
/edge-deploy <model_path> --chip apple_ne          # Deploy to Apple Neural Engine
/edge-deploy <model_path> --chip nvidia_jetson     # Deploy to NVIDIA Jetson
/edge-deploy <model_path> --chip qualcomm_hexagon  # Deploy to Qualcomm Hexagon DSP
/edge-deploy <model_path> --chip coral_tpu         # Deploy to Google Coral TPU
/edge-deploy <model_path> --chip arm_ethos         # Deploy to ARM Ethos-U
/edge-deploy <model_path> --recommend              # Recommend best chip
/edge-deploy <model_path> --compare-all            # Compare across all chips
```

## Supported Chips

| Chip | Vendor | TOPS/W | Max Model | Precisions |
|------|--------|--------|-----------|------------|
| Hailo-8 | Hailo | 26.0 | 500 MB | FP16, INT8, Binary |
| Hailo-15 | Hailo | 30.0 | 1000 MB | FP16, INT8, Binary |
| Axelera Metis | Axelera | 20.0 | 500 MB | FP16, INT8, Binary |
| Qualcomm Cloud AI 100 | Qualcomm | 15.0 | 4000 MB | FP16, INT8, INT4 |
| Apple Neural Engine | Apple | 35.0 | 2000 MB | FP16, INT8, Binary |
| NVIDIA Jetson Orin | NVIDIA | 15.0 | 8000 MB | FP32, FP16, INT8 |
| Google Coral TPU | Google | 8.0 | 30 MB | INT8 |
| ARM Ethos-U85 | ARM | 8.0 | 50 MB | INT8, INT4 |
| Rockchip RK3588 | Rockchip | 10.0 | 500 MB | FP16, INT8 |
| Intel Movidius NCS2 | Intel | 4.0 | 100 MB | FP16, INT8 |
| Kneron KL730 | Kneron | 15.0 | 200 MB | INT8, INT4, Binary |
| Syntiant NDP120 | Syntiant | 30.0 | 10 MB | INT8, Binary |

## Workflow

### Step 1 — Analyze Model
1. Read model file (ONNX, PyTorch, TFLite)
2. Get model size, parameter count, input/output shapes
3. Check precision requirements

### Step 2 — Recommend Chip
```python
from src.chip_support import recommend_chip, get_chip_specs

recs = recommend_chip(
    model_size_mb=model_size,
    power_budget_w=2.5,
    target_tops=20,
)
```

### Step 3 — Quantize (if needed)
```python
from src.quantize import Quantizer

quantizer = Quantizer()
quantized = quantizer.quantize_int8(model, calibration_data)
```

### Step 4 — Export
```python
from src.deploy import EdgeDeployer

deployer = EdgeDeployer(model=model)
onnx_path = deployer.export_onnx("model.onnx")
```

### Step 5 — Deploy
```python
# Hailo
output = EdgeDeployer.deploy_hailo("model.onnx", input_data, chip="hailo8")

# Axelera
output = EdgeDeployer.deploy_axelera("model.onnx", input_data)

# Apple NE
output = EdgeDeployer.deploy_apple_neural_engine("model.mlpackage", input_data)

# Qualcomm
output = EdgeDeployer.deploy_qualcomm("model.onnx", input_data, target="hexagon_dsp")
```

### Step 6 — Benchmark
```python
from src.benchmark import BenchmarkSuite

suite = BenchmarkSuite()
results = suite.measure_latency(model, input_shape)
```

## Output
- Quantized model for target chip
- Deployment package with instructions
- Benchmark results (latency, throughput, memory)
- Comparison table across chips
