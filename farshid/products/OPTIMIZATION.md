# Local LLM Optimization on Apple Silicon (M3, 16GB) — Fastest Model for Hermes at 64K Context

Target machine (verified live): **Apple M3, 16GB, macOS 27**, Xcode 26.6.
Goal: run the **fastest small reasoning model** inside **Hermes Agent** with **64K context**,
using the latest Apple-native acceleration (CPU + GPU + NPU via **MLX**).

## ✅ Current live state (this machine, Sep 4 2026)

- **Hermes → oMLX (port 8000)**. Default model `Qwen3.5-4B-OptiQ-4bit` (since Sep 5 2026);
  `Qwen3.5-0.8B-OptiQ-4bit` also served (fallback / small-quick). Both MLX safetensors,
  64K context via the `q35` custom provider.
  `~/.hermes/config.yaml`:
  ```yaml
  model:
    default: Qwen3.5-4B-OptiQ-4bit
    provider: custom
    base_url: http://127.0.0.1:8000/v1
  ```
  Memory-summarizer, delegation block, and the `q35` custom provider all repointed to 8000.
  Old config saved as `~/.hermes/config.yaml.bak-ollama`.
- **Ollama is up but unused by Hermes**: `ollama serve` is running on :11434
  (launchd `com.farshid.ollama.plist`, RunAtLoad), but Hermes's `base_url` points at
  oMLX on :8000, not Ollama. It is harmless idle capacity — re-enable in config if wanted.
- **Hermes gateway runs as a headless daemon** (launchd `ai.hermes.gateway`, RunAtLoad +
  KeepAlive). The **Telegram bot works with NO terminal open** — it only needs this daemon,
  which auto-starts at login. Verify: `launchctl list | grep hermes`. If the bot is silent,
  check the gateway is loaded/running first.
- **oMLX auto-starts via launchd** (see §7): `~/Library/LaunchAgents/com.farshid.omlx-serve.plist`
  (RunAtLoad + KeepAlive) holds :8000 across reboots/logout. This was the root cause of
  "local LLM inference not running after boot" — the server had been started by hand in a
  terminal and died on logout, leaving :8000 silent and every inference failing with
  `Connection refused` ("Auxiliary title generation failed: Connection error").

## Bottom line (measured on this M3)

| Path | Status | Model | Thinking output | Speed | Verdict |
|---|---|---|---|---|---|
| **oMLX (MLX) — port 8000** | **ACTIVE** | `Qwen3.5-4B-OptiQ-4bit` default (0.8B also served) | Clean final answer; thinking suppressible per-request | **4B ≈ 40 tok/s, 0.8B ≈ 79–98 tok/s** | Max-native CPU+GPU+ANE, continuous batching, paged tiered KV cache. |
| Ollama MLX — port 11434 | **disabled** | `qwen3.5:0.8b-mlx` | `/api/generate` returns **empty** (reasoning stripped); `/api/chat` and `/v1/chat/completions` fine | 75 tok/s | Works but contrives reasoning handling; no per-request thinking toggle. |
| llama.cpp (Metal) — port 8080 | fallback only | `Qwen3.5-0.8B-Q4_K_M.gguf` / `Qwen3-1.7B-Q8_0` | `@@@` decode or empty when reasoning burns budget | 67–78 tok/s | No NPU; reasoning + jinja quirks. |

> **Key insight: Qwen3/3.5 are reasoning models.** Out of the box they burn the whole prompt
> budget on `thinking` and return an **empty final message** if you don't give them room or
> suppress thinking. oMLX makes thinking suppression trivial via `chat_template_kwargs`.

## What "all processors" means on Apple Silicon
- **MLX** (Apple's framework, `mlx-lm`): schedules on **CPU + GPU + ANE (Neural Engine)**.
- **llama.cpp** with Metal: **CPU + GPU only**, no NPU.
- **oMLX** is built on `mlx-lm` → full MLX device coverage (CPU + GPU + NPU).

If you specifically need NPU: use the MLX/oMLX path. llama.cpp cannot touch the Neural Engine.

---

## 1. Install oMLX (macOS app; precompiled kernels included)

```bash
# Homebrew (needs Xcode 27.0 in current formula; on macOS 27 with Xcode 26.6 this FAILED —
# use the DMG instead):
brew tap jundot/omlx
brew install jundot/omlx/omlx          # requires Xcode 27.0

# Recommended: official DMG (ships precompiled MLX custom kernels, no Xcode build)
curl -L -o /tmp/oMLX.dmg \
  "https://github.com/jundot/omlx/releases/download/v0.6.4/oMLX-0.6.4-macos26-27.dmg"
hdiutil attach /tmp/oMLX.dmg -nobrowse
cp -R /Volumes/oMLX/oMLX.app /Applications/
hdiutil detach /Volumes/oMLX
```

CLI entry points:
```bash
/Applications/oMLX.app/Contents/MacOS/omlx-cli        # CLI
/Applications/oMLX.app/Contents/Resources              # bundled Python + MLX
```
Verify kernels: `omlx-cli --version` → `0.6.4`.

## 2. Serve a model with oMLX (64K context, continuous batching, paged KV cache)

```bash
# Models live in ~/.omlx/models (subdirectory name = model_id),
# each an MLX safetensors dir with config.json + *.safetensors + chat_template.jinja.
mkdir -p ~/.omlx/models/Qwen3.5-0.8B-OptiQ-4bit
# Download via the admin dashboard's model downloader, or hf snapshot_download.

# Run as a managed background server:
omlx-cli start

# Or run the CLI server directly:
/Applications/oMLX.app/Contents/MacOS/omlx-cli serve \
  --model-dir ~/.omlx/models \
  --port 8000 --host 127.0.0.1 \
  --log-level info
```

oMLX enables the optimization stack **by default**:
- **Continuous batching** (concurrent requests, mlx-lm batch generator)
- **Tiered/paged KV cache**: hot tier in RAM + cold tier on SSD (safetensors) → keeps 64K+ context usable, persists across context changes
- **LRU multi-model memory** + memory guard (default ceiling ≈ RAM − 8 GB)
- **Prefix sharing + Copy-on-Write** blocks, vLLM-style
- `max_model_len` reported as 262144 → **64K context is comfortably within this**

Server log on this M3:
```
Metal cap (11.8GB ...) below oMLX static ceiling (12.0GB);
raise wired memory with: sudo sysctl iogpu.wired_limit_mb=12288
```
(Optional, only if you ever OOM serving bigger models.)

## 3. Suppress thinking (the reason many Qwen3.5 results come back empty)

Per-request, in the OpenAI-compatible body:
```json
{ "model": "Qwen3.5-0.8B-OptiQ-4bit",
  "messages": [...],
  "max_tokens": 256,
  "chat_template_kwargs": { "enable_thinking": false } }
```
Without it the model pastes its reasoning into `content` ("Thinking Process:\n..."). With it, a clean `4`.

For Hermes, if you want terse model answers, configure persistent per-model chat-template
kwargs in the oMLX admin panel (Per-Model Settings) or pass kwargs at the request layer.

## 4. Hermes integration (done on this machine)

Edit `/Users/farshid/.hermes/config.yaml` (security-guarded — do it via `sed`/edit, or roll
back from `config.yaml.bak-ollama`):
```yaml
model:
  default: Qwen3.5-4B-OptiQ-4bit
  provider: custom
  base_url: http://127.0.0.1:8000/v1   # was http://127.0.0.1:11434/v1 (Ollama)
```
Also repoint (both silently used Ollama before):
- `memory:` → `provider: custom`
- `delegation:` → `provider: custom`, `base_url: http://127.0.0.1:8000/v1`
- `custom_providers:` (the `q35` entry) → base_url 8000, model `Qwen3.5-4B-OptiQ-4bit`
  (both `Qwen3.5-0.8B-OptiQ-4bit` and `Qwen3.5-4B-OptiQ-4bit` listed, 64K context each)

Then restart the gateway: `hermes gateway restart`. Verify:
`hermes status` → Model `Qwen3.5-4B-OptiQ-4bit`, Provider "Custom endpoint".

## 5. Alternate path — llama.cpp (Metal) full optimization

If you prefer llama.cpp (CPU+GPU, **no NPU**), the maximized command (validated build 0.3.0 b10621):
```bash
llama-server -m /path/Qwen3.5-0.8B-Q4_K_M.gguf \
  -c 65536 -ngl 99 -fa on -ctk q8_0 -ctv q8_0 \
  -b 1024 -ub 1024 --cache-reuse 256 -t 8 \
  --alias qwen3.5-0.8b-q4 \
  --port 8080 --host 127.0.0.1
```
- `-ngl 99` = all layers on GPU (Metal device `MTL0: Apple M3`, 12GB)
- `-fa on` = flash attention
- `-ctk q8_0 -ctv q8_0` = quantized KV cache → biggest long-context memory win
- `-cb` continuous batching, `--cache-reuse` = prompt caching
- Custom binary with MLX backend for full CPU+GPU+NPU: `GGML_MLX=on` (upstream llama.cpp; **not** in Homebrew 0.3.0).

## 6. Ollama path (now disabled here, kept for reference)

Cap the KV-cache-destroying context, keep models warm, and run `serve` yourself
(Ollama.app caches env at its own spawn — menu restarts won't pick up new vars):
```bash
launchctl setenv OLLAMA_CONTEXT_LENGTH 65536
launchctl setenv OLLAMA_KEEP_ALIVE 30m
launchctl setenv OLLAMA_MAX_LOADED_MODELS 2
launchctl setenv OLLAMA_NUM_PARALLEL 2
ollama serve
```
Persistence via `~/Library/LaunchAgents/com.farshid.ollama.plist` (+ `-env.plist` for env).
To re-enable on this Mac: `launchctl load .../com.farshid.ollama.plist` and start Ollama.app.

## 7. Persistence — run as launchd daemons (survives reboot / logout, no terminal needed)

The root cause of "local LLM inference dead after boot" was the oMLX server being started by
hand in a terminal. Two user-level launchd agents keep everything alive at login:

### 7a. oMLX model server (port 8000)

`~/Library/LaunchAgents/com.farshid.omlx-serve.plist` — `RunAtLoad` + `KeepAlive`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.farshid.omlx-serve</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/omlx</string>
        <string>serve</string>
        <string>--model-dir</string>
        <string>/Users/farshid/.omlx/models</string>
        <string>--host</string>
        <string>127.0.0.1</string>
        <string>--port</string>
        <string>8000</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/farshid</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
        <key>HOME</key>
        <string>/Users/farshid</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>ThrottleInterval</key>
    <integer>30</integer>
    <key>StandardOutPath</key>
    <string>/Users/farshid/.hermes/logs/omlx-serve.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/farshid/.hermes/logs/omlx-serve.log</string>
</dict>
</plist>
```
Install/load:
```bash
launchctl load -w ~/Library/LaunchAgents/com.farshid.omlx-serve.plist
# verify:
launchctl list | grep omlx
lsof -nP -iTCP:8000 -sTCP:LISTEN
curl -s http://127.0.0.1:8000/v1/models
```
> Only one process may hold :8000. If you ever start `omlx serve` by hand, kill that PID
> before loading the plist (KeepAlive will otherwise fail to bind and retry every 30s).

### 7b. Hermes messaging gateway (Telegram / Discord / etc.)

`~/Library/LaunchAgents/ai.hermes.gateway.plist` is created by Hermes on install
(`hermes setup` / gateway init). It runs `hermes gateway run --replace --external-supervisor`
with `RunAtLoad` + `KeepAlive`. This is the headless daemon the Telegram bot talks to —
**no terminal window required**. If Telegram stops answering:
```bash
launchctl list | grep hermes        # should show ai.hermes.gateway
launchctl start ai.hermes.gateway    # if missing (NOT loaded)
launchctl load -w ~/Library/LaunchAgents/ai.hermes.gateway.plist
```
State/health: `~/.hermes/gateway_state.json` (`gateway_state`, `platforms.telegram.state`).

### 7c. Caveat

Both are **user-session** agents: they start at *login*, not before login / not on a cold boot
before your account unlocks, and they stop at logout. For a headless server that runs without a
logged-in GUI session, use a launch **daemon** (`/Library/LaunchDaemons/`, root) or
`launchctl bootstrap gui/$UID` + a persistent login session.

## RAM math (16GB unified)
- 0.8B MLX OptiQ-4bit ≈ **0.7 GB** weights + KV → tiny at 64K, very fast (oMLX server ~1.2 GB RSS)
- 4B MLX OptiQ-4bit ≈ **3 GB** (KV grows; keep 64K but watch total)
- llama.cpp 1.7B Q8 ≈ 1.8–2.2 GB at 64K with quantized KV
Never let context default to a model's full 262K on 16GB (pre-set KV eats RAM you don't have).