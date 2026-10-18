---
layout: farshid_default
title: "RISC-V for AI"
permalink: /notes/courses/risc-v/
description: "RISC-V for edge AI: the open instruction set, the cores and boards that matter for embedded inference (ESP32-C3/C6, K210/K230, VisionFive 2), the vector extension, and the toolchains I use. From a 2020 course and RISC-V Summit notes, kept current."
tags: [risc-v, edge-ai, embedded, microcontroller, tinyml, esp32, hardware]
---

# RISC-V for AI

RISC-V is an open instruction-set architecture: anyone can implement it without a licence
from ARM or Intel, which is exactly why it has become the default choice for cheap
microcontrollers and for the new wave of small AI accelerators. For edge AI the practical
question is not "is RISC-V better than ARM" — it is *which* RISC-V core is on the board in
front of you, what it can do at inference time, and which toolchain will actually flash it.

**12+ years** of embedded computer vision work, and the smallest end of that work is where
RISC-V shows up: the [ESP32-C3 on my desk](/farshid/content/esp32-c3-oled.md) is a
single-core RISC-V SoC.

## Why RISC-V matters at the edge

- **No licence, no royalty** — a chip vendor can add exactly the units it needs (a vector
  unit, a DSP, an NPU) without a per-unit fee, which is how €3 boards with usable AI
  throughput exist at all.
- **Open toolchains** — `riscv64-unknown-elf-gcc`, or Clang with a RISC-V target; ESP-IDF,
  Zephyr and Linux all ship RISC-V support. No vendor IDE is required to build firmware.
- **From a microcontroller to Linux on one ISA** — RV32 microcontrollers with a few hundred
  kB of RAM up to RV64 application cores that run Linux and real OpenCV, so a pipeline can
  move down or up the range without changing architecture family.
- **Vector extension (RVV 1.0, ratified 2021)** — the piece that matters for computer
  vision: real SIMD for convolution, filtering and colour conversion on the CPU, and the
  baseline the RVA22/RVA23 profiles standardise for application-class parts.

## Cores and boards worth knowing

| Board / SoC | Core | What it is good for |
|---|---|---|
| ESP32-C3 / ESP32-C6 | single-core RV32IMC @160 MHz (C6 adds Wi-Fi 6) | sensor nodes, BLE HID, small displays, TinyML — [four firmwares on a €3 board](/farshid/content/esp32-c3-oled.md) |
| SiFive HiFive1 Rev B | FE310 RV32IMAC | learning the ISA bare-metal, peripheral work |
| Kendryte K210 / K230 | RV64GC + KPU accelerator | camera inference at a few watts (face, keyword, objects) |
| StarFive JH7110 (VisionFive 2) / Milk-V boards | quad RV64GC | Linux, OpenCV and a real vision pipeline on-device |
| Application-class RVA23 parts | RV64 with RVV | where the ecosystem is heading for GPU-less inference |

## Toolchains and frameworks I use

- **Firmware** — ESP-IDF (a native RISC-V toolchain is bundled) and Arduino-ESP32 for quick
  work; Zephyr where a real RTOS and a vendor-neutral HAL are needed.
- **Bare metal** — `riscv64-unknown-elf-gcc`, OpenOCD/GDB over JTAG, and objdump for reading
  what the compiler actually emitted.
- **TinyML** — TensorFlow Lite Micro and microTVM; models quantised to int8, and the
  operator set checked *before* an architecture is chosen.
- **Linux-class parts** — OpenCV and ONNX Runtime on RV64 boards, usually with the CPU doing
  the work and the KPU/NPU handling the heavy convolutions.
- **Cross-checking cost** — anything claimed about latency or memory gets measured on the
  board, not read from a datasheet. Same rule as on the
  [Jetson and TensorRT side](/farshid/content/edge-ai-consulting-germany.md).

## Key references

- RISC-V Magazine (December 2020)
- RISC-V Summit 2020
- [riscv.org](https://riscv.org/)
- [HiFive1 Rev B](https://www.amazon.de/-/en/HiFive1-Rev-B/dp/B086RGFS5N/)
- [RISC-V 15 minute sample course](https://www.eenewseurope.com/news/risc-v-boom-edge-ai-says-facebooks-chief-ai-scientist)

## Related on this site

- [ESP32-C3 OLED projects](/farshid/content/esp32-c3-oled.md) — the RISC-V board work, start to finish.
- [CV, DL & ML optimization guide](/farshid/content/optimization-index.md) — quantisation and pruning before any accelerator.
- [C++ quick reference](/farshid/content/note-cpp.md) — the language side of embedded work.
- [Edge AI & computer vision consulting in Germany](/farshid/content/edge-ai-consulting-germany.md) — where this work is applied.

#RISC-V #EdgeAI #FarshidPirahansiah
