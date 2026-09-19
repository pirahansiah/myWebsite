---
layout: farshid_default
title: "IoT Scholarship: Edge AI with OpenVINO"
permalink: /notes/courses/iot-scholarship/
description: "IoT and Edge AI with OpenVINO: face recognition, object detection, pose estimation, and semantic segmentation."
---

IoT and Edge AI with OpenVINO: face recognition, object detection, pose estimation, and semantic segmentation.

# IoT Scholarship Foundation

## Edge AI with Intel OpenVINO

### Key Models
- Face recognition: OpenCV 4.1.1
- Image classification: Deep learning with high accuracy
- Object detection: MobileNet SSD (~5 FPS)
- Pose estimation: Very fast and accurate
- Coral TPU: Good performance with modifications
- Intel Movidius Stick 2: Good with OpenCV and Python

### OpenVINO Pipeline
1. Pre-trained models from Open Model Zoo
2. Model Optimizer: TF/PyTorch/Caffe → IR format
3. Inference Engine: Run optimized IR models
4. Edge deployment: Input streams, MQTT, web serving

### Model Types
- Classification (yes/no, 1000 classes, 20K ImageNet)
- Detection (bounding boxes + classification)
- Segmentation (semantic: all same class; instance: separate objects)
- Pose estimation
- Text recognition
- GANs

#IoT #OpenVINO #EdgeAI #FarshidPirahansiah