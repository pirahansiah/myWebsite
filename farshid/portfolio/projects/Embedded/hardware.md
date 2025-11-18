---
layout: default
title: "Experience with edge and embedded hardware including Raspberry Pi 4, NVIDIA Jetson platforms, depth cameras, FPGA, Hailo AI accelerators, and DSPs. Skilled in evaluating and optimizing their performance for real-time multi-camera computer vision applications that require camera synchronization and medical image processing on edge/IoT systems"
date_modified: 2025-09-20
categories: [image-processing, LLM , computer-vision]
tags: [AI, deep-learning, image-processing]
description: "Experience with edge and embedded hardware including Raspberry Pi 4, NVIDIA Jetson platforms, depth cameras, FPGA, Hailo AI accelerators, and DSPs. Skilled in evaluating and optimizing their performance for real-time multi-camera computer vision applications that require camera synchronization and medical image processing on edge/IoT systems An exploration of advanced algorithms and techniques in computer vision, ML, DL, LLM, LLMOPs, DevOps."
excerpt: "Dive deep into the latest advancements in computer vision, including deep learning methodologies and real-time image processing.Experience with edge and embedded hardware including Raspberry Pi 4, NVIDIA Jetson platforms, depth cameras, FPGA, Hailo AI accelerators, and DSPs. Skilled in evaluating and optimizing their performance for real-time multi-camera computer vision applications that require camera synchronization and medical image processing on edge/IoT systems"
author: "Dr. Farshid Pirahansiah"
---
Experience with edge and embedded hardware including Raspberry Pi 4, NVIDIA Jetson platforms, depth cameras, FPGA, Hailo AI accelerators, and DSPs. Skilled in evaluating and optimizing their performance for real-time multi-camera computer vision applications that require camera synchronization and medical image processing on edge/IoT systems


OpenCV AI Kit (OAK-D) + OpenVINO















English (rewritten): Combine all previous outputs in this chat into one complete Markdown format table and text.
German (rewritten): Kombiniere alle vorherigen Ausgaben in diesem Chat in ein vollständiges Markdown-Format mit Tabelle und Text.

⸻

Comparison of Raspberry Pi 2, Raspberry Pi 4, Raspberry Pi 5, OAK-D, and Jetson Thor 5000T

This document combines all details from earlier answers into one single Markdown format.
It includes hardware specs, camera support, AI TOPS, and example YOLO FPS.

⸻

1. Hardware and Camera Support

Model	CPU / SoC	GPU	RAM	Native CSI camera ports	USB / I/O	Networking	Power	Notes on camera support
Raspberry Pi 2 Model B	Broadcom BCM2836, Quad-core Cortex-A7 @ 900 MHz	VideoCore IV	1 GB	1 × CSI-2 (limited)	4 × USB2	10/100 Ethernet	~5 V via micro-USB	Only 1 native camera; USB 2 is bottleneck. Can handle 1 camera at low res (e.g. VGA or 720p low FPS).
Raspberry Pi 4 Model B	Broadcom BCM2711, Quad-core Cortex-A72 @ 1.5–1.8 GHz	VideoCore VI	1–8 GB	1 × CSI-2 (2-lane)	2 × USB3, 2 × USB2	Gigabit Ethernet, Wi-Fi, BT	~5 V, 3 A via USB-C	1 native camera; can add USB/IP cams. Real time possible for 1–2 cams (720p/1080p).
Raspberry Pi 5	Broadcom BCM2712, Quad-core Cortex-A76 @ 2.4 GHz	VideoCore VII	2–16 GB	2 × CSI/DSI transceivers (4-lane)	2 × USB3, 2 × USB2	GbE, Wi-Fi, BT	~5 V, up to 5 A USB-C	2 native CSI cameras supported. More possible with USB/IP cams. Best Pi option for multi-cam CV.
OAK-D (OpenCV AI Kit)	Intel Movidius Myriad X VPU (with ISP)	Myriad-X NPU	On-chip memory + host RAM	Stereo depth + RGB camera onboard	USB 3.0 to host	Host-dependent	~2–5 W	Built-in cameras (RGB + stereo). Runs NN on device, offloading Pi/PC.
NVIDIA Jetson AGX Thor (T5000)	14-core Arm Neoverse V3AE + Blackwell GPU + Tensor cores	Blackwell GPU, 2560 CUDA + NPU	Up to 128 GB LPDDR5X, 273 GB/s	Up to 16 CSI-2 lanes (≈6 physical cameras + 32 virtual)	Multi USB3, PCIe Gen5, NVMe, 25GbE	25GbE + Gigabit	40–130 W	Can handle many cameras in real time, both CSI and GMSL. Industrial level.


⸻

2. AI Performance (TOPS / TFLOPS)

Model	Dedicated AI accelerator	Reported TOPS / perf
Raspberry Pi 2	None	0 TOPS
Raspberry Pi 4	None	0 TOPS
Raspberry Pi 5	None	0 TOPS (external accelerators possible, e.g. Hailo, Coral)
OAK-D (Myriad X VPU)	Intel Myriad X Neural Compute Engine	~4 TOPS
Jetson AGX Thor	Blackwell GPU + Tensor cores	Up to 2070 FP4 TFLOPS (NVIDIA claim)


⸻

3. Example YOLOv8 Inference FPS (640×640 input, estimated)

Model	YOLOv8n (nano/light)	YOLOv8s (small)	YOLOv8m (mini/medium)	Notes
Raspberry Pi 2	~1–2 FPS	<1 FPS	<0.5 FPS	CPU too weak, only low res feasible
Raspberry Pi 4 (8 GB)	~5–15 FPS	~2–5 FPS	<1–2 FPS	Optimized builds (ONNX, TFLite, quantization) improve results
Raspberry Pi 5	~10–30 FPS	~4–10 FPS	~1–4 FPS	Best Pi option; still limited without external NPU
OAK-D (Myriad X)	~20–60 FPS	~6–15 FPS	~1–4 FPS	Runs inference directly on VPU; host load is low
Jetson AGX Thor	100–1000+ FPS	30–300 FPS	10–100 FPS	Depends on TensorRT optimization, precision (INT8/FP16/FP4)


⸻

4. Short takeaways
	•	Pi 2: Too weak for modern CV, useful only for 1 low-res cam.
	•	Pi 4: Can run 1–2 cameras with lightweight models, but no NPU.
	•	Pi 5: Stronger CPU/GPU, dual CSI ports, still limited by lack of NPU.
	•	OAK-D: Best compact choice if you need built-in depth + AI offload. ~4 TOPS on device.
	•	Jetson Thor: Industrial scale. Many cams, hundreds FPS for YOLO. High power.

⸻

Do you want me to export this as a clean .md file (so you can download and use directly)?




































C++

### hash
std::map<string,int> prices;
prices['aa']=310;
prices={'aa':310, 'bb':410}

### stack
std::stack<int> stk;
stk.push(5);
stk.pop(); //5

### queue 
std::queue<int> q;
q.push(5); ... 89
q.pop(); //5




from collections import deque
stk=deque()
stk.append('asadfas')
stk.pop() 
- o(n)
stk=[]
stk.pop().rstk[-1]

collections import lifo
deque()
appendLeft(5)
pop




### stack
- automatically managed 
- LIFO
- at compile time
- short term
- 8 MB : 8192 kb
- fast
- ulimit_a : show memory
- push / pop



### heap
- need managed by yourself
- if we need to use more than 8 MB we need to use heap
- run time;
- dynamic
- long time
- new/delete
- slower
- pointer 



- pmap 'pidof _____' | tail _n1 | grep_o '[0-9]*' | awk '{print $ 0/(1024*1024)" [GiB]"}'
- tools 
    - valgrind ./my_program
    - fsanitize = address

- echo %errorlevel%
- gflags /i  print+Greeting.ext +sls
- cdb printGreeting.ext




- start with "/" is absolute path
- start with "folder/file..." is relative path
- "/" is root
- "~" is home folder
- "." is current folder
- ".." is parent folder

- [a-c] is abc
- grep & ls.txt search inside file
- ";" calls all command one after
- && same but if error strop next
- "|" pipe

- htop
- struct like class that all members is public using for simple data
- 

### log level
1- debug
2- trace
3- info
4- critical
5- error
6- warning

- basic log
- defined


unit test
google test
md5sum

# git
- git fixes #xx
