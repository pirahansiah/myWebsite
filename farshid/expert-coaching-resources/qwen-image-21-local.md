---
layout: farshid_default
title: "Qwen-Image-2.1 on an 8 GB laptop GPU: install, configure, and the one node that broke it"
permalink: /expert-coaching-resources/qwen-image-21-local/
description: "A complete local text-to-image setup on an RTX 4060 Laptop: the 7B GGUF transformer, the int8 text encoder, the 64-channel VAE, and the loader bug that turned every prompt into texture noise."
tags: [local-ai, image-generation, comfyui, gguf, qwen, quantization]
hashtags: "#localllm #comfyui #gguf #imagegeneration #edgeai"
---
# Qwen-Image-2.1 on an 8 GB laptop GPU: install, configure, and the one node that broke it

This page records the full setup, configuration, and testing of **Qwen-Image-2.1** as a local text-to-image generator on a Windows laptop with an 8 GB GPU. It ends with a working one-command script that turns a text file into an image.

It also records a failure worth reading. The pipeline loaded without error, ran to completion in 120 seconds, and produced pure noise on every prompt. The cause was one wrong node type. The diagnosis is included because the same class of error will appear in other GGUF-plus-safetensors pipelines.

The companion page for language models on the same hardware is [Tips and tricks to run a local model for Hermes Agent on your laptop](/farshid/expert-coaching-resources/localAI.md).

## The target hardware

| Component | Value |
|---|---|
| GPU | NVIDIA GeForce RTX 4060 Laptop |
| VRAM | 8,188 MiB total |
| Driver | 596.08, CUDA 13.2 capable |
| RAM | 32 GB |
| CPU | Intel Core Ultra 7 155H |
| OS | Windows 11 |

The 8 GB of VRAM is the binding constraint. Every choice below follows from it.

## What Qwen-Image-2.1 is

Published 20 September 2026 by the Qwen team. It is a unified text-to-image **and** image-editing model.

| Property | Value |
|---|---|
| Visual generator | 7B parameters, 32-layer single-stream DiT |
| Text encoder | Qwen3-VL 8B |
| VAE | 64-channel RGBA, 16x spatial compression |
| Default inference | 40 steps |
| Licence | Qwen Research License, no commercial use without permission |

Two notes that matter before downloading anything:

**A vision model is not an image generator.** "Vision" or "VL" means image in, text out. Qwen-Image-2.1 is the reverse: text in, image out. Do not confuse it with Qwen2.5-VL or Qwen3-VL, which only read images.

**The licence bars commercial use.** This is a change from Qwen-Image 1.0 and 2.0, which shipped under Apache 2.0.

## Files and disk layout

The model runs as three separate files. All of them are needed.

| File | Size | Purpose |
|---|---|---|
| `qwen-image-2.1-Q4_K_M.gguf` | 4.29 GiB | the transformer |
| `qwen3vl_8b_int8_convrot.safetensors` | 8.71 GiB | the text encoder |
| `qwen_image_2.1_vae_bf16.safetensors` | 644 MiB | the VAE |

The layout used here keeps one copy of each file:

```
D:\ollama\
  im.txt                              <- your prompt goes here
  gen.py                              <- prompt file to image
  gen.bat                             <- double-click version
  start-imggen.bat                    <- start the server once
  qwen-image-2.1\
    diffusion_models\
      qwen-image-2.1-Q4_K_M-arch.gguf
    text_encoders\
      qwen3vl_8b_int8_convrot.safetensors
    vae\
      qwen_image_2.1_vae_bf16.safetensors
  comfyui\
    .venv\
    models\
    output\                           <- images land here
    server.log
```

A file named `extra_model_paths.yaml` in the ComfyUI folder points ComfyUI at `D:\ollama\qwen-image-2.1`, so the 14 GB of weights are not duplicated into the ComfyUI tree.

### The `-arch.gguf` file

The downloaded GGUF had no `general.architecture` key in its header. ComfyUI's GGUF loader reads that key to identify the model. Without it, the loader falls back to guessing from tensor names and logs a compatibility-mode warning.

The fix is to declare the key. A two-key header was written for `general.architecture = qwen_image21` and `general.name = qwen_image21`, producing the `-arch.gguf` file. Both files hold the same 297 tensors; only the header differs.

Verify it worked:

```python
from gguf import GGUFReader
r = GGUFReader("qwen-image-2.1-Q4_K_M-arch.gguf")
print(r.fields["general.architecture"])   # must print a ReaderField, not None
```

## Install

Python 3.11 virtual environment, then PyTorch with **cu130**.

```bash
cd /d/ollama
git clone https://github.com/comfyanonymous/ComfyUI comfyui
cd comfyui
python -m venv .venv
./.venv/Scripts/python.exe -m pip install --upgrade pip
./.venv/Scripts/python.exe -m pip install -r requirements.txt
```

Then install PyTorch for CUDA 13:

```bash
./.venv/Scripts/python.exe -m pip install \
  "torch==2.14.0+cu130" \
  "torchvision==0.29.0+cu130" \
  "torchaudio==2.11.0+cu130" \
  --index-url https://download.pytorch.org/whl/cu130
```

Verify before going further:

```bash
./.venv/Scripts/python.exe -c "
import torch
print('torch :', torch.__version__)
print('cuda  :', torch.version.cuda)
print('avail :', torch.cuda.is_available())
print('device:', torch.cuda.get_device_name(0))
"
```

Expected output:

```
torch : 2.14.0+cu130
cuda  : 13.0
avail : True
device: NVIDIA GeForce RTX 4060 Laptop GPU
```

Finally, the GGUF loader custom node:

```bash
cd custom_nodes
git clone https://github.com/city96/ComfyUI-GGUF
cd ..
./.venv/Scripts/python.exe -m pip install -r custom_nodes/ComfyUI-GGUF/requirements.txt
```

### Why cu130 and not cu128

The text encoder uses `convrot` int8 quantization. ComfyUI's native int8 path routes through `comfy_kitchen`, which disables its CUDA backend on any torch below cu130 and prints:

```
WARNING: You need pytorch with cu130 or higher to use optimized CUDA operations.
```

On cu128 the warning appears and the optimized kernel is unavailable. Driver 596.08 reports CUDA 13.2 capability, so cu130 is both available and correct.

## Configure

`D:\ollama\comfyui\extra_model_paths.yaml`:

```yaml
qwen_image_21:
    base_path: D:/ollama/qwen-image-2.1/
    diffusion_models: |
        diffusion_models
    unet: |
        diffusion_models
    text_encoders: |
        text_encoders
    clip: |
        text_encoders
    vae: |
        vae
```

## The pipeline

Five nodes. The settings are taken from the official ComfyUI template `image_qwen_image_2_1_t2i.json` and must not be "improved".

| Node | Class | Setting |
|---|---|---|
| transformer | `UnetLoaderGGUF` | `qwen-image-2.1-Q4_K_M-arch.gguf` |
| text encoder | **`CLIPLoader`** | `qwen3vl_8b_int8_convrot.safetensors`, type `qwen_image` |
| VAE | `VAELoader` | `qwen_image_2.1_vae_bf16.safetensors` |
| conditioning | `TextEncodeQwenImage21` | prompt, negative, resolution 1024 |
| latent | `EmptyLatentImage` | 1024 x 1024, batch 1 |
| sampler | `KSampler` | euler, simple, 25 steps, cfg 1.0, denoise 1.0 |
| decode | `VAEDecode` | |

## The bug: `CLIPLoaderGGUF` destroys the prompt

This is the part worth keeping.

### The symptom

The pipeline ran with no error. ComfyUI reported `Prompt executed in 140.44 seconds`. The output image was pure noise, and it was noise for **every** prompt, at 25 steps and at 40 steps, with cu128 and with cu130.

### What made it hard to see

The text encoder loaded without complaint. Its output tensors had the correct shape `(1, 15, 4096)`, contained no NaN and were not zero. The model detected correctly as `qwen_image21` with 32 layers and 64 channels. The VAE round-trip test was exact. Every part looked healthy.

### The cause

The original script loaded the **safetensors** text encoder with `CLIPLoaderGGUF`, the node from the ComfyUI-GGUF custom node pack. That node does this:

```python
model_options = {
    "custom_operations": GGMLOps,
    "initial_device": comfy.model_management.text_encoder_offload_device()
}
```

`GGMLOps` extends `comfy.ops.manual_cast` and replaces Linear, Conv2d, Embedding and LayerNorm with GGML versions that **dequantize weights on the fly before compute**. That is correct for a GGUF file.

For an int8 `convrot` safetensors file it is wrong. It bypasses ComfyUI's native int8 convrot kernel, which is the component that applies the rotation the quantization depends on. The encoder still runs and still returns correctly shaped tensors — but the values no longer carry a usable prompt signal. The sampler then denoises toward texture instead of toward the prompt.

The failure is silent. Nothing errors. The shape and dtype checks all pass.

### The fix

One node type:

```python
"2": {"class_type": "CLIPLoader",          # was: CLIPLoaderGGUF
      "inputs": {"clip_name": CLIP, "type": "qwen_image",
                 "device": "default"}},
```

The transformer keeps `UnetLoaderGGUF`, because the repository ships only a GGUF file for it. The rule is: **match the loader to the file format.** `UnetLoaderGGUF` for the `.gguf` transformer, the built-in `CLIPLoader` for the `.safetensors` encoder.

### How it was found

The turning point was a 10-step run with `UnetLoaderGGUFAdvanced` set to `dequant_dtype=bfloat16`. The output changed from pure noise to a coherent but wrong texture — rusted metal instead of an apple. That proved the sampler worked and the prompt was not arriving. Everything upstream of the conditioning was then verified correct, which left the loader as the only candidate.

## The script

`D:\ollama\gen.py` reads a prompt from a text file and writes an image.

```python
#!/usr/bin/env python
"""gen.py - prompt file to image."""
import argparse, json, os, sys, time, urllib.error, urllib.request, uuid

COMFY = "http://127.0.0.1:8188"
HERE = os.path.dirname(os.path.abspath(__file__))

UNET = "qwen-image-2.1-Q4_K_M-arch.gguf"
CLIP = "qwen3vl_8b_int8_convrot.safetensors"
VAE  = "qwen_image_2.1_vae_bf16.safetensors"


def build(prompt, negative, steps, width, height, seed, cfg, prefix):
    return {
        "1": {"class_type": "UnetLoaderGGUF",
              "inputs": {"unet_name": UNET}},
        "2": {"class_type": "CLIPLoader",
              "inputs": {"clip_name": CLIP, "type": "qwen_image",
                         "device": "default"}},
        "3": {"class_type": "VAELoader",
              "inputs": {"vae_name": VAE}},
        "4": {"class_type": "TextEncodeQwenImage21",
              "inputs": {"clip": ["2", 0], "prompt": prompt,
                         "negative_prompt": negative, "resolution": 1024}},
        "6": {"class_type": "EmptyLatentImage",
              "inputs": {"width": width, "height": height, "batch_size": 1}},
        "7": {"class_type": "KSampler",
              "inputs": {"model": ["1", 0], "positive": ["4", 0],
                         "negative": ["4", 1], "latent_image": ["6", 0],
                         "seed": seed, "steps": steps, "cfg": cfg,
                         "sampler_name": "euler", "scheduler": "simple",
                         "denoise": 1.0}},
        "8": {"class_type": "VAEDecode",
              "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "SaveImage",
              "inputs": {"images": ["8", 0], "filename_prefix": prefix}},
    }
```

The rest of the script posts the graph to `/prompt`, polls `/history/<id>`, and prints the output path.

Usage:

```bash
cd /d/ollama
./gen.py                          # reads im.txt
./gen.py other.txt                # another prompt file
./gen.py --steps 40               # override a setting
```

Options: `--steps`, `--width`, `--height`, `--seed`, `--negative`, `--cfg`, `--out`.

## Start the server

```bat
@echo off
cd /d D:\ollama\comfyui
start "ComfyUI server" /min cmd /c ""D:\ollama\comfyui\.venv\Scripts\python.exe" main.py --listen 127.0.0.1 --port 8188 --preview-method none >> "D:\ollama\comfyui\server.log" 2>&1"
echo ComfyUI server starting. Wait about 60 seconds.
timeout /t 5 >nul
```

### Do not start the server with a pipe

This is a Windows-specific trap. If the server's output goes to a pipe that later closes, the tqdm progress bar fails when it flushes stderr, and the sampler dies with:

```
OSError: [Errno 22] Invalid argument
```

The traceback points into `tqdm/std.py` and `app/logger.py`, which makes it look like a model fault. It is not. Redirect to a **file** as shown above. A file handle does not close.

## Test

### 1. Verify file integrity

Every file has a published SHA256. Check all three before blaming the pipeline for anything.

```bash
cd /d/ollama/qwen-image-2.1/diffusion_models
sha256sum qwen-image-2.1-Q4_K_M.gguf
sha256sum ../vae/qwen_image_2.1_vae_bf16.safetensors
sha256sum ../text_encoders/qwen3vl_8b_int8_convrot.safetensors
```

| File | Expected SHA256 |
|---|---|
| `qwen-image-2.1-Q4_K_M.gguf` | `833439e91bc1152d28f37aa198c7f6f4218b7de95754c2f7a318a2422ab4b2f8` |
| `qwen_image_2.1_vae_bf16.safetensors` | `bb21f7473051e1ac368515dd3f2e15cd44d7a11748ee8823e1ddca3e4876b7c9` |
| `qwen3vl_8b_int8_convrot.safetensors` | `8bfd0f6e12abf2d2d697ecc888e5e90b0d6741d6708f05799f53afa560452e8f` |

### 2. Verify the VAE round-trip

Encode a known image, decode it, and compare. This isolates the VAE from the transformer.

A red square on a blue background must decode back to the same colours:

```
corner RGB (expect blueish, high B): [0.0014, 0.0057, 0.7885]
centre RGB (expect reddish, high R): [0.8927, 0.0021, 0.0]
latent shape : (1, 64, 16, 16)
latent nan   : False
```

If the latent is `(1, 16, ...)` instead of `(1, 64, ...)`, the wrong VAE class loaded.

### 3. Verify model detection

```python
import comfy.model_detection as md
cfg = md.detect_unet_config(sd, "")
```

Must report:

```json
{
  "image_model": "qwen_image21",
  "in_channels": 64,
  "out_channels": 64,
  "num_layers": 32,
  "attention_head_dim": 128,
  "num_attention_heads": 32,
  "context_in_dim": 4096,
  "mlp_ratio": 3
}
```

If `image_model` is anything else, the `general.architecture` key is missing from the GGUF header.

### 4. Generate

```bash
cd /d/ollama
echo "a red apple on a wooden table, studio lighting, photorealistic" > im.txt
./gen.py
```

Working output:

```
prompt file : D:\ollama\im.txt
prompt      : a red apple on a wooden table, studio lighting, photorealistic
size        : 1024x1024   steps: 25   cfg: 1.0   seed: 181446451
queued      : 042ce9c3-41e8-4ebf-88b9-34a1b95cd5aa
generating ...

DONE in 120.7 seconds
IMAGE: D:\ollama\comfyui\output\image_00001_.png
```

Open the image. If it is texture or noise rather than an apple, the text encoder loader is wrong. See the bug section above.

## Measured performance

| Setting | Time | VRAM |
|---|---|---|
| 25 steps, 1024 x 1024 | 100-160 s | ~4.5 GB loaded, 5.6 GB usable |
| 40 steps, 1024 x 1024 | 181 s | same |
| 10 steps (diagnostic) | 57 s | same |

The model runs `loaded completely` in VRAM. The text encoder does not fit beside the transformer, so ComfyUI loads it, encodes, frees it, and then samples. This is expected and costs no extra time worth measuring.

## Facts that cost time to establish

These are all normal and were wrongly suspected during diagnosis:

- **`model_type FLUX`** in the log. `QwenImage21` in `model_base.py` is defined as `def __init__(self, model_config, model_type=ModelType.FLUX, ...)`. FLUX here names the *sigma schedule* class, not the architecture. Correct.
- **`Requested to load WanVAE`**. The Qwen-Image VAE is Wan-derived. `comfy/sd.py` selects it on the marker `Qwen Image 2.1 VAE: Wan 2.2 layout, temporal kernel 1, no patchify, RGBA`, and sets `latent_channels = 64`, `upscale_ratio = 16`. Correct.
- **Text encoder output `std ~13`, peaks near 600.** `layer_norm_hidden_state = False` is set for *all* Qwen text encoders. The hidden state is taken before the final RMSNorm, so large magnitudes are expected. The transformer's `txt_in.text_norm` normalizes on entry. Not a fault.
- **`EmptyLatentImage` makes 4 channels at /8, but the model wants 64 at /16.** The node's own third output pin looks like the intended latent source, but the official template uses `EmptyLatentImage`. ComfyUI reconciles the channel count during sampling. Not the bug.
- **The latent node's third pin is unused.** Correct — it exists for reference-image editing, not text-to-image.

## Notes

- The model card states **40 default steps**. The ComfyUI template uses 25, which works. Raise `--steps` for maximum quality.
- Native context is 262,144 tokens and output supports up to 2K resolution with an RGBA alpha channel.
- The model accepts up to 10 reference images for editing. The `TextEncodeQwenImage21` node has 16 image input slots for this.
- GGUF quality ranks above int8 convrot in published latent-divergence benchmarks (`GGUF Q8 > INT8 ConvRot > MXFP8 > FP8`), so the GGUF transformer path is a quality choice, not only a memory one.
- Licence: Qwen Research License. Commercial use requires separate permission from Qwen.


---

(base) PS D:\ollama> python ./gen.py
prompt file : D:\ollama\im.txt
prompt      : a red apple on a wooden table, studio lighting, photorealistic
size        : 1024x1024   steps: 25   cfg: 1.0   seed: 2042660899
queued      : 
generating ...

DONE in 117.5 seconds
IMAGE: D:\ollama\comfyui\output\image_00003_.png
(base) PS D:\ollama> python ./gen.py
prompt file : D:\ollama\im.txt
prompt      : a mindmap about qwen 2.5 image vision model
size        : 1024x1024   steps: 25   cfg: 1.0   seed: 1892887971
queued      : 
generating ...

DONE in 114.6 seconds
IMAGE: D:\ollama\comfyui\output\image_00004_.png
(base) PS D:\ollama> python ./gen.py
prompt file : D:\ollama\im.txt
prompt      : A single-page, print-ready mind map poster. Hand-drawn ink style on warm off-white paper, no photograph, no 3D render. Center: a bold circular node labelled "Qwen-Image-2.1 on 8 GB VRAM". Branching outward with thick tapered ink lines and small arrowheads into clean hand-lettered branch labels: "Hardware", "Install", "The Bug", "The Fix", "Testing", "Performance", "Licence". Each branch carries 3 to 5 short hand-lettered leaf notes with simple doodle icons: a GPU chip for Hardware, a terminal window for Install, a broken chain link for The Bug, a wrench for The Fix, a checklist for Testing, a stopwatch for Performance, a scroll for Licence. Around the lower half add a second ring comparing three rival models as three small cards labelled "Photoroom PRX", "FLUX.2 [klein] 4B", "Qwen-Image 2.0", each card showing tiny labelled rows for params, steps, native resolution and licence. Use a restrained palette of ink black, one red accent for warnings, and one teal accent for correct values. Dense but legible, generous whitespace, even stroke weight, no gradients, no photorealism, no clutter, no watermark.
size        : 1024x1024   steps: 25   cfg: 1.0   seed: 2091873613
queued      : 
generating ...

DONE in 232.2 seconds
IMAGE: D:\ollama\comfyui\output\image_00005_.png
(base) PS D:\ollama>
---
