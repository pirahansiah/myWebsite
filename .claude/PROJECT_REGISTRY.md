# Project Registry — All GitHub Repositories

> 43 repos (32 own + 11 forks)
> Last updated: 2026-06-20

---

## Active Python Projects (with code)

### 1. BI4CV — Business Intelligence Computer Vision
- **GitHub**: https://github.com/pirahansiah/BI4CV
- **Description**: Generative AI-powered BI dashboard for CV applications
- **Stack**: Python, FastAPI, Plotly Dash, Ollama, YOLO11, SAM-2
- **Status**: 27 tests, Docker, CI/CD
- **Ideas**:
  - Add real-time video streaming dashboard
  - Integrate RAG for natural language CV queries
  - Add multi-camera support
  - Create Grafana/Prometheus monitoring dashboard

### 2. cv-ml-pipline — CV ML Pipeline
- **GitHub**: https://github.com/pirahansiah/cv-ml-pipline
- **Description**: End-to-end ML pipeline with Docker, AWS, Kubernetes, TensorFlow, Seldon
- **Stack**: Python, Docker, Kubernetes, FastAPI, Seldon, Kubeflow
- **Status**: 18 tests, K8s manifests, CI/CD
- **Ideas**:
  - Add MLflow experiment tracking
  - Implement A/B testing for model deployment
  - Add model versioning with DVC
  - Create Terraform configs for AWS deployment

### 3. cv-dashboard-cicd — CI/CD Pipeline for CV Dashboard
- **GitHub**: https://github.com/pirahansiah/cv-dashboard-cicd
- **Description**: CI/CD pipeline for CV and LLM applications
- **Stack**: Python, GitHub Actions, Docker, joblib
- **Status**: Tests, CI/CD
- **Ideas**:
  - Add Trivy security scanning
  - Implement matrix testing (Python 3.10-3.13)
  - Add dependency caching
  - Create deployment pipeline to AWS/GCP

### 4. workshop_LLM — LLM Workshop
- **GitHub**: https://github.com/pirahansiah/workshop_LLM
- **Description**: CV + LLM workshop with 3D camera calibration
- **Stack**: Python, OpenCV, OpenAI API, chessboard calibration
- **Status**: 14 tests, Docker
- **Ideas**:
  - Add RAG pipeline for documentation
  - Integrate multimodal LLMs (GPT-4V, LLaVA)
  - Add real-time camera calibration with live feedback
  - Create interactive web UI for calibration

### 5. opencv_python — OpenCV Python Workshop
- **GitHub**: https://github.com/pirahansiah/opencv_python
- **Description**: OpenCV workshop with YOLO, SAM-2, video analysis, edge deploy
- **Stack**: Python, OpenCV, Ultralytics, ONNX Runtime, Albumentations
- **Status**: 6 new modules, tests, Docker
- **Ideas**:
  - Add real-time webcam YOLO detection
  - Create OpenCV function playground web app
  - Add video stabilization tutorial
  - Implement panorama stitching from multiple cameras

### 6. Computer_Vison_IoT — CV on Jetson Nano
- **GitHub**: https://github.com/pirahansiah/Computer_Vison_IoT
- **Description**: Edge CV deployment on Jetson, Raspberry Pi, Coral
- **Stack**: Python, OpenCV, edge AI
- **Status**: Tests, Docker
- **Ideas**:
  - Add TensorRT optimization for Jetson
  - Implement multi-camera edge processing
  - Add power consumption monitoring
  - Create remote deployment scripts

### 7. farshid — Workshop Computer Vision
- **GitHub**: https://github.com/pirahansiah/farshid
- **Description**: CV workshop with thresholding, line detection, video processing
- **Stack**: Python, OpenCV
- **Status**: 9 tests, Docker
- **Ideas**:
  - Add real-time object counting
  - Implement background subtraction for surveillance
  - Add motion detection alerts
  - Create video annotation tools

### 8. Smart-Auto-Video-Annotation — Auto Video AnnotationSmart-Auto-Video-Annotation-for-Labeling-Data-for-Training-`
- **GitHub**: https://github.com/pirahansiah/Smart-Auto-Video-Annotation-for-Labeling-Data-for-Training-
- **Description**: Full auto-annotation pipeline with YOLO, ByteTrack, COCO/YOLO export
- **Stack**: Python, Ultralytics, ByteTrack, scipy
- **Status**: 8 src modules, 6 tests, Docker
- **Ideas**:
  - Add interactive labeling UI (Streamlit/Gradio)
  - Implement active learning selection
  - Add label propagation across frames
  - Create batch processing for large datasets

### 9. Binary-DNN — Binary Neural Networks for Edge AIBinary-DNN-for-Intel-Movidius-Neural-Compute-Stick`
- **GitHub**: https://github.com/pirahansiah/Binary-DNN-for-Intel-Movidius-Neural-Compute-Stick
- **Description**: Binary/quantized DNN deployment across 18+ AI accelerators
- **Stack**: Python, PyTorch, NNCF, OpenVINO, Hailo, Axelera, Qualcomm
- **Status**: Full codebase, 18 chips supported, AI Archaeology doc
- **Ideas**:
  - Add automated chip recommendation based on model analysis
  - Create visual comparison dashboard
  - Add real-time benchmarking across chips
  - Implement model partitioning for multi-chip inference

### 10. new — CI/CD Test Repository
- **GitHub**: https://github.com/pirahansiah/new
- **Description**: Legacy AppVeyor CI test repo
- **Stack**: Python, AppVeyor
- **Ideas**:
  - Migrate to GitHub Actions
  - Add modern Python CI/CD
  - Create template for new projects

---

## C++ Projects (with code)

### 11. opencv4 — OpenCV 4 with Deep Learning
- **GitHub**: https://github.com/pirahansiah/opencv4
- **Description**: OpenCV 4 DNN inference (TensorFlow, Caffe) for VS2017
- **Stack**: C++, OpenCV 4, DNN module
- **Ideas**:
  - Add YOLOv8 inference example
  - Implement ONNX Runtime integration
  - Add TensorRT acceleration
  - Create CMake build system

### 12. cvtest — Computer Vision Testing Framework
- **GitHub**: https://github.com/pirahansiah/cvtest
- **Description**: CV/DL testing with Google Test, Docker, CMake
- **Stack**: C++, OpenCV 5, Google Test, CMake
- **Status**: CMake, Docker, tests
- **Ideas**:
  - Add performance benchmarking suite
  - Implement image quality metrics (PSNR, SSIM)
  - Add CI/CD pipeline
  - Create cross-platform build scripts

### 13. tensorflowOpencv — TensorFlow + OpenCV C++
- **GitHub**: https://github.com/pirahansiah/tensorflowOpencv
- **Description**: TF 1.3 + OpenCV 3.3 integration (legacy)
- **Stack**: C++, TensorFlow, OpenCV
- **Ideas**:
  - Migrate to TF 2.x / OpenCV 5
  - Add ONNX Runtime backend
  - Modernize to C++17
  - Add CMake build system

### 14. opencv5vs2022 — OpenCV 5 for VS2022
- **GitHub**: https://github.com/pirahansiah/opencv5vs2022
- **Description**: Complete OpenCV 5 static library build (344 files, 149K lines)
- **Stack**: C++, OpenCV 5, Visual Studio 2022
- **Ideas**:
  - Add NuGet package publishing
  - Create Docker build environment
  - Add cross-compilation support
  - Create CI/CD for automated builds

---

## Pre-built Libraries (no source code)

### 15-19. OpenCV Legacy Builds
| Repo | Version | VS | Notes |
|------|---------|-----|-------|
| opencv | 3.0 | VS2015 | Legacy |
| opencv32vs2013win64 | 3.2 | VS2013 | Legacy |
| opencv33noGPUvs201764bit | 3.3 | VS2017 | CPU-only |
| OpenCV34 | 3.4 | VS2015 | Legacy |
| FullBuildOpenCV31vs2015win64november2016withoutCUDA | 3.1 | VS2015 | Legacy |

---

## Documentation & Content

### 20. Awesome-LLM (Fork)
- **Description**: Curated list of LLM resources
- **Ideas**: Add 2025-2026 papers, new open-source models

### 21. book — OpenCV 5 Ebook
- **Description**: OpenCV 5 ebook with 4 chapters
- **Ideas**:
  - Add interactive Jupyter notebooks
  - Create video tutorials
  - Add practice exercises
  - Publish as online course

### 22. Computer-Vision — CV Website
- **Description**: Computer vision reference website
- **Ideas**:
  - Add interactive demos
  - Create comparison tables
  - Add benchmark results
  - Add video examples

### 23. eot-training-multi-object-tracking
- **Description**: MOT training pipeline
- **Ideas**:
  - Add MOTRv3 implementation
  - Create benchmark evaluation
  - Add visualization tools
  - Create training scripts

---

## Web & Content

### 24. myWebsite — pirahansiah.com
- **Description**: Jekyll-based personal website
- **Ideas**:
  - Add portfolio gallery
  - Create interactive project pages
  - Add blog section
  - Add newsletter signup

### 25. pirahansiah.github.io — GitHub Pages
- **Description**: GitHub Pages portfolio site
- **Ideas**:
  - Add project showcases
  - Create interactive demos
  - Add publication list

### 26. draftSite — Draft Website
- **Description**: Content development staging
- **Ideas**:
  - Add A/B testing
  - Create preview environment

---

## PKM & Productivity

### 27. PKM — Personal Knowledge Management
- **Description**: Zettelkasten with Obsidian integration
- **Ideas**:
  - Add AI-powered search
  - Create knowledge graph visualization
  - Add automated tagging

### 28. obsidian — Obsidian Vault
- **Description**: 100+ notes, 9 categories, 25+ plugins
- **Ideas**:
  - Add Smart Connections integration
  - Create code snippets index
  - Add automated backup

### 29. vscode-extensions-farshid
- **Description**: Curated VSCode extensions
- **Ideas**:
  - Add more CV/ML extensions
  - Create extension pack

### 30. autoUpdateMD
- **Description**: VSCode markdown auto-update
- **Ideas**:
  - Add more update triggers
  - Create CI/CD integration

---

## Blockchain & Crypto

### 31. solana_token — Tiziran Token (TIZ)
- **Description**: Solana SPL token with Token-2022
- **Ideas**:
  - Add staking rewards
  - Create token dashboard
  - Add multi-chain bridge

### 32. CustomCrypocurrency (Fork)
- **Description**: Custom blockchain implementation
- **Ideas**:
  - Add smart contracts
  - Create wallet UI
  - Add mining simulation

---

## Forks (upstream contributions)

| Repo | Source | Purpose |
|------|--------|---------|
| Awesome-LLM | hm-ai-lab | LLM resources |
| ChatDev | OpenBMB | Multi-agent software dev |
| FairMOT | ifzhang | Multi-object tracking |
| sefr | szathML | Linear classifier |
| CD4ML-Scenarios | thoughtworks | CD4ML workshops |
| contoso-chat | Azure-Samples | RAG application |
| SemanticImage | nicklockwood | iOS image filters |
| my-mind | ondras | Mind mapping |
| UltimateLabeling | alex0112358 | Video labeling |
| CustomCrypocurrency | hyperledger | Blockchain |
| token-list | solana-labs | Token registry |

---

## Project Ideas (Prioritized)

### High Priority (Active Development)
1. **BI4CV**: Add RAG pipeline, real-time streaming, multi-camera
2. **cv-ml-pipline**: Add MLflow, A/B testing, Terraform
3. **opencv_python**: Add webcam YOLO, web playground, video stabilization
4. **Smart-Auto-Video-Annotation**: Add interactive UI, active learning, batch processing
5. **Binary-DNN**: Add chip recommendation, visual dashboard, multi-chip inference

### Medium Priority (Enhancement)
6. **workshop_LLM**: Add RAG, multimodal LLMs, interactive calibration
7. **Computer_Vison_IoT**: Add TensorRT, multi-camera edge, power monitoring
8. **farshid**: Add object counting, background subtraction, motion alerts
9. **cv-dashboard-cicd**: Add Trivy, matrix testing, dependency caching
10. **book**: Add Jupyter notebooks, video tutorials, practice exercises

### Low Priority (Future)
11. **opencv4**: Migrate to OpenCV 5, add ONNX Runtime
12. **tensorflowOpencv**: Modernize to TF 2.x / OpenCV 5
13. **cvtest**: Add benchmarking, image quality metrics
14. **new**: Migrate to GitHub Actions
15. **autoUpdateMD**: Add more triggers, CI/CD integration
