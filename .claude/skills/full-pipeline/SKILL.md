---
name: full-pipeline
description: "End-to-end pipeline: capture, label, train, export, quantize, and build for target hardware."
---
# Full Pipeline

End-to-end workflow: capture images → auto-label (SAM2) → train YOLO → export ONNX → quantize INT8 → compile for hardware (Axelera, Hailo, TensorRT, OpenVINO, TFLite).

## When to Use
- Building a new model from scratch
- Adding new classes/data to an existing dataset
- Targeting new hardware
- Creating a baseline for experimentation

## Phases
1. **Prepare** — dataset dir + `dataset.yaml`, verify `builds/` and `runs/` paths
2. **Capture** — 100–200 images per class
3. **Auto-label** — SAM2, spot-check visually
4. **Train** — YOLO, monitor mAP/loss
5. **Export** — ONNX FP32, opset 17+, validate with `onnx.checker.check_model()`
6. **Quantize** — QDQ INT8, compare FP32 vs INT8, accuracy drop < 2%
7. **Compile** — per target into `builds/<target>/`
8. **Benchmark** — latency, throughput, memory

## Step-by-Step
```bash
# 1. Capture
python generateDataset4trainingWebcam.py --output dataset/ --class-name axelera --count 100
# 2. Label
python autoLabelSAM2.py --data dataset/ --classes axelera hailo pcie
# 3. Train
python trainYOLOv26.py --data dataset.yaml --epochs 50 --qat
# 4. Export
python convertONNX.py --weights runs/.../best.pt --opset 17
# 5. Quantize
python quantizeONNX2int8.py --model best_opt.onnx --calib-dir dataset/images/ --per-channel
# 6. Build
python buildModel4AIchip.py --model best_opt_preproc_int8.onnx --target axelera
# 7. Benchmark
python benchmarkModel.py --model builds/axelera/best.hef --target axelera
```

## Output Artifacts
```
dataset/images/{class}/  + dataset.yaml
runs/detect/train[N]/weights/{best.pt,last.pt}, best_opt.onnx, best_opt_preproc_int8.onnx, results.csv
builds/<target>/{compiled artifact, metrics.json}, quantization_report.md
```

## Resume / Rollback
```bash
python full_pipeline.py --resume-from train    --dataset dataset/
python full_pipeline.py --resume-from quantize --model best_opt.onnx
```

## Common Scenarios
- **New class** → capture + relabel all classes → retrain → re-export/quantize/build
- **Accuracy drop after quant** → see `debug-quantization` skill; re-quantize with 500+ calibration images
- **New hardware** → recompile only (do not retrain): `buildModel4AIchip.py --target <new>`
