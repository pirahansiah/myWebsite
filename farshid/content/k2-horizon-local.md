---
layout: farshid_default
title: "Running K2-Horizon Locally on Apple Silicon"
permalink: /notes/docs/llm/k2-horizon-local/
description: "Serve IFM's K2-Horizon (custom k2-horizon architecture GGUF) on Apple M3 via the MBZUAI-IFM llama.cpp fork, and wire it into Hermes Agent at 64K context."
tags: [ai, llm, apple-silicon, llama.cpp, k2-horizon, hermes]
hashtags: "#ai #llm #applesilicon #llamacpp #k2horizon #hermes"
markmap: |
  # Running K2-Horizon Locally
  ## Why not oMLX / Ollama
  - oMLX eats MLX safetensors only
  - Ollama lacks k2-horizon arch
  - Needs MBZUAI-IFM llama.cpp fork
  ## Build the fork (Metal)
  - clone model/K2Horizon branch
  - cmake GGML_METAL
  - build llama-server
  ## Serve
  - download K2-Horizon-1B-BF16.gguf
  - alias k2-horizon:latest
  - ctx-size 65536, flash-attn
  ## Hermes wiring
  - separate :8080 endpoint
  - custom provider
  - 64K context floor
---

> **Running K2-Horizon Locally on Apple Silicon** — Serve IFM's K2-Horizon GGUF via the MBZUAI-IFM llama.cpp fork and wire it into Hermes at 64K context. — https://www.pirahansiah.com/notes/docs/llm/k2-horizon-local/

# Running K2-Horizon Locally on Apple Silicon (M3, 16GB)

K2-Horizon (by IFM / MBZUAI) is a compact *reasoning* model family. The published weights
(`IFM/K2-Horizon-0.9B-GGUF`) are **GGUF only** in a **custom `k2-horizon` architecture**
(a MoVA-style attention/value-router). That breaks the usual local paths:

*Last updated: 2026-09-05.*  <!--ENHANCED-->

## Why oMLX and Ollama cannot load it (verified)

- **oMLX** (the MLX server) ingests only **MLX safetensors** (`config.json` + `*.safetensors`).
  A `.gguf` is not ingestible by oMLX at all — there is no `add`/`pull` for GGUF.
- **Ollama** bundles **mainline llama.cpp**, which has **no `k2-horizon` support** yet. The
  upstream PR is still in progress.
- The model's own README states it requires *"a version of llama.cpp containing K2 Horizon
  architecture support"* — i.e. the **MBZUAI-IFM fork** at `github.com/MBZUAI-IFM/llama.cpp`
  (`model/K2Horizon` branch).

Grepping the ollama 0.30.6 and oMLX 0.6.4 binaries confirms **zero** `k2-horizon` references,
whereas the fork's `src/models/k2-horizon.cpp` + `libllama.0.3.0.dylib` do contain it.

## Build the MBZUAI-IFM llama.cpp fork (Metal)

```bash
# Use the exact validated commit the model authors recommend.
git clone --branch model/K2Horizon --single-branch \
  https://github.com/MBZUAI-IFM/llama.cpp.git llama.cpp-k2
cd llama.cpp-k2
git log -1 --format='%H %s'   # expect 35999d101... "model: K2 Horizon chat template ..."

# Apple Silicon: Metal backend, embed the Metal lib, Release.
cmake -B build -DGGML_METAL=ON -DGGML_METAL_EMBED_LIBRARY=ON \
      -DCMAKE_BUILD_TYPE=Release -DLLAMA_CURL=ON
cmake --build build --target llama-server -j $(sysctl -n hw.ncpu)
```

Verify the architecture is compiled in:

```bash
strings build/bin/libllama.0.3.0.dylib | grep -c k2-horizon   # expect > 0
./build/bin/llama-server --version                            # 0.3.0-dev, commit 35999d101
```

## Download the GGUF

```bash
mkdir -p ~/models/k2-horizon
curl -L -o ~/models/k2-horizon/K2-Horizon-1B-BF16.gguf \
  "https://huggingface.co/IFM/K2-Horizon-0.9B-GGUF/resolve/main/K2-Horizon-1B-BF16.gguf"
# ~2.16 GB, BF16 full precision (fine for 0.9B/1B class on 16 GB unified RAM)
```

## Serve on :8080

```bash
./build/bin/llama-server \
  --model ~/models/k2-horizon/K2-Horizon-1B-BF16.gguf \
  --alias k2-horizon:latest \
  --host 127.0.0.1 --port 8080 \
  --ctx-size 65536 --n-gpu-layers 99 --flash-attn on \
  --reasoning-format deepseek --reasoning-effort default
```

- `--ctx-size 65536` — Hermes enforces a **64K context floor** for the default model; smaller
  and it refuses with *"Choose a model with at least 64K context."*
- `--reasoning-format deepseek` — populates `message.reasoning_content` (K2 is a reasoner).
- `--flash-attn on` (not a bare flag — the server needs the `on` value).

Health + generation check:

```bash
curl -s http://127.0.0.1:8080/health                 # {"status":"ok"}
curl -s http://127.0.0.1:8080/v1/models | grep -o 'k2-horizon:latest'
```

## Wire into Hermes (separate endpoint, do NOT touch oMLX's :8000)

Point Hermes at the **:8080** server via a new custom provider — keep oMLX on :8000 as-is:

```bash
hermes config set model.base_url "http://127.0.0.1:8080/v1"
hermes config set model.default "k2-horizon:latest"
hermes config set agent.model    "k2-horizon:latest"
hermes config set delegation.base_url "http://127.0.0.1:8080/v1"
hermes config set delegation.model    "k2-horizon:latest"
hermes gateway restart
```

Verify: `hermes chat -q "hi"` → gateway log shows
`model=k2-horizon:latest provider=custom base_url=http://127.0.0.1:8080/v1`.

## Persistence (survives reboot / logout)

`~/Library/LaunchAgents/com.farshid.k2-horizon-serve.plist` — `RunAtLoad` + `KeepAlive`,
mirroring the oMLX agent in the [Local LLM Optimization](/notes/docs/llm/local-llm-optimization/)
guide (§7a). Only one process may hold :8080.

## Gotchas

- **It is a reasoner.** Every reply includes a `reasoning_content` trace and is slow
  (~24 s for a 40-token answer) — that is the model's nature, not a misconfig.
- **BF16 GGUF is large.** 2.16 GB for ~1B params; watch RAM if you add bigger BF16 GGUFs on 16 GB.
- **No oMLX/Ollama route.** If you need K2-Horizon in oMLX, you must first convert the GGUF to
  MLX safetensors (and even then the custom arch's grouped RMSNorm needs a custom loader), which
  is not provided for the 0.9B/1B size as of this writing (community MLX conversions exist only
  for 3.7B/7B, and require `--trust-remote-code`). The llama.cpp fork is the supported path.
