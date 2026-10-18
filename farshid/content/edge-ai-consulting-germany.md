---
layout: farshid_default
title: "Embedded Edge AI & Computer Vision Consultant in Germany"
permalink: /notes/edge-ai-consulting-germany/
description: "Dr. Farshid Pirahansiah — independent embedded edge AI and computer vision consultant for teams in Germany. C++, CUDA, TensorRT, OpenVINO and NVIDIA Jetson optimization for production vision systems. 12+ years, 21 publications, 3 patents."
tags: [edge-ai-consultant, computer-vision-consultant, germany, embedded-ai, nvidia-jetson, tensorrt, cuda, openvino, quantization, industrial-vision, cpp]
lang: en
translation: edge-ai-beratung
---

# Embedded Edge AI & Computer Vision Consultant in Germany

I am **Dr. Farshid Pirahansiah**: an independent consultant for embedded edge AI and
computer vision, based in **Berlin, Germany** and working with engineering teams in Germany
and across Europe — remotely the whole working week, and on site for the milestones that
need a whiteboard. **12+ years**, **21 publications**, **3 patents**, and a working rule:
the model only counts once it runs on the device in front of the customer.

The teams I work with are not looking for a general machine-learning lecture. They
already have a model, a board, a deadline, and something that is too slow, too hot, or
not reproducible on the hardware they have to ship. *Deutschsprachige Zusammenfassung:*
[Edge AI & Computer Vision Beratung in Deutschland](/farshid/content/edge-ai-beratung.md).

## What I do for engineering teams in Germany

- **Production-ready vision pipelines** — camera capture, calibration, pre/post-processing
  and inference wired into a system that keeps its frame rate under load.
- **Hardware-level optimization** — quantization, kernel- and graph-level tuning, and a
  realistic measurement of what the target device can actually do.
- **Prototype rescue & technical due diligence** — a working demo that has to become a
  product, or a hardware/AI decision that has to be made before the budget is committed.
- **Team enablement** — paired engineering and review, so the knowledge stays in your team
  instead of in a slide deck.

## Hardware and software I optimize on

| Layer | What I work with |
|---|---|
| Edge accelerators | NVIDIA Jetson (AGX Orin, Orin Nano, Xavier), Google Coral TPU, Hailo-8, Intel NCS2, Kria KV260 FPGA |
| GPU & runtime | CUDA, TensorRT, cuDNN, OpenVINO, ONNX Runtime, GGUF/llama.cpp, MLX/CoreML on Apple silicon |
| Precision & compression | INT8 / FP16 quantization, calibration, layer fusion, structured pruning, KV-cache and memory budgeting |
| Vision & C++ | C++17/20, OpenCV, G-API, PyTorch → TensorRT deployment, Python/Numba/Cython hotspots |
| Microcontrollers & RISC-V | ESP32 / ESP32-C3 (ESP-IDF, Arduino, BLE HID, OLED UI, TinyML), RISC-V RV32/RV64 targets (ESP32-C3/C6 cores, K210/K230-class vision SoCs) |
| Systems | real-time pipelines, multi-camera synchronization, RDMA/Thunderbolt capture, thermal and power limits, MIPI/GStreamer |

## Pain points I am usually called for

These are the situations that bring teams to me. Each one is a real engineering problem
I have written up on this site — the links go to the notes, so you can judge the depth
before we ever talk.

### "Our detector runs at 4 FPS on the Jetson we already bought"

An FP32 PyTorch model on an embedded device is the classic case. The work: build a
TensorRT engine for the exact target, calibrate INT8 on your own images, move
pre-processing onto the GPU so the CPU stops being the bottleneck, and batch what can be
batched. See [CUDA development on Windows](/farshid/content/note-cuda-vscode.md) and
[How PyCUDA compiles and runs C kernels](/farshid/content/note-pycuda.md) for the
toolchain side, and the
[CV, DL & ML optimization guide](/farshid/content/optimization-index.md) for the
method-by-method approach.

### "It works on the workstation and falls apart on the device"

Memory ceilings, thermal throttling and a different operator set are three different
problems that look alike. The work: measure the real budget on the device, profile where
the frames are actually lost, and shrink the model to fit the memory you have.
The [local-LLM-on-a-weak-machine write-up](/farshid/content/local-llm-hermes-low-ram.md)
is the same method applied to a language model on an 8 GB machine.

### "We have cameras, but the system does not see reliably"

Calibration, sync and geometry before networks: multi-camera rigs where the frames do not
line up, optical flow that breaks under fast motion or changing light, 3D reconstruction
that drifts. See
[3D vision & real-time multi-camera systems](/farshid/content/note-3d-vision.md),
[Optical flow: challenges and solutions](/farshid/content/note-optical-flow.md) and the
[cabling notes for multi-camera capture](/farshid/content/cable-hub.md).

### "The problem starts below Linux: a microcontroller and a few hundred kilobytes"

ESP32 / ESP32-C3 firmware (which is a RISC-V core): sensor and camera work, BLE HID,
an OLED UI, and a model small enough to fit — flashed and measured with ESP-IDF or
Arduino. Working example on this site:
[four firmwares on one €3 RISC-V board](/farshid/content/esp32-c3-oled/). Broader ISA
and toolchain notes: [RISC-V for AI](/farshid/content/course-risc-v/).

### "We need a model on the device, without a cloud and without a GPU"

Small-model work for edge devices: choosing an architecture that fits, quantizing it, and
running it locally — from a 1-bit 4B language model on an old laptop
([notes](/farshid/content/local-llm-hermes-low-ram.md)) to
[image generation on 8 GB](/farshid/content/qwen-image-21-local.md), plus
[the ESP32-C3 board work](/farshid/content/esp32-c3-oled.md) where the whole budget is a
few hundred kilobytes.

## How an engagement usually works

1. **A call about the actual bottleneck** — the model, the hardware, the deadline and the
   accuracy that is non-negotiable. No slide deck, no discovery phase invoice.
2. **A short technical audit** — profiling on your target device, then a written finding:
   what is slow, what is fixable, what will not fit, and where the risk sits.
3. **Implementation together** — I work inside your repository and review flow, or hand
   your engineers a working reference they can extend. C++, Python and CUDA, in your
   toolchain and your CI.
4. **Hand-over** — the pipelines, the profiling script, and the reasoning, documented so
   the next engineer (or the next model) can reproduce it.

You can see what day-to-day work with me looks like in
[Mentoring, consulting & coaching](/farshid/content/post.md) and
[how I work with engineers and teams](/farshid/content/use-cases.md).

## Where I work

- **Based in Berlin, Germany** — remote across the whole country, same time zone, in
  English or German.
- **On site** for kick-offs, integration weeks and lab work in **Berlin** and anywhere in
  Germany reachable by train or a short flight.
- Fully remote engagements are possible anywhere the time zone works.

## Credentials

- **21 publications** — journal articles, conference papers and book chapters:
  [see the list](/farshid/content/atlas.md#publications).
- **3 patents** — moving-vehicle detection, facial analysis for advertising, and GAN-based
  face augmentation for surveillance:
  [patent pages](/farshid/content/atlas.md#publications).
- **Google Scholar** — [citation profile](https://scholar.google.com/citations?user=GvCEy4QAAAAJ&hl=en)
  with h-index 8 and 142 citations.
- **Mentoring track record** — the [CV coaching roadmap](/farshid/content/note-coaching-roadmap.md)
  I teach from, and an [OpenCV 5 cheat sheet](/farshid/downloads/opencv5-cheatsheet.pdf)
  used in real sessions.
- **Legal & privacy** — [Impressum / legal notice](/farshid/content/impressum.md) and
  [privacy policy](/farshid/content/privacy.md).

## Start here

- **Email** — [info@pirahansiah.com](mailto:info@pirahansiah.com) with the hardware, the
  model and the number that has to be met.
- **Book a call** — [calendly.com/pirahansiah/farshid](https://calendly.com/pirahansiah/farshid).
- **Everything I have published** on computer vision and edge AI —
  [the Atlas](/farshid/content/atlas.md) or [all pages](/farshid/content/wiki.md).

*Consulting and engineering work is carried out as an independent contractor; research
results and publication records are listed above and verifiable through the linked
sources. This page is available in German as
[Edge AI & Computer Vision Beratung in Deutschland](/farshid/content/edge-ai-beratung.md).*
