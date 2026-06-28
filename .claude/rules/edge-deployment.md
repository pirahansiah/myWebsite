# Edge Hardware Deployment Rules

## General
- INT8 QDQ ONNX is the universal input format
- Run ORT graph optimisation (ORT_ENABLE_ALL) before target compilation
- All build artifacts go to `builds/` directory
- Always benchmark on CPU before deploying to device

## Axelera Metis
- Layer fusion, weight compression, activation reuse enabled
- Compile via `voyager` CLI or generate config JSON

## Hailo-8
- ONNX -> HAR -> HEF pipeline via ClientRunner

## TensorRT
- `trtexec` CLI or tensorrt Python API
- INT8 + FP16 combined precision preferred

## OpenVINO
- `openvino.tools.mo.convert_model()` with FP16 compression

## TFLite
- `onnx2tf` recommended; apply `tf.lite.Optimize.DEFAULT` for INT8
