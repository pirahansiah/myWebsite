Publications, patents, expertise, tools, and GitHub projects across CV and AI

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
- [GitHub Projects Portfolio](#github-projects-portfolio)

---

# About

Dr. Farshid Pirahansiah — Computer Vision expert with 12+ years R&D. 3 AI patents, 141+ citations (h-index 7), Springer book chapter author. Specializes in real-time image processing, edge AI across Jetson, Raspberry Pi, Hailo, Axelera, ARM. Full-stack CV/DL: model training → fine-tuning → deployment → API integration.

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

---

# GitHub Projects Portfolio

All open-source projects at [github.com/pirahansiah](https://github.com/pirahansiah). Modernized to Python 3.10+ / C++17 / OpenCV 5 with type hints, tests, Docker, and CI/CD.

## AI & Machine Learning

### [BI4CV](https://github.com/pirahansiah/BI4CV) — Business Intelligence Computer Vision

Generative AI-powered BI dashboard for computer vision applications. Processes images/videos through CV pipelines, extracts metadata, and visualizes analytics via Plotly Dash. Integrates Ollama for local LLM inference, YOLO11 for detection, SAM-2 for segmentation. FastAPI microservices architecture with 27 pytest tests, Docker deployment, and GitHub Actions CI/CD. 715 lines of Python across 9 modules.

### [cv-ml-pipline](https://github.com/pirahansiah/cv-ml-pipline) — CV ML Pipeline

End-to-end machine learning pipeline with Docker, AWS, Kubernetes, TensorFlow, Seldon, and Kubeflow. Includes FastAPI inference server, Seldon model wrapper, and Poetry-managed project. Modernized from TF 1.15 to PyTorch 2.x with 18 pytest tests, Kubernetes manifests (Deployment, Service, HPA), and CI/CD matrix testing across Python 3.11-3.13. 261 lines across 13 files.

### [cv-dashboard-cicd](https://github.com/pirahansiah/cv-dashboard-cicd) — CI/CD Pipeline for CV Dashboard

Production CI/CD pipeline for computer vision and LLM applications. GitHub Actions with matrix testing (Python 3.10-3.13), Trivy security scanning, Docker multi-stage builds, and artifact management. Linear regression training pipeline with joblib serialization. Updated from Python 3.8 EOL to modern stack with pyproject.toml and Docker Compose.

### [workshop_LLM](https://github.com/pirahansiah/workshop_LLM) — LLM Workshop

Computer vision and 3D multi-camera calibration workshop. Covers corner detection, chessboard calibration, camera matrix computation, and stereo vision. Uses OpenCV with type hints, pathlib, and 14 pytest tests. Docker containerized environment. Modern LLM integration patterns with OpenAI API v2.x. 655 lines across 6 modules.

### [Python-DeepLearning-ComputerVision](https://github.com/pirahansiah/Python-DeepLearning-ComputerVision) — Python DL for CV

Dataset management tools (FiftyOne, Roboflow, WebDataset) for deep learning computer vision applications. Kaggle dataset preparation and modification utilities. Modernized with usage examples and latest dataset management frameworks.

### [Deep_Reinforcement_Learning](https://github.com/pirahansiah/Deep_Reinforcement_Learning) — Deep RL

Deep reinforcement learning implementations covering classical methods (DQN, A2C, PPO) and modern SOTA (Dreamer V3, DIAMOND). Includes foundation agents (RT-2, OpenVLA, V-JEPA 2), offline RL, and RLHF/DPO alignment. Cross-platform: C++ and Python on Windows, Mac, Ubuntu.

## Computer Vision

### [opencv_python](https://github.com/pirahansiah/opencv_python) — OpenCV Python Workshop

Python-based OpenCV workshop covering image processing fundamentals. Modernized to Python 3.10+ with type hints, pathlib, and latest OpenCV 4.13+ patterns. Fixed `save_image_opencv` bug (was passing lists to `imwrite`). 6 Python modules with pytest tests, Docker deployment. 233 lines across 6 files.

### [opencv4](https://github.com/pirahansiah/opencv4) — OpenCV 4 with Deep Learning

OpenCV 4 deep learning integration. Model format support (ONNX, TensorFlow, Caffe, PyTorch) with inference backend comparison (CPU, CUDA, OpenVINO, TensorRT). C++ implementations with modern CMake build system.

### [opencv5vs2022](https://github.com/pirahansiah/opencv5vs2022) — OpenCV 5 for VS2022

Complete OpenCV 5 static library build for Visual Studio 2022. 344 C++ files (149K lines) covering all OpenCV modules. NuGet packages for easy VS integration. Modern deployment stack with G-API, Vulkan compute, and CUDA acceleration support.

### [OpenCV34](https://github.com/pirahansiah/OpenCV34) — OpenCV 3.4 for VS2015

OpenCV 3.4 pre-built binaries for Visual Studio 2015. Legacy build with modern alternatives table. Migration guide to OpenCV 4.10+ with version comparison and upgrade path documentation.

### [opencv](https://github.com/pirahansiah/opencv) — OpenCV 3 C++ Projects

Comprehensive OpenCV 3 C++ project collection. Image processing, feature detection, object tracking, camera calibration, stereo vision. DNN module integration for deep learning inference. Extensive example code with modern C++ patterns.

### [opencv32vs2013win64](https://github.com/pirahansiah/opencv32vs2013win64) — OpenCV 3.2 for VS2013

OpenCV 3.2 static library build for Visual Studio 2013, Windows 64-bit. Legacy build artifacts with upgrade documentation to modern OpenCV versions.

### [opencv33noGPUvs201764bit](https://github.com/pirahansiah/opencv33noGPUvs201764bit) — OpenCV 3.3 CPU-Only

OpenCV 3.3 CPU-only build for Visual Studio 2017. No CUDA dependency. CPU vs GPU performance comparison tables. Suitable for systems without NVIDIA GPUs.

### [cvtest](https://github.com/pirahansiah/cvtest) — Computer Vision Testing Framework

Unit, integration, system, and acceptance tests for CV/DL applications. Tests processing time, memory, CPU usage. Output validation via PSNR, SSIM, image quality metrics. CMake build system with Google Test. Fixed off-by-one bug in histogram computation. C++17 modernized code with Docker support. 222 lines across 3 C++ files.

### [Computer_Vison_IoT](https://github.com/pirahansiah/Computer_Vison_IoT) — CV on Jetson Nano

Computer vision deployment on edge IoT devices (Jetson Nano, Raspberry Pi, Coral). Lane detection pipeline with Canny edge detection and region-of-interest masking. Modernized to Python 3.10+ with type hints, pytest tests, and Docker. Edge AI optimization techniques: INT8 quantization, pruning, distillation. 247 lines across 4 Python files.

### [Smart-Auto-Video-Annotation-for-Labeling-Data-for-Training-](https://github.com/pirahansiah/Smart-Auto-Video-Annotation-for-Labeling-Data-for-Training-) — Auto Video Annotation

Smart auto video annotation for labeling training data with integrated tracking. Multi-object tracking pipeline (MOT) using YOLOv11, RT-DETR, and Grounding DINO 2. Comparison of auto-labeling tools (Label Studio, Roboflow, CVAT).

### [Augmented-Synthetic-Data-set-for-Deep-Learnin](https://github.com/pirahansiah/Augmented-Synthetic-Data-set-for-Deep-Learnin) — Synthetic Data Augmentation

C++11 OpenCV augmentation pipeline generating 36-360 augmented variants per image. Scale, rotate, contrast/brightness, bilateral filter, blur, dilate/erode chain. Modernized with GPU-accelerated CUDA migration path. 252 lines with benchmarking data for M5 Max, NVIDIA Spark, Intel Ultra 9, Raspberry Pi 5.

### [ConvertJason](https://github.com/pirahansiah/ConvertJason) — JSON Annotation Converter

Converts JSON annotation files (COCO, LabelMe, VGG) for Detectron2 training format. Modern annotation tools reference: YOLO11, SAM2, Grounding DINO. Documentation and conversion pipeline for dataset preparation.

### [eot-training-multi-object-tracking](https://github.com/pirahansiah/eot-training-multi-object-tracking) — Multi-Object Tracking Training

Training pipeline for multi-object tracking (MOT). MOTRv3, StrongSORT, OC-SORT SOTA implementations. 6-benchmark evaluation framework with cross-platform vision (NVIDIA/Apple/ARM).

## 3D Vision & Robotics

### [Binary-DNN-for-Intel-Movidius-Neural-Compute-Stick](https://github.com/pirahansiah/Binary-DNN-for-Intel-Movidius-Neural-Compute-Stick) — Binary DNN for Edge

Binary deep neural networks optimized for Intel Movidius Neural Compute Stick. Quantized inference for low-power edge deployment. Model compression and binarization techniques.

### [All-in-One-Jetson](https://github.com/pirahansiah/All-in-One-Jetson) — Jetson Setup Scripts

All-in-one setup scripts for NVIDIA Jetson platforms. Installs TensorFlow, PyTorch, ROS, OpenCV, CUDA dependencies. Automated environment configuration for edge AI development.

### [tensorflowOpencv](https://github.com/pirahansiah/tensorflowOpencv) — TensorFlow + OpenCV C++

TensorFlow and OpenCV integration in C++. Legacy OpenCV 3.3 DNN module usage with deprecated `dnn::Importer` and `dnn::Blob` APIs. Modernization path to current OpenCV 5 DNN API.

## Web & Applications

### [myWebsite](https://github.com/pirahansiah/myWebsite) — pirahansiah.com

Personal website and blog. Jekyll-based with knowledge graph integration, portfolio showcase, and technical content. Published articles on computer vision, AI, and edge computing.

### [pirahansiah.github.io](https://github.com/pirahansiah/pirahansiah.github.io) — GitHub Pages

GitHub Pages site with CV/DL portfolio. Research publications, patent documentation, and technical tutorials.

### [draftSite](https://github.com/pirahansiah/draftSite) — Draft Website

Draft website for content development and testing. New features and articles staged before production deployment.

### [book](https://github.com/pirahansiah/book) — OpenCV 5 Ebook

OpenCV 5 ebook project covering 4 chapters: Introduction, Image Basics, Feature Detection, Advanced Topics. Plus "Computer Vision Meets LLM" chapter. Modern CV/DL learning path with 2025-2026 tools and references.

## PKM & Productivity

### [PKM](https://github.com/pirahansiah/PKM) — Personal Knowledge Management

Personal knowledge management system. Zettelkasten methodology with Obsidian integration. Knowledge graph construction, note linking, and retrieval-augmented workflows.

### [obsidian](https://github.com/pirahansiah/obsidian) — Obsidian Vault

Obsidian knowledge vault with 100+ notes across 9 categories. 5+ Maps of Content (MOCs), 25+ plugins. Zettelkasten methodology since 2022. AI integration (Smart Connections, Copilot). Code snippets, research notes, project documentation.

### [vscode-extensions-farshid](https://github.com/pirahansiah/vscode-extensions-farshid) — VSCode Extension Pack

Curated VSCode extensions for CV, ML, LLM, and PKM workflows. Better Comments, Prettier, Python, Jupyter, Docker, and domain-specific tools.

### [autoUpdateMD](https://github.com/pirahansiah/autoUpdateMD) — Auto Update Markdown

VSCode extension for automatically updating markdown files. Keeps documentation synchronized with code changes.

## Workshop & Education

### [farshid](https://github.com/pirahansiah/farshid) — Workshop Computer Vision

Comprehensive CV workshop materials. Image processing, thresholding, line detection, video processing. Modernized to Python 3.10+ with type hints, pathlib, 4 pytest tests, Docker. 489 lines across 9 files.

### [farshid-ai-webclip](https://github.com/pirahansiah/farshid-ai-webclip) — AI WebClip

Local LLM-powered tool for saving URL information based on custom templates. Web content extraction and knowledge management with AI summarization.

### [farshid-mcp-imageProcessing](https://github.com/pirahansiah/farshid-mcp-imageProcessing) — MCP Image Processing

Model Context Protocol (MCP) server for local OpenCV image processing. Standardized AI tool interface for image manipulation and analysis.

## Blockchain & Crypto

### [solana_token](https://github.com/pirahansiah/solana_token) — Solana SPL Token (TIZ)

Solana SPL token configuration with Token-2022 extensions. Jito SDK integration for MEV protection, Helius SDK for monitoring. State compression for 5,000x cost reduction.

### [CustomCrypocurrency](https://github.com/pirahansiah/CustomCrypocurrency) — Custom Cryptocurrency

Custom blockchain cryptocurrency implementation. Python-based blockchain with transaction validation, proof-of-work consensus, and wallet management. Educational implementation of blockchain fundamentals.

## Documentation & Reference

### [Computer-Vision](https://github.com/pirahansiah/Computer-Vision) — Computer Vision Website

Computer vision reference website covering classical algorithms (SIFT, ORB, HOG+SVM) and 2025-2026 SOTA models (RT-DETR v2, YOLO11, SAM 2, Grounding DINO). Hosted on GitHub Pages.

### [Awesome-LLM](https://github.com/pirahansiah/Awesome-LLM) — Curated LLM Resources

Comprehensive list of Large Language Model resources. 15+ milestone papers (DeepSeek-R1, Llama 3, GPT-4o, Claude 3.5), 15+ open LLMs, 10+ training frameworks (Unsloth, LLaMA-Factory), 12+ deployment tools (SGLang, LM Studio, Ollama), 10+ agent frameworks (DSPy, CrewAI, LangGraph).

### [SemanticImage](https://github.com/pirahansiah/SemanticImage) — Image/Video Filters

Zero-dependency Swift Package for on-device image/video segmentation. Apple Vision Framework + Core ML integration. iOS 14+ with dual segmentation paths (Core ML fallback for iOS 14, native Vision for iOS 15+).

### [my-mind](https://github.com/pirahansiah/my-mind) — Online Mindmapping

Browser-based mind mapping tool with ES5 vanilla JavaScript. Firebase real-time collaboration, 6 storage backends, 3 layout engines (graph, map, tree), command pattern architecture. Multi-format export (Freemind, MindNode, Markdown).

### [new](https://github.com/pirahansiah/new) — CI/CD Test Repository

Legacy AppVeyor CI configuration targeting Python 3.4/3.6. Migration template for modern GitHub Actions with Python 3.14+.

### [NewRepo](https://github.com/pirahansiah/NewRepo) — C++ Starter Project

Visual Studio 2022 C++ starter project. Hello World template with modern C++23 features (std::print, ranges). Migration target for legacy C++ projects.

## Infrastructure

### [aws](https://github.com/pirahansiah/aws) — AWS Infrastructure

AWS infrastructure configuration. Bedrock (Claude 4, Llama 4), SageMaker, modern AWS AI/ML stack. Telegram bot integration with serverless deployment. 72% cost optimization through Lambda SnapStart.

### [cvtest/CAREER_IMPACT.md](https://github.com/pirahansiah/cvtest) — Career Impact Report

Technical achievement documentation. STAR-format resume bullets, benchmarking data, and industry firsts across all CV/DL projects.

---

#farshid
#pirahansiah
#drfarshidpirahansiah
#AI