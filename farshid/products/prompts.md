# Local LLM — Prompts & Keywords Bank (reusable for future models)
Use these to (a) benchmark any new local model fast, and (b) ask for the right optimization tags.

## Prompt templates to copy-paste

### 1. Simple benchmark (any OpenAI-compatible endpoint)
```
What is 2+2? Reply with just the number.
```
Expected: `4`. If you get a long "Thinking Process..." or an empty reply,
the model is a reasoning model that needs thinking suppressed.

### 2. Suppress thinking — pass as request kwargs
```json
{ "chat_template_kwargs": { "enable_thinking": false } }
```
Ollama: `options = { "num_predict": N }` — NOTE: on `/api/generate` Ollama strips
reasoning and can return an EMPTY response; use `/api/chat` or `/v1/chat/completions`.

### 3. Latency / throughput (tok/s), apples-to-apples
```
Write a haiku about the ocean then explain it in one sentence.
```
- 1.7B+ / 64K models: set `max_tokens` ≥ 256 so reasoning can finish.
- Compare the same prompt freshly (first token = load) and warm (after 1 prior request).

### 4. Sanity: does it actually answer, or burn tokens thinking?
```
What is the capital of Japan? Answer in one word only.
```
Pass `max_tokens: 32`. Reasoning models WILL come back empty @32 — that is a
model/backend problem, not a tuning problem. A non-reasoning or thinking-suppressed
model returns `Tokyo`.

### 5. Tool-calling (for use inside Hermes / agent loops)
```
You have a tool get_weather(city). Call it to get the weather in Tokyo, then tell me.
```
Verify the reply contains a tool call (`[{"name":"get_weather",...}]`), not prose.

## Keywords to include when asking an assistant to set up a local model

Hardware/Apple latest:
`Apple Silicon`, `MLX`, `mlx-lm`, `Neural Engine`, `ANE`, `CPU+GPU+NPU`,
`Metal`, `precompiled kernels`, `iogpu.wired_limit_mb`

oMLX specifics:
`oMLX`, `continuous batching`, `tiered KV cache`, `hot/cold cache`, `paged cache`,
`prefix sharing`, `Copy-on-Write`, `LRU multi-model`, `memory guard`,
`chat_template_kwargs`, `enable_thinking:false`, `profiles`, `speculative decode`

llama.cpp tuning:
`llama-server`, `-ngl 99`, `-fa on` (flash attention), `-ctk q8_0 -ctv q8_0` (quantized KV cache),
`--cache-reuse`, `-cb` (continuous batching), `-t`, `--alias`, `GGML_MLX=on`,
`-hf-repo`/`--hf-file`

Context/QoL:
`64K context`, `max_model_len`, `context caching`, `KV shift`, `keep-alive`,
`OLLAMA_CONTEXT_LENGTH`, `OLLAMA_MAX_LOADED_MODELS`, `OLLAMA_NUM_PARALLEL`,
`OLLAMA_KEEP_ALIVE`, `OLLAMA_NO_CLOUD`

## One-liner prompts for the next model
- "Use the latest Apple MLX stack on this Mac: CPU+GPU+NPU, continuous batching, paged SSD KV cache, precompiled kernels. Put it on Hermes via a custom provider at /v1 and keep 64K context."
- "Serve a Qwen3.5 small model with thinking SUPPRESSED by default so responses are clean and fast, at 64K context, with flash attention and quantized KV cache."
- "For a reason model, give max_tokens >= 256 or set chat_template_kwargs.enable_thinking=false — otherwise it burns budget on thinking and returns empty."
- "Prefer oMLX (MLX) on Mac for NPU coverage; llama.cpp Metal has no NPU. Quantize KV cache (q8_0) to fit 64K on 16GB."

## Pitfalls worth remembering
- Reasoning models (Qwen3/3.5) return **empty/`@@@`** if they run out of budget thinking — never attribute to slowness, it's a token-budget/template issue.
- On Ollama, `/api/generate` strips reasoning (empty reply) but `/api/chat` and `/v1/chat/completions` are fine.
- 16GB: don't let context default to a model's full 256K — pre-allocates KV from RAM.
- Quantize KV cache (q8_0) + flash attention = biggest win at long context.