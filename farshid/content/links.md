---
layout: default
title: "Links "
date_modified: 2024-10-14
categories: [image-processing, LLM , computer-vision]
tags: [AI, deep-learning, image-processing]
description: "An exploration of advanced algorithms and techniques in computer vision, ML, DL, LLM, LLMOPs, DevOps."
excerpt: "Dive deep into the latest advancements in computer vision, including deep learning methodologies and real-time image processing."
author: "Dr. Farshid Pirahansiah"
---

### tips
- [get markdown from url](https://r.jina.ai/YOUR_URL)

### Code
- python gui: https://hyperdiv.io
- Python Multithreading (3/25) : https://www.youtube.com/watch?v=fK72KDAWV38&list=PLs6THB5KHWo2k0OdWXbu_pB_0n2KzpGC1&index=7 
- data structure python : 20: https://www.youtube.com/watch?v=GnZ9ppr_zaI&list=PLeo1K3hjS3uu_n_a__MI_KktGTLYopZ12&index=16
- [ollama-vision]( https://github.com/codearrangertoo/ollama-vision/blob/main/llava/Dockerfile )

### FPGA

- [Introduction to FPGA Part 11 - RISC-V Softcore Processor | Digi-Key Electronics](https://www.youtube.com/watch?v=gJno9TloDj8)



### StartUp
- [How to Start a Startup 21 videos](https://www.youtube.com/watch?v=CBYhVcO4WgI&list=PL5q_lef6zVkaTY_cT1k7qFNF2TidHCe-1)
- Everything you need to plan, start, and grow your business. [Business Plan](https://www.venturekit.ai)


### CUDA
- [CUDA python](https://www.pyspur.dev/blog/introduction_cuda_programming)
- [CUDA PDF](https://docs.nvidia.com/cuda/pdf/CUDA_C_Programming_Guide.pdf)
- [CUDA ](https://cvw.cac.cornell.edu/gpu-architecture)
- [CUDA youtube playlist](https://www.youtube.com/playlist?list=PL1ysOEBe5977vlocXuRt6KBCYu_sdu1Ru)
- [CUDA flash attention algorithms](https://github.com/Maharshi-Pandya/cudacodes)
- Day 28: Performance Comparison: SYCL vs. CUDA — Benchmarks and Results | by Joel Joseph | Medium
- [LeetGPU - The GPU Programming Platform](https://leetgpu.com)
- [mini project how to program a gpu cuda c++](https://www.youtube.com/@0mean1sigma/playlists)
- 

### Tools
Dear ImGui is a bloat-free graphical user interface library for C++. It outputs optimized vertex buffers that you can render anytime in your 3D-pipeline-enabled application. It is fast, portable, renderer agnostic, and self-contained (no external dependencies).
[GitHub repo](https://github.com/ocornut/imgui)
- Minimize setup and maintenance.
- The core of Dear ImGui is self-contained within a few platform-agnostic files which you can easily compile in your application/engine. They are all the files in the root folder of the repository (imgui*.cpp, imgui*.h). No specific build process is required. You can add the .cpp files into your existing project.
- Backends for a variety of graphics API and rendering platforms are provided in the backends/ folder, along with example applications in the examples/ folder. You may also create your own backend. Anywhere where you can render textured triangles, you can render Dear ImGui.



---


* **OpenCV uses BGR by default** for images and video frames.
* **Convert to RGB only** when handing images to libraries that expect RGB (matplotlib, PIL, many ML models).
* **Don’t round-trip** BGR→RGB→BGR unless you must.

## Practical breakdown

* **Defaults**

  * `cv2.VideoCapture.read()` and `cv2.imread()` return **BGR** images.
  * `cv2.imshow()` expects **BGR** and will display colors correctly from BGR.

* **Processing**

  * Most OpenCV algorithms are color-space agnostic or expect **BGR** if they care about channel order.
  * Convert only when needed (e.g., HSV, GRAY) via `cv2.cvtColor`.

* **Drawing/text**

  * Color tuples are **BGR**. Example: `(255, 0, 0)` draws **blue**, not red.

* **`VideoCapture` caveat**

  * The switch **`CAP_PROP_CONVERT_RGB`** is **on by default**. If you set it to `False`, you’ll get the camera/codec’s native format (often YUV). Keep it `True` for BGR frames.

  ```python
  cap = cv2.VideoCapture(0)
  cap.set(cv2.CAP_PROP_CONVERT_RGB, True)  # default; frames are BGR
  ret, frame = cap.read()                  # BGR
  ```

* **`imread` / `imdecode` flags**

  * `IMREAD_COLOR` (default) → **BGR** (3 channels)
  * `IMREAD_UNCHANGED` → **BGRA** (keeps alpha)
  * `IMREAD_GRAYSCALE` → single channel
  * `IMREAD_ANYDEPTH` / `IMREAD_ANYCOLOR` may change depth/channels, but color order remains BGR when color is produced

* **URLs / streams**

  * `imread` doesn’t fetch HTTP(S) URLs directly—download then `imdecode`.
  * `VideoCapture` can open network streams (RTSP/HTTP if supported). With `CAP_PROP_CONVERT_RGB=True`, frames are **BGR**.

* **Displaying**

  * `cv2.imshow` expects **BGR** (or GRAY/BGRA). No need to convert back if you stayed in BGR.

* **When to convert to RGB**

  * **matplotlib** (`plt.imshow`):

    ```python
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    ```
  * **PIL**, **TensorFlow/PyTorch** models trained on RGB:

    ```python
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    ```
  * **OpenCV DNN**:

    ```python
    blob = cv2.dnn.blobFromImage(img, scalefactor=1/255.0, size=(W, H), swapRB=True)
    # swapRB=True converts BGR→RGB internally
    ```

## Typical loop (no RGB conversion needed)

```python
ret, frame = cap.read()        # frame is BGR
proc = your_opencv_ops(frame)  # stay in BGR or convert to GRAY/HSV as needed
cv2.imshow("view", proc)       # still BGR for display
```

## Converting only for external libs

```python
rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)  # for matplotlib/PIL/etc.
```
