# ONNX & Quantization Rules

## ONNX Export
- Opset 17+ required for hardware accelerator compatibility
- Always validate: `onnx.checker.check_model()` after every export/transform
- Run shape inference before optimisation
- Apply graph passes: BN fusion -> constant folding -> dead-end elimination -> simplifier

## Quantization
- QDQ format only (QuantizeLinear/DequantizeLinear nodes)
- Per-channel weight quantization by default
- Weight type: QInt8 (signed), Activation type: QUInt8 (unsigned)
- Calibration: 200+ real images (use 500+ if problematic)
- Compare FP32 vs INT8 size and latency after every quantization

## QAT
- Use `torch.ao.quantization` for fake-quant observers
- `MovingAveragePerChannelMinMaxObserver` for weights
- `MovingAverageMinMaxObserver` for activations
