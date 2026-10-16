---
layout: farshid_default
title: "A local LLM for Hermes Agent on an old machine: under 8 GB RAM, no GPU"
permalink: /notes/local-llm-hermes-low-ram/
description: "How to give Hermes Agent a fully local model on an old, GPU-less, under-8 GB machine: a 949 MB 1-bit 4B model, the fork's llama-server, a q4_0 KV cache at 64k context, and the measured RAM, prefill and tokens-per-second numbers for both GPU and CPU-only runs."
tags: [local-llm, hermes, quantization, llamacpp, low-ram, edgeai]
hashtags: "#localllm #hermes #quantization #llamacpp #edgeai"
---

# A local LLM for Hermes Agent on an old machine: under 8 GB RAM, no GPU

I run a fully local model inside Hermes Agent with no cloud key and no GPU. The trick is not a smaller model, it is an aggressively quantized one: a 4B model whose weights are ternary, stored at ~1.75 bits per weight, 949 MB on disk. Runtime RAM is weights plus KV cache plus small buffers, so the whole thing lives in about 2 GB — an old machine with under 8 GB is enough. The only real cost of dropping the GPU is time, and most of that time is paid once per session, not once per message.

Everything below is the setup I published, with the numbers measured on the machine in the last table. Where a number is arithmetic instead of a measurement, the text says so.

## The idea in four lines

- A 1-bit/ternary 4B model weighs 949 MB instead of ~8 GB, and needs no cloud.
- Runtime RAM = model file + KV cache + buffers. Here that is 1.8 - 2.9 GB.
- Hermes refuses any model served with under 64,000 tokens of context, so serve 65536 and shrink the KV cache instead of shrinking the context.
- No GPU required. Metal or CUDA changes the speed, not whether it works.

## What you need: three downloads, no build

1. **The model** — [prism-ml/Ternary-Bonsai-2-4B-gguf](https://huggingface.co/prism-ml/Ternary-Bonsai-2-4B-gguf), file `Ternary-Bonsai-2-4B-PTQ1_0.gguf` (949 MB). `PTQ1_0` is the smallest packing of the three that hold the same ternary weights: 0.95 GB against 1.15 GB for `PQ2_0` and 1.21 GB for `Q2_0`. Lowest RAM wins for this use case.
2. **The runtime** — the [PrismML fork of llama.cpp](https://github.com/PrismML-Eng/llama.cpp) (branch `prism`), prebuilt binary `llama-prism-<tag>-bin-macos-arm64.tar.gz`, about 12 MB, with linux, windows and android builds in the same release. **Normal llama.cpp cannot load this file**, Homebrew's included: it fails with `gguf_init_from_reader: failed to read tensor info` because the packings use private tensor types (`PQ2_0` = 142, `PTQ1_0` = 143). That error is the runtime, not a broken download — check the sha256 against the repo's `SHA256SUMS` file before you re-download anything.
3. **Hermes Agent**, already installed.

## Serve it
```
llama-server \
  --model Ternary-Bonsai-2-4B-PTQ1_0.gguf \
  --alias Ternary-Bonsai-2-4B-PTQ1_0 \
  --host 127.0.0.1 --port 8002 \
  --ctx-size 65536 \
  --cache-type-k q4_0 --cache-type-v q4_0 \
  --flash-attn on \
  --n-gpu-layers 0 \
  --jinja \
  --chat-template-kwargs '{"enable_thinking":false}' \
  --no-warmup
```
```
curl http://127.0.0.1:8002/health      # {"status":"ok"}
curl http://127.0.0.1:8002/v1/models  # "n_ctx": 65536
```
| flag | why it is there |
| :--- | :--- |
| `--ctx-size 65536` | Hermes' minimum is 64,000 tokens; below that it rejects the model outright. |
| `--cache-type-k q4_0 --cache-type-v q4_0` | The KV cache is the second RAM eater. `q4_0` is the lowest type llama.cpp has — there is no 2-bit KV (allowed: `f32, f16, bf16, q8_0, q4_0, q4_1, iq4_nl, q5_0, q5_1`). |
| `--flash-attn on` | Smaller compute buffers. |
| `--n-gpu-layers 0` | No GPU: everything on CPU. Use `99` when you do have a GPU. |
| `--jinja` | Uses the model's own chat template, which is what makes tool calling work. |
| `--chat-template-kwargs '{"enable_thinking":false}'` | Turns the model's thinking mode off for every client at once (see gotcha 1). |
| `--no-warmup` | Skips the warmup pass, so the server is ready sooner. |

## Plug it into Hermes: two config keys, not one
```
hermes config set custom_providers "$(cat <<'EOF'
- name: bonsai
  base_url: http://127.0.0.1:8002/v1
  model: Ternary-Bonsai-2-4B-PTQ1_0
  models:
    Ternary-Bonsai-2-4B-PTQ1_0:
      context_length: 65536
EOF
)"
```
```
hermes config set model_aliases.bonsai \
  '{model: Ternary-Bonsai-2-4B-PTQ1_0, provider: custom, base_url: "http://127.0.0.1:8002/v1"}'
```
- `custom_providers` is what puts the model in the picker; `model_aliases` is what makes the short name work (`/model bonsai`, or the one-shot `hermes -m bonsai`). Both are needed.
- `model_aliases` entries must be dicts. A flat line like `bonsai: custom/Ternary-Bonsai-2-4B-PTQ1_0` is silently ignored.
- `context_length` has to match the server's `--ctx-size`, otherwise the agent budgets context it cannot send.
- The default model does not change. Adding a local option is opt-in; making it the default changes every session.

Test it without touching the default:
```
hermes -m bonsai -z "Reply with exactly: hello"
```
## Keep it alive after a reboot

The alias does not start the server, it only points at it. Without persistence the local model is gone at the next restart.

- **macOS**: a launchd user agent with `RunAtLoad` and `KeepAlive`, then `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/<name>.plist`.
- **Linux**: a systemd user unit with `Restart=always`.
- **Windows**: a scheduled task that runs at logon.

## The measured numbers

Machine used for the test: Apple M3, 16 GB RAM, macOS. Model: 949 MB, 4.21B parameters, 65,536 context, `q4_0` KV cache.

**RAM**

| measurement | value |
| :--- | ---: |
| after load (cold) | 1.81 GB |
| while serving | 1.83 - 2.15 GB |
| peak during an 18k-token prompt | 2.90 GB |
| of which model weights | 0.94 GB |
| of which KV cache, 64k at q4_0 | ~0.59 GB (~9 KB per token) |
| disk (model + binaries) | 913 MB + 40 MB |

**Speed with the GPU (`--n-gpu-layers 99`)**

| measurement | value |
| :--- | ---: |
| prompt processing | 175 - 275 tok/s (274 at 2k, 258 at 7k, 196 at 14k) |
| generation | 40.4 tok/s median (24 ms per token) |
| cold start to healthy | 1.24 s |
| the same prompt asked again | 0.23 s (prefix cache reused 18,018 of 18,022 tokens) |

**Speed without a GPU (CPU only, `--n-gpu-layers 0`, 4 threads)**

| measurement | value |
| :--- | ---: |
| prompt processing, short prompt | 32 - 85 tok/s |
| prompt processing, 14,026-token prompt | 18.2 tok/s (772 s total) |
| generation, short context | 11 - 20 tok/s (51 - 91 ms per token) |
| generation inside a 14k context | 7.8 tok/s |
| RAM | unchanged, 1.73 GB after load, 2.03 GB after the long prompt |

**What that means in practice**

- A one-word answer to a short question: about 1-2 seconds with the GPU, 3-6 seconds on CPU. Inside a long context, generation drops to 7.8 tokens per second on CPU, so a 200-word answer there takes minutes, not seconds.
- The first real turn: Hermes sends a ~20,000-token prompt (system prompt plus tool schemas). With the GPU that is 84-104 seconds to the first token. CPU only measured 772 seconds to process 14,026 tokens, so scaling that measured rate to a 20,000-token prompt gives roughly 18-20 minutes before the first token — the one number on this page I derived rather than measured end to end.
- Every later turn reuses the cached prompt prefix, so it answers almost immediately. One long session is far cheaper than many short ones.
- A genuinely old CPU (2015-era, two cores) will land 3-10x below the CPU row above. It still works, but treat it as a background/batch model rather than a chat you watch.

## Gotchas that cost time

1. **Empty answers or `@@@` garbage** — it is a thinking model and the reasoning eats the whole token budget before writing anything. Server-side `--chat-template-kwargs '{"enable_thinking":false}'` fixes it for every client at once; or send `max_tokens` >= 256 per request.
2. **`failed to read tensor info` at load** — wrong llama.cpp (see download 2), not a corrupt model. Verify with the repo's `SHA256SUMS` first.
3. **Hermes says the context is too small** — either your `--ctx-size` is under 64,000 or `context_length` in `config.yaml` does not match it.
4. **Model is in the config but `/model bonsai` does nothing** — the server is not running; the alias never starts it.
5. **`hermes doctor` asks you to move `custom_providers` into `providers:`** — retired migration notice that fires for working entries. Ignore it.
6. **Vision** — this model also has an optional mmproj vision pack (+0.37 GB). Add it only if you need images; it is more RAM and more risk on a small machine.
7. **Speculative decoding** — the MTP (1.27 GB) and DFlash2 (1.58 GB) drafters make it faster and roughly double the RAM. On a sub-8 GB box, skip them.

## One line

A ternary 4B model plus the fork's llama-server plus a `q4_0` KV cache at 64k context gives a fully local Hermes model in under 2 GB of RAM — about 40 tokens per second with a GPU and 11-20 without one at short context (7.8 inside a long CPU context), and the only real price of an old GPU-less machine is the first turn.
