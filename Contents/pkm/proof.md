---
layout: farshid_default
title: "Dr. Farshid Pirahansiah — Complete Portfolio"
tags: proof portfolio publications patents resources projects
categories: legacy
references: knowledge-graph, strategic-connections
related: about, atlas
---

# Table of Contents

- [About](#about)
- [Publications](#publications)
  - [Patents](#patents)
  - [Books](#books)
  - [Journals](#journals)
  - [Conference Papers](#conference-papers)
  - [Keynotes](#keynotes)
- [Camera Calibration Expertise](#camera-calibration-expertise)
- [Hardware & Platforms](#hardware--platforms)
- [Products & Tools](#products--tools)
- [Open Source](#open-source)
- [Technical Content](#technical-content)
  - [CUDA & GPU Programming](#cuda--gpu-programming)
  - [Optical Flow](#optical-flow)
  - [3D Vision & Multi-Camera](#3d-vision--multi-camera)
  - [Optimization](#optimization)
  - [AI & LLM](#ai--llm)
- [CV Coaching Roadmap](#cv-coaching-roadmap)
- [Courses](#courses)
- [Workshops & Events](#workshops--events)

---

# About

Dr. Farshid Pirahansiah — Computer Vision expert with 10+ years R&D. 3 AI patents, 141+ citations (h-index 7), Springer book chapter author. Specializes in real-time image processing, edge AI across Jetson, Raspberry Pi, Hailo, Axelera, ARM. Full-stack CV/DL: model training → fine-tuning → deployment → API integration.

**Metrics:** 21 publications (3 patents, 2 books, 6 journals, 11 conferences) · h-index 7 · i10-index 5 · LinkedIn 55K+ · Facebook 15K+

---

# Publications

## Patents

### 1. Face Image Augmentation — WO 2021/060971 A1

Generates realistic face images from surveillance video using GANs. Captures faces from multiple angles, augments through data transformations, selects high-quality images for training. Improves recognition in difficult environments with fuzzy logic quality filtering.

### 2. Advertisement via Facial Analysis — WO 2020/141969 A2

Facial recognition (CNN, GAN) adjusts digital advertisements based on user demographics and emotions. Identifies single/group users, provides customized content without collecting personal data. Uses unique matching mechanism correlating facial features with business goals.

### 3. Moving Vehicle Detection — WO 2021/107761 A1

Advanced image processing for vehicle detection. Illumination enhancement, Sobel edge detection, geometric noise filtering. Works in poor lighting. Filters noise using geometric features and relationship to key objects.

## Books

### Camera Calibration & Video Stabilization for Robot Localization

Springer chapter in "Control Engineering in Robotics and Industrial Automation". Camera calibration framework for robot localization.

### Computational Intelligence: Optical Flow for Video Stabilization

Explores augmented optical flow methods for video stabilization in "Computational Intelligence: From Theory to Application".

### OpenCV 5 Ebook

4 chapters: Introduction → Image Basics → Feature Detection → Advanced Topics. Plus "Computer Vision Meets LLM".

## Journals

1. Adaptive Image Thresholding Based on PSNR
2. Character & Object Recognition via Global Feature Extraction
3. PSNR Global Single Fuzzy Threshold
4. PSNR Threshold for Image Segmentation
5. 3D SLAM: Simultaneous Localization And Mapping Trends And Humanoid Robot Linkages
6. Using an Ant Colony Optimization Algorithm for Image Processing

## Conference Papers

1. 2D vs 3D Map for Environment Movement Objects
2. Adaptive Image Segmentation Based on PSNR for License Plate Recognition
3. Classification Techniques Using Enhanced Geometrical Topological Feature Analysis
4. Camera Calibration for Multi-Modal Robot Vision
5. Character Recognition Based on Global Feature
6. Comparison of Single Thresholding Method for Handwritten Images Segmentation
7. License Plate Recognition with Multi-Threshold Based on Entropy
8. Multi-threshold Approach for License Plate Recognition System
9. Pattern Image Significance for Camera Calibration
10. TafreshGrid: Grid Computing at Tafresh University
11. Computer Vision Meets LLM

## Keynotes

- LLMs Meet Computer Vision

---

# Camera Calibration Expertise

Expert across single-camera and multi-camera systems:

- **Standard RGB cameras** — common imaging tasks
- **High-resolution cameras** — precision industrial imaging
- **Depth cameras** — stereo vision, 3D reconstruction
- **Infrared cameras** — thermal, night vision
- **IoT camera systems** — real-time monitoring, smart environments
- **Robotic vision** — autonomous navigation, industrial robotics
- **Medical imaging** — precise calibration for surgical tools

**Techniques:** Fixed patterns (chessboard), dynamic automated calibration for real-time/mobile platforms. Works with robotics, IoT, medical technology, industrial automation.

---

# Hardware & Platforms

## AI Accelerators

- **Axelera AI M2** — Metis AIPU on Raspberry Pi 5, M.2 inference card
- **Hailo-15 SBC** — AI Vision Processor, Yocto Linux, full BSP
- **FPGA Xilinx Kria KV260** — Zynq UltraScale+ Vision AI Starter Kit
- **Intel Neural Compute Stick 2** — portable AI inference
- **OpenCV AI Kit** — integrated AI vision + depth sensing
- **Google Coral (TPU)** — on-device ML, low-latency
- **Nvidia Jetson Nano** — edge AI, accelerated vision
- **Nvidia GPU (RTX 1080–5090)** — high-performance training

## Edge Devices

- Raspberry Pi 3, 4, 5 — edge computing, low-power
- ARM platforms — mobile CV
- RISC-V chipsets — open-source scalable

## Platforms

- **ARM** — low-power mobile CV
- **Apple Silicon** — CoreML, MLX, Metal workflows
- **x86-64** — large-scale training

## OS

- Linux (preferred for CV), Windows, macOS

---

# Products & Tools

## AI Model Cost Calculator

Calculates text and image processing costs for GPT-4 Turbo, Gemini 1.5 Pro, Claude 3 Opus with real-time pricing estimates.

## Real-time OpenCV GUI

PyQt5-based function tester. Apply OpenCV functions on images with safe code execution, undo functionality. For learning and prototyping.

## 3D Camera Calibration

Calibration tools and demos for single and multi-camera systems.

## AI Todo List Telegram Mini App

IndexedDB persistence, multi-view calendar (day/week/month/year), cross-device compatible. Telegram Bot + Mini App integration.

## Telegram Bots

- **@pirahansiahbot** — Fine-tuned GPT-4 Mini on AWS Lambda for CV queries. Custom dataset, hyperparameter tuning, serverless deployment.
- **@image_processing_farshid_bot** — Send images, apply OpenCV functions (Canny, etc.), get instant results. Payment via TON/stars.
- **@item2cook_bot** — Photo to pencil sketch transformer.

## Custom ChatGPTs

- CV Developer — Python, OpenCV expertise
- MLOps & DevOps — pipeline optimization
- Career Companion — CV enhancement, interview prep
- German TutorBot — text correction, translations
- Simpli3D Creator — image-to-3D conversion
- Image Inspirer — creative image generation

## VSCode Extensions Pack

Essential tools for CV, ML, LLM, PKM: Better Comments, Prettier, Python, Jupyter, Docker.

---

# Open Source

## OpenCV NuGet Packages

Static OpenCV 5 library for Visual Studio. Install via NuGet Package Manager in minutes.

- **VS2019:** `Install-Package OpenCV5_StaticLib_VS2019_NuGet`
- **VS2022:** `Install-Package OpenCV5_StaticLib_VS22_NuGet`

Static opencv make: 200KB → 18MB, no DLL needed.

## cvTest — Computer Vision Testing Framework

Unit, integration, system, and acceptance tests for CV/DL. Tests processing time, memory, CPU usage. Output validation via PSNR, SSIM, image quality metrics. Hardware-specific benchmarks. Tests: auto brightness adjustment, sharpening kernel effectiveness, FPS measurement, OCR comparison.

## opencv-cpp

C++ OpenCV example projects and templates.

---

# Technical Content

## CUDA & GPU Programming

### CUDA + OpenCV + VSCode (Windows)

Setup for CUDA C++ development in VS Code:

**tasks.json** — Build task using nvcc with MSVC include/lib paths. Compiles main.cu → main.exe.

**settings.json** — Associates .cu files with C++ for syntax highlighting. Uses cmd.exe terminal.

**launch.json** — Debug config using cppvsdbg. Auto-builds before run, executes in external terminal.

**c_cpp_properties.json** — IntelliSense with CUDA and MSVC headers. Compiler: nvcc.exe, C++17 standard.

Tips: Use `${env:CUDA_PATH}` instead of hardcoding. Add `-g` for debug symbols. Consider CMake for larger projects.

### PyCUDA Kernel Explanation

PyCUDA runs CUDA kernels (C/C++) from Python:

1. **Import:** `pycuda.driver as cuda`, `pycuda.autoinit`
2. **Write kernel as string:**
```c
__global__ void add(int *a, int *b, int *result) {
    int idx = threadIdx.x + blockIdx.x * blockDim.x;
    result[idx] = a[idx] + b[idx];
}
```
3. **Compile:** `SourceModule(kernel_code)` — compiles at runtime
4. **Extract:** `mod.get_function("add")`
5. **Allocate GPU memory:** `cuda.mem_alloc()`, copy data with `cuda.memcpy_htod()`
6. **Run:** `add(a_gpu, b_gpu, result_gpu, block=(4,1,1), grid=(1,1))`
7. **Retrieve:** `cuda.memcpy_dtoh(result, result_gpu)`

### Numba JIT Tutorial

`@jit(nopython=True)` compiles Python to machine code at runtime. Skips Python interpreter entirely.

**Without Numba:**
```python
def sum_of_squares(arr):
    total = 0
    for num in arr:
        total += num * num
    return total
```

**With Numba:**
```python
from numba import jit

@jit(nopython=True)
def sum_of_squares_jit(arr):
    total = 0
    for num in arr:
        total += num * num
    return total
```

For 10M numbers: several times faster. Works for factorials, matrix multiplication, any numerical loop.

## Optical Flow

### Challenges & Solutions

**Illumination Variations:** Use CLAHE preprocessing, RAFT/PWC-Net deep models, NCC for robust matching.

```python
def robust_motion_estimation(frames):
    preprocessed = [cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8)).apply(f) for f in frames]
    return cv2.calcOpticalFlowFarneback(preprocessed[0], preprocessed[1], None, 0.5, 3, 15, 3, 5, 1.2, 0)
```

**Occlusions:** Bilateral filtering, backward-forward flow consistency check, MaskFlowNet.

**Fast Motion:** Pyramidal Lucas-Kanade, FlowNet2, PWC-Net for large displacements.

**Textureless Regions:** Farneback dense flow, smoothness constraints, RAFT.

**Motion Blur:** Wiener filtering, Dual TV-L1 optical flow, deblurring preprocessing.

**Real-time:** GPU-accelerated (CUDA OpenCV), LiteFlowNet, coarse-to-fine approaches.

**Scaling:** Downscale + multi-scale refinement, image pyramids.

### OpenCV Functions

- `cv2.calcOpticalFlowFarneback()` — dense optical flow
- `cv2.calcOpticalFlowPyrLK()` — sparse pyramidal Lucas-Kanade
- `cv2.createCLAHE()` — illumination normalization
- `cv2.cuda::calcOpticalFlowPyrLK()` — GPU-accelerated

## 3D Vision & Multi-Camera

### Depth to 3D Point Cloud

Deprojection using camera intrinsics:
```python
def deproject_point(u, v, depth, camera_matrix):
    fx, fy = camera_matrix[0,0], camera_matrix[1,1]
    cx, cy = camera_matrix[0,2], camera_matrix[1,2]
    return np.array([(u-cx)*depth/fx, (v-cy)*depth/fy, depth])
```

### 100-Camera Synchronization

**Reality check:** 100 HD cameras @ 30fps ≈ 6.5 Gbps raw. USB/PCIe bottlenecks. 2-4GB just for buffers.

**Recommended architecture (distributed):**
- 10 machines × 10 cameras each
- Compressed frames (MJPEG/H.264) over network
- Central machine decodes and displays synced grid

**Key tools:** ZMQ/gRPC for streaming, FFmpeg for encoding, OpenCV+CUDA for GPU decode.

**Best approach:** GStreamer with `ksvideosrc do-timestamp=true`, `queue max-size-buffers=1 leaky=2`, GPU MJPEG decode, Direct3D11 rendering. End-to-end latency ≤ 40ms.

**MF "no buffer" simulation:** `Flush()` before every `ReadSample()`, `MF_SOURCE_READER_IGNORE_CLOCK`, overwrite "latest frame only" in global array.

### Multi-Camera Transform

```python
def transform_point(point, matrix):
    point_homog = np.append(point, 1.0)
    transformed = np.dot(matrix, point_homog)
    return transformed[:3]
```

### Motion Detection from Point Cloud

Threshold-based: compare recent positions within time window, detect movement > 0.05 units.

## Optimization

### Deep Learning Optimization

**Model:** Quantization (INT8/FP16), Pruning, Knowledge Distillation

**Hardware:** GPU/TPU acceleration, CUDA/cuDNN

**Data Loading:** Multi-threaded DataLoader, real-time augmentation

**Architecture:** MobileNet, EfficientNet, ResNet

**Inference:** ONNX Runtime, TensorRT, OpenVINO

### Computer Vision Optimization

**Algorithms:** YOLO (real-time detection), MobileNet/SqueezeNet (embedded)

**Preprocessing:** Grayscale conversion, ROI focus, frame skipping

**Parallel:** Multi-threading, GPU processing via CUDA

**Features:** ORB, HOG — efficient extraction

**Edge:** NVIDIA Jetson, TFLite, FPGA/ASIC

### Data Optimization

**Collection:** Diverse sources, balanced classes, high-quality filtering

**Preprocessing:** Normalization, missing data handling, PCA/t-SNE

**Augmentation:** Rotation/scaling/cropping (CV), SMOTE (imbalanced), time-series shifts

### Underfitting vs Overfitting

**Underfitting fix:** More layers/features, complex models, more epochs, reduce learning rate

**Overfitting fix:** L1/L2 regularization, dropout, early stopping, data augmentation, reduce complexity, ensemble methods

### RAM Reduction

Attention sinks, mixed-precision training, lower-precision compute, reduce batch size, gradient accumulation, gradient checkpointing, CPU parameter offloading.

### Key Libraries

- **DL/ML:** PyTorch, TensorFlow, Keras, ONNX Runtime, TensorRT, OpenVINO
- **CV:** OpenCV, Pillow, FFmpeg, GStreamer
- **Data:** NumPy, Pandas, Albumentations, SMOTE
- **Acceleration:** Numba, PyCUDA, CuPy, TFLite
- **Distributed:** Horovod, Dask, Apache Spark
- **Tuning:** Ray Tune, GridSearchCV, RandomSearchCV

## AI & LLM

### Orchestrating AI Agents

Multi-agent systems for complex tasks. Components:
- **Agents:** Autonomous units (single-purpose or general-purpose)
- **Orchestrator:** Delegates tasks, monitors progress, combines results
- **Communication:** Message passing, API calls, shared memory

**Workflow:** Task decomposition → assign to specialized agents → monitor → aggregate results

**Benefits:** Efficiency (parallelization), scalability, flexibility, improved decision-making

**Challenges:** Coordination complexity, communication overhead, error handling, resource management

**Applications:** Research & analysis, content creation, project management

### LLM at the Edge (IoT)

1. **Ultra Low-Power** (watch MCUs): TinyML, quantization, pruning, Edge Impulse
2. **Common Edge** (Raspberry Pi 5): ONNX Runtime, TFLite, model distillation
3. **RISC-V**: Custom compiler optimization (TVM), RISC-V ML frameworks
4. **Nvidia Edge**: Jetson platform, CUDA, TensorRT, DeepStream SDK

### RAG vs CAG

- **RAG:** Retrieval-based, up-to-date info, more complex, slower
- **CAG:** Cache-based, faster responses, simpler, limited to stable data

### Emerging LLM Methods

- **Transformer²:** Self-adaptive weight matrices for real-time task adjustment
- **MML (Modular ML):** Smaller components, better reasoning, logic-based decisions
- **Mosaic:** Composite pruning — smaller models without performance loss

---

# CV Coaching Roadmap

## 1. Fundamentals

Image formation (cameras, lenses, sensors, lighting). Image representation (pixels, RGB/HSV/YCbCr). Sampling & quantization (resolution, bit depth).

## 2. Image Processing

Filtering (convolution, Gaussian, Sobel, Canny). Thresholding (Otsu, adaptive). Morphology (erosion, dilation). Histograms (equalization). Features (SIFT, SURF, ORB, FAST, Harris).

## 3. Object Detection & Recognition

Traditional: Haar cascades, HOG+SVM, template matching. Deep Learning: ResNet/VGG/EfficientNet, YOLO/Faster R-CNN/SSD, U-Net/DeepLab, Mask R-CNN.

## 4. Depth & 3D Vision

Stereo vision (disparity, epipolar). Structure from Motion. Depth sensors (LiDAR, RealSense, Kinect, ToF). SLAM (ORB-SLAM, LSD-SLAM).

## 5. Camera Calibration

Intrinsic/extrinsic parameters. Homographies, perspective warp. Epipolar geometry (fundamental/essential matrix).

## 6. Optical Flow & Motion

Dense vs sparse (Lucas-Kanade, Farneback, Horn-Schunck). Background subtraction (MOG2, KNN). Action recognition (pose, LSTM, 3D CNN).

## 7. Compression

JPEG/PNG (lossy/lossless). H.264/H.265 (video). Depth map compression.

## 8. Real-Time & Edge AI

Hardware acceleration (CUDA, TensorRT, OpenVINO). Frameworks (TFLite, ONNX Runtime, OpenCV DNN). Embedded (Jetson, Raspberry Pi, FPGAs).

## 9. Multi-Camera & Sensor Fusion

Camera synchronization. Multi-view geometry (3D reconstruction, triangulation). IMU+camera, LiDAR+camera fusion.

## 10. Applications

Autonomous vehicles (lane detection, tracking). Medical imaging (MRI/CT, anomaly detection). Surveillance (face recognition, crowd analysis). AR/VR (pose tracking, spatial mapping).

**Tools:** Python+OpenCV+NumPy, TensorFlow, PyTorch, scikit-image, SimpleITK, MATLAB.

---

# Courses

- **Machine Learning Specialization** — ML fundamentals with case studies
- **Full Stack Deep Learning** — end-to-end DL deployment
- **MLOps** — ML pipeline operations and monitoring
- **ROS** — Robot Operating System for automation
- **Parallel Programming** — GPU and multi-threading techniques
- **Modern C++** — C++17/20 for performance-critical systems
- **Cloud Native** — containerized AI deployment
- **IoT Scholarship** — IoT fundamentals for edge AI
- **TensorFlow Deployment** — TF serving and edge deployment

---

# Workshops & Events

- **RISC-V** — open-source processor architecture
- **Edge AI Summit** — on-device inference optimization
- **Embedded IoT** — AI on microcontrollers
- **Tesla AI** — autonomous driving and vision
- **AI Hardware** — custom accelerators and NPUs
- **OpenVINO** — Intel inference optimization toolkit
- **Metaverse** — XR and spatial computing
