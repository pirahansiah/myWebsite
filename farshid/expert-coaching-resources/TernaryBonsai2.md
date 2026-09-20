---
layout: farshid_default
title: "Small weights, big context: running a 2-bit model on an 8 GB laptop GPU"
permalink: /expert-coaching-resources/TernaryBonsai2/
description: "One write-up distilled from a local-model increment: why the KV cache and not the weights decides the context budget, what a 2-bit 3.7B model costs on 8 GB, and what the harness layer has to do with the answer."
tags: [local-llm, quantization, llamacpp, hermes, ai-agents]
hashtags: "#localllm #quantization #llamacpp #aiagents #edgeai"
---
# Small weights, big context: running a 2-bit model on an 8 GB laptop GPU

This page condenses one working session's artifacts: getting an aggressively quantized model served locally at a long context, and making it selectable inside the agent — 16 files of plans, specs, task lists, handoffs, a video transcript and a slide deck, all from two increments in September 2026. The numbers below are copied from those files; where a number is arithmetic rather than a measurement, it says so.

The sibling case on the same class of hardware is Ternary-Bonsai-2-27B at 32k context (see [Tips and tricks to run a local model for Hermes Agent on your laptop](/farshid/expert-coaching-resources/localAI.md)), and the same model family on a 16 GB Apple Silicon machine — full-precision BF16, Metal build — is written up in [Running K2-Horizon Locally on Apple Silicon](/farshid/content/k2-horizon-local.md). This page is the 8 GB discrete-GPU version: the capacity math, the Windows landmine, the wiring into the agent, and the harness question that decides whether a small local model is actually useful.

## The KV cache decides the budget, not the weights

A 3.7B model at 2 bits is tiny — 1,596 MiB. It still does not automatically fit, because the context is charged separately. Geometry parsed from the real GGUF header (not guessed): 36 blocks, 8 KV heads, head_dim 128, 32 Q heads (GQA 4:1), 2560 embedding, 524,288 native context.

KV cache per token = 2 (K, V) x 36 layers x 8 KV heads x 128 dim x bytes per element. At 64K context:

| KV dtype | KV cache at 64K | Verdict on an 8,188 MiB card |
|---|---|---|
| F16 | 9,216 MiB | does not fit — the cache alone exceeds the whole card |
| Q8_0 | 4,608 MiB | fits with a small quant |
| Q4_0 | 2,304 MiB | fits with room to spare |

So KV quantization plus `-fa on` (flash attention, required for a quantized V cache) is not tuning — it is the precondition for 64K on this hardware. The model satisfies `head_dim_k == head_dim_v == 128`, so the flash-attention requirement is met.

This is also where the extra headroom comes from. Cheaper weights buy context:

| Context | KV F16 | KV Q8_0 | KV Q4_0 |
|---|---|---|---|
| 32,768 | 6,996 | 4,692 | 3,540 |
| 65,536 | 11,604 | 6,996 | 4,692 |
| 131,072 | 20,820 | 11,604 | 6,996 |

*(Totals in MiB including weights, a 492 MiB logits buffer and ~300 MiB CUDA/graph overhead; usable ceiling ~7,500 of 8,188 MiB.)*

Read that table as a trade, not a free win. 2-bit weights at 131K context is roughly the same memory as 4-bit weights at 64K context — and you buy context with quality. The plan kept both: IQ2_XXS at 64K as the default, Q4_K_M at 64K as the quality-first option, both wired so the choice is per task.

## The configuration

```
llama-server.exe -m K2-Horizon-3.7B-IQ2_XXS.gguf \
  -ngl 99 -c 65536 -fa on -ctk q8_0 -ctv q4_0 -ub 512 -b 2048 \
  --host 127.0.0.1 --port 8080
```

| Item | Value |
|---|---|
| Weights | `K2-Horizon-3.7B-IQ2_XXS.gguf` — 1,673,165,504 bytes (1,596 MiB) |
| Context | 65,536 |
| KV cache | K at q8_0, V at q4_0 |
| GPU offload | `-ngl 99` (all 36 layers) |
| Micro-batch | `-ub 512` — at `-ub 2048` the logits buffer alone reaches 1.91 GiB and breaks the budget |
| Estimated VRAM | 5,843 MiB of 8,188 — **arithmetic, not a measurement** |

Two more data points from the same increment, both arithmetic: the 3.67 GiB Q5_1 quant needs 7,920 MiB at KV-K8/V4 against ~7,500 usable, i.e. over by about 420 MiB — it is valid only with KV pushed to q4_0/q4_0. And F16 KV is not viable at 64K at any quant that fits.

## What actually got built

Two of the four "done" items, and the honest status matters more than the plan did:

| Step | Result |
|---|---|
| Download the GGUF | 1,673,165,504 bytes exactly; sha256 `446953b4…4715ce` matches the HuggingFace LFS metadata; GGUF v3, 327 tensors, 35 KV pairs, `general.architecture = k2-horizon` |
| Build the runtime | Fork `MBZUAI-IFM/llama.cpp` at commit `35999d1…`; MSVC 19.44 + CUDA 12.6.85, `CMAKE_CUDA_ARCHITECTURES=89`, 652/652 targets, exit 0 |
| Serve at 64K and measure VRAM | not done — the 5,843 MiB figure is still arithmetic |
| Select it inside the agent end to end | not done |

The download task ran 582 seconds and passed all six acceptance checks, including "nothing written to the C: HuggingFace cache" and "the three pre-existing Ollama models still list". The one behaviour worth copying: the implementing bot noticed that the hash it recorded happened to resemble hash material quoted elsewhere in the spec, and asked for independent confirmation instead of declaring success. The confirming check (HuggingFace's `lfs.sha256`) went to the reviewer, not to the bot that wanted to believe itself.

Ollama is not that runtime: its bundled llama.cpp ships a 147-entry architecture registry with zero `k2`, `k2_horizon` or `horizon` entries, the byte count for `k2_horizon` in its four native libraries is 0,0,0,0, and the upstream pull request to llama.cpp is still open. No prebuilt Windows binary exists (0 releases), so a source build was the only route.

## The Windows landmine

K2-Horizon's BPE pre-tokenizer uses `\u200C` and `\u200D` in a regex. MSVC's regex rejects those escapes at load time:

```
Regex error: regex_error(error_escape)
llama_model_load: error loading model vocabulary
```

That is an open llama.cpp issue, not an unsupported architecture, and it is exactly the kind of failure that gets misreported in a handoff. GCC does not reproduce it (it truncates instead of throwing), so a MinGW build is a legitimate patch-free route. The increment authored a patch that replaces the escapes with literal UTF-8 bytes, built it against the pinned commit, and recorded the caveat in the same breath: **the fix is compile-time only, so a real model load is still the proof**. It is not yet run.

Two smaller build notes that cost real time: an absolute-path `git clone` into `/d/...` silently no-ops under native git (the relative form works), and Ollama's bundled `llama-server.exe` looks like the binary you want but has no K2 support at all.

## Wiring a local model in without changing the default

"Selectable if I want it" is a specific requirement, and it is not satisfied by a server listening on a port. In Hermes it takes two config surfaces:

```yaml
custom_providers:
  - name: k2horizon
    base_url: http://127.0.0.1:8080/v1
    model: K2-Horizon-3.7B-IQ2_XXS
    models:
      K2-Horizon-3.7B-IQ2_XXS: {context_length: 65536}
model_aliases:
  k2: {model: K2-Horizon-3.7B-IQ2_XXS, provider: custom, base_url: "http://127.0.0.1:8080/v1"}
```

- `custom_providers` puts the model in the picker; `model_aliases` makes `/model k2` work. Both are needed.
- `context_length` per custom model is required, otherwise the agent cannot budget context and will over-send.
- The default model stays what it was. Adding a local option is opt-in; making it the default silently changes every session.
- Config goes through `hermes config set` and then `hermes doctor` — not a hand-edited `config.yaml`, where one bad indent takes the gateway down.
- The server must be running. Selecting the alias does not start it, which is why persistence (a service or scheduled task) is its own increment. Without it the alias dies on reboot.

## Three rules worth stealing

1. **Arithmetic is not a measurement.** The 5,843 MiB figure is a sum of five terms. Only `nvidia-smi` counts, and until it runs the number is a hypothesis.
2. **A truncated download's `EOF` is not an architecture verdict.** A partial file produced `unexpected EOF` during reconnaissance; recording that as "unsupported architecture" would have sent the whole plan down the wrong path.
3. **A config entry is not proof.** The requirement is a returned completion from the local server, through the agent. Anything less is a plan that looks finished on a slide.

There is a fourth, quieter one: the same increment produced five successive plans and handoffs, each superseding the last, and every one of them kept the superseded file and stated what changed. The version history is the audit trail.

## What the harness layer does with a model this small

The second increment in the same artifacts folder is a one-hour talk from YC Harness Club ("Harness Night", video `n9xKblqyQ28`), transcribed to 1,662 segments and rebuilt as a slide deck. Its argument is the complement of everything above: if you are running a 2-bit 3.7B model on a laptop GPU, the weights are the fixed part — the harness is the part you still control.

- The claim that carries the night: an 18% difference between harness one and harness two on the same weights, and the difference between ARC-AGI working and not working. Prompt-only scoring on ARC-AGI sits around 30%; a harness with a REPL and sub-agents reaches 95.5% with one model and 78% with another. Same weights, different harness.
- The ladder runs from v0 (prompt only, 2019) through tools, skills, reflection and sub-agents, to a self-improving harness (a meta-harness editing the agent's own harness) and a continual harness that refines skills and memory inside a single run.
- Context becomes a managed resource with levels: weights, the active window, a live Python REPL, and disk. Compaction, cache clearing and memory are three different operations, and only memory survives a context reset.
- The local-model argument is stated plainly: cloud-bound agents cost thousands of dollars a year in API spend and send your most personal data off the device, while a 27B local model was reaching roughly the level of a frontier model from August 2025. That is the same class of hardware as the 8 GB laptop above — and the reason the capacity math in this page is worth doing properly.
- Production practice matches: sub-agents isolate context (a child can burn 50K tokens and return a 1,500-token summary, at roughly 15x the token cost), prompt caching and tool-result clearing are first-class levers, and cutting tool output by 91% cut measured cost by only 11.9% because most tokens are reasoning, not tool output.
- The counter-paper is the most useful slide in the deck: harness-evolution papers that search and test on the same benchmark report gains that do not survive a held-out split. Hold out the test set and match the budget before believing an improvement — the same rule as "a config entry is not proof", applied to research.

Two details from the talk that landed closer to home than expected: YC ran a fleet of 50+ Hermes agents in VMs before consolidating onto a centralized store, and the talk's own history of harnesses is measured in months, not years.

## The one line that ties it together

Both increments are the same work from two directions. On the local side you spend memory to buy context, and you refuse to claim a number you have not measured. On the harness side you spend context to buy capability, and you refuse to claim a gain you have not held out. A 2-bit model on an 8 GB laptop is not a compromise if the harness around it is doing the work — and neither claim is worth anything until a real completion comes back.


