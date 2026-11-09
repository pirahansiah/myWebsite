---
layout: farshid_default
title: "Qwen4-27B at 1 bit and 64k context: the laptop rig"
permalink: /notes/qwen4-27b-1bit-laptop/
description: "Running a 27B dense model on an 8 GB RTX 5060 laptop: 1-bit weights, a 64k KV cache that has to live partly outside the card, the llama-server flags that make it fit, and the Hermes Agent wiring that treats it as a local model with no cloud key."
tags: [local-llm, quantization, llamacpp, hermes, ai-agents, onebit, edgeai]
hashtags: "#localllm #quantization #llamacpp #hermes #qwen4 #edgeai"
---

# Qwen4-27B at 1 bit and 64k context: the laptop rig

A 27B dense model used to mean a 16 GB card at 4 bits, or a 57 GB download at BF16. At ~1.56 bits per weight the same model is a 5.8 GB file, which is the first time it has fit inside the 8 GB of an RTX 5060 Laptop. That is the whole trick on this machine: the weights stop being the problem, and the context window becomes the only thing left to budget.

This page is the configuration I run on the laptop — an AMD Ryzen AI 7 450 with 32 GB of RAM, a 1 TB SSD and an RTX 5060 8 GB — with Hermes Agent pointed at it as a local model, 65536 tokens of context, and no cloud key in the loop.

**Status, said once and plainly:** the upstream Qwen4-27B weights are not public yet (Alibaba's written statement still says Qwen 4 is in training). The hardware numbers below are measured on this laptop; the 27B-specific numbers are arithmetic from the model's geometry and the documented quant sizes, and the page gets the measured versions the week the weights land. The 1-bit build is published at [pirahansiah/Qwen4-27B-1bit-GGUF](https://huggingface.co/pirahansiah/Qwen4-27B-1bit-GGUF).

## Three numbers that fight each other

1. **Weights:** 27.8B parameters at 1.5625 bits ≈ 5.4 GB, about 5.8 GB as a GGUF file with embeddings and the output head kept at Q4_0/Q6_K.
2. **KV cache:** charged separately, per token, and at 64k it is not small. KV bytes per token = 2 × layers × KV heads × head_dim × bytes per element.
3. **The card:** 8,188 MiB usable on this laptop, of which 5.8 GB is already weights.

So the arithmetic that decides everything, assuming a 64-layer dense layout with 8 KV heads and head_dim 128:

| KV dtype | bytes/token | KV at 64k | Weights + KV | Fits 8 GB? |
| :--- | ---: | ---: | ---: | :--- |
| F16 | 256 KB | 16 GiB | 21.8 GiB | no |
| Q8_0 | 136 KB | 8.5 GiB | 14.3 GiB | no |
| Q4_0 | 72 KB | 4.5 GiB | 10.3 GiB | no |

Read the last row carefully: even at the lowest KV type llama.cpp has, 64k does not fit alongside the weights on one 8 GB card. It is close — 10.3 GiB against 8.0 — and that gap is what the next section is for.

## Where the missing 2.3 GB comes from

llama.cpp puts each layer's KV cache on the same device as that layer. So offloading *fewer* layers buys both weights-space and KV-space at the same time, and the layers left on the CPU pay for it in speed.

Per layer at 64k: 5.75 GiB / 64 ≈ 90 MiB of weights, 4.5 GiB / 64 ≈ 72 MiB of KV, about 162 MiB together. Against a ~7.5 GiB ceiling that is ~46 layers on the card.

| Configuration | Flags | VRAM | System RAM | 64k? | Decode (estimate) |
| :--- | :--- | ---: | ---: | :---: | ---: |
| All on GPU, short context | `-ngl 99 -c 16384 -ctk q4_0` | ~7.2 GiB | none | ✗ | ~35 tok/s |
| **Split layers, 64k (what I run)** | `-ngl 46 -c 65536 -ctk q4_0 -ctv q4_0 -fa on` | ~7.4 GiB | ~3 GiB | ✓ | ~8–14 tok/s |
| Weights on GPU, cache in RAM | `-ngl 99 -c 65536 -nkvo -ctk q4_0` | ~6.1 GiB | ~4.5 GiB | ✓ | ~6–10 tok/s |

The split is the useful middle: 46 of 64 layers on the card with their cache, 18 layers plus their cache in the 32 GB of DDR5. The `-nkvo` row is the one-flag version — every layer computes on the GPU, the whole cache lives in RAM, and every token pays the transfer.

The 32 GB of RAM is what makes this possible at all. Without it the choice would be 64k at a model too damaged to use, or a usable model at 16k, which Hermes will not accept.

## The command

```
llama-server.exe -m Qwen4-27B-IQ1_S.gguf ^
  --alias qwen4-27b-1bit ^
  --host 127.0.0.1 --port 8080 ^
  --ctx-size 65536 ^
  --n-gpu-layers 46 ^
  --cache-type-k q4_0 --cache-type-v q4_0 ^
  --flash-attn on ^
  --jinja ^
  --chat-template-kwargs "{\"enable_thinking\":false}" ^
  --no-warmup
```

| Flag | Why it is there |
| :--- | :--- |
| `--ctx-size 65536` | Hermes refuses any model served under 64,000 tokens of context. 64k is the floor, not a preference. |
| `--n-gpu-layers 46` | The number that splits the budget. Raise it until `nvidia-smi` shows ~7.5 GiB and the model still answers at full context; drop it if you see CUDA OOM at 40k+ tokens rather than at the first token. |
| `--cache-type-k q4_0 --cache-type-v q4_0` | 4.5 GiB instead of 16 GiB at 64k. There is no 2-bit KV type in llama.cpp — the allowed list is `f32, f16, bf16, q8_0, q4_0, q4_1, iq4_nl, q5_0, q5_1` — so q4_0 is the lowest that exists. |
| `--flash-attn on` | Required for a quantized V cache, and it shrinks the compute buffers. Without it the quantized cache is rejected or silently dequantized. |
| `--jinja` | Uses the model's own chat template. At 1.5 bits a hand-written prompt format drifts harder than at 4 bits. |
| `--chat-template-kwargs '{"enable_thinking":false}'` | Qwen-family models spend the token budget inside the thinking block and return an empty `content`. Fixing it server-side fixes every client at once. |
| `--no-warmup` | Skips the warmup pass, so the server is healthy sooner. |

Sanity check before touching Hermes:

```
curl http://127.0.0.1:8080/health      # {"status":"ok"}
curl http://127.0.0.1:8080/v1/models   # "n_ctx": 65536
```

## Wiring it into Hermes Agent

Hermes talks to it as a `custom` provider over the OpenAI-compatible API. Three things must line up, and each one fails differently if it does not:

- the server's `--alias` becomes the model id,
- `context_length` in `config.yaml` must equal `--ctx-size`, or Hermes rejects the model,
- the provider must be `custom` with the `/v1` base URL — no API key is needed, any placeholder works.

```yaml
custom_providers:
  - name: qwen4
    base_url: http://127.0.0.1:8080/v1
    model: qwen4-27b-1bit
    models:
      qwen4-27b-1bit:
        context_length: 65536

model_aliases:
  qwen4: {model: qwen4-27b-1bit, provider: custom, base_url: http://127.0.0.1:8080/v1}
```

Then `/model qwen4` in the agent. Two notes that save an hour: the alias entry has to be a mapping, not a scalar string, or it is silently ignored; and if you also point `memory`, `delegation` and any other profile at the same server, grep the whole `config.yaml` for the port — a stale entry in one block behaves like a random failure in that subsystem.

What this actually feels like in the agent: Hermes sends a ~20,000-token prompt on the first turn (system prompt plus tool schemas), and on a split 27B that prefill is the slow part — tens of seconds to a couple of minutes, not milliseconds. Every later turn reuses the cached prefix and answers at decode speed. One long session is cheap; twenty short ones are not.

## What 1 bit costs you

1.56 bits per weight is the most aggressive packing that still produces usable text, and it is not free. In practice:

- names, dates and numbers get mangled more often than at 4 bits, so anything factual needs a check;
- multi-step arithmetic degrades first;
- long generations can loop if the importance matrix was built on the wrong kind of text;
- multilingual quality falls off before English does.

What survives is style, summarisation of pasted text, short code, translation of common pairs and ordinary chat. On this rig the honest framing is: a damaged 27B that fits, rather than an intact 8–9B that also fits. For most knowledge-heavy questions the damaged 27B still wins.

## Gotchas worth the reading time

1. **"Context below the minimum 64,000"** — either `--ctx-size` is lower than 65536 or `context_length` does not match it. Both are checked.
2. **CUDA OOM at 40k tokens but not at 1k** — the KV cache grows with the conversation. Lower `--n-gpu-layers` by 4, not the context.
3. **Empty answers** — thinking model burning the budget. `--chat-template-kwargs '{"enable_thinking":false}'` server-side; `max_tokens` ≥ 256 per request if the client controls it.
4. **Garbage after a restart** — check `--jinja` survived. A missing template turns a good 1-bit model into a bad base model.
5. **Laptop-specific:** plugged in, NVIDIA control panel set to prefer maximum performance, and confirm the process is on the discrete GPU — on Optimus laptops the iGPU can pick it up and the numbers collapse.
6. **Don't quantize from a 4-bit file.** Convert the official weights to BF16 GGUF, build an importance matrix on your own text, then 1-bit from that. The recipe is on the [model card](https://huggingface.co/pirahansiah/Qwen4-27B-1bit-GGUF).

## One line

A 1-bit 27B plus a q4_0 KV cache at 64k, split 46/64 layers across 8 GB of VRAM and 32 GB of RAM, gives Hermes Agent a fully local 27B-class model on a laptop — around 8–14 tokens per second, with the first turn of a session paying for the prefill and every later turn paying only for the answer.
