---
name: full-pipeline
description: End-to-end: capture, label, train, export, quantize, compile, benchmark. Use when running the whole chain or resuming it mid-way.
effort: xhigh
---

# Full pipeline

Run only the stages that are missing. Every stage writes its artefact before the next starts, so a
run can resume after a failure.

## 0. Preconditions
- `dataset.yaml` exists; calibration set has 200+ images; target accelerator is named and pinned.
- `conda activate py314`.

## 1. Data - `collect-and-label`
- Capture at fixed resolution, label with SAM2, human-verify a sample, split by capture session.

## 2. Train
```bash
python trainYOLOv26.py --data dataset.yaml --epochs 50 --qat   # drop --qat for PTQ path
```
- Log to `runs/<timestamp>/`. Report mAP50/mAP75 on the val split, not the training loss.

## 3. Export
```bash
python convertONNX.py --weights best.pt --opset 17
python -c "import onnx;onnx.checker.check_model('best.onnx');print('ok')"
```

## 4. Optimize
```bash
python -m onnxsim best.onnx best_opt.onnx
```

## 5. Quantize - `quantize` / `debug-quantization`
```bash
python quantizeONNX2int8.py --model best_opt.onnx --calib-dir dataset/images/val --per-channel
```
- Write FP32 vs INT8 comparison to `builds/quantization_report.md`.

## 6. Compile - `edge-deploy`
```bash
python buildModel4AIchip.py --model best_opt_preproc_int8.onnx --target <TARGET>
```

## 7. Benchmark - `benchmark-model`
```bash
python benchmarkModel.py --model builds/<TARGET>/model.bin --target <TARGET>
```

## Done means
Every stage's artefact exists, the accuracy gate passed, and a real on-device inference was run.
Anything less is a partial run; say which stage stopped.
