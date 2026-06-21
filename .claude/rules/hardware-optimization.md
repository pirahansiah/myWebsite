# Hardware Optimization Rules

## Apple M5 Max
- Use Metal Performance Shaders (MPS) for GPU acceleration
- Leverage Unified Memory Architecture (no CPU↔GPU copy overhead)
- Use Core ML for on-device inference
- Optimize for Neural Engine (ANE) with coremltools
- Use MLX framework for Apple-optimized ML training

## NVIDIA Spark (128GB VRAM)
- Use CUDA 12.x with latest Tensor Cores
- Enable TF32 for fast training (no accuracy loss)
- Use cuDNN 9.x for optimized convolutions
- Batch size scaling for massive VRAM
- Use NCCL for multi-GPU communication
- Enable CUDA Graphs for kernel launch overhead reduction

## Intel Ultra 9 Gen 2
- Use AVX-512 for vectorized operations
- Leverage P-core/E-core hybrid scheduling
- Use Intel Extension for PyTorch (IPEX)
- Use OpenVINO for inference optimization
- Enable oneDNN for CPU-optimized operations

## Raspberry Pi 5 (16GB)
- Use NEON SIMD for ARM64 vectorization
- Optimize for L1/L2 cache (32KB/2MB)
- Use OpenCV with TBB for multi-threading
- Enable Vulkan compute for GPU offloading
- Use ONNX Runtime with ARM64 execution provider
- Minimize memory allocation in hot loops

## Cross-Platform
- Profile on all target hardware before optimizing
- Use CMake presets for platform-specific builds
- Benchmark with Google Benchmark or Catch2
- Track power consumption on edge devices
