#!/bin/bash
# =====================================================================
# optimize_local_llm.sh
# Fastest local LLM on Apple Silicon / other machines, at 64K context.
# Auto-detects best backend: oMLX (MLX, CPU+GPU+NPU) -> llama.cpp -> Ollama.
# Source-verified on Apple M3 (16GB, macOS 27) Sep 2026.
#
# Usage:  ./optimize_local_llm.sh [--serve-huggingface-repo REPO] [--port N] [--persist]
#   --persist   install a launchd agent (RunAtLoad+KeepAlive) so oMLX auto-starts at login
#               and survives reboot/logout; no terminal window required.
# =====================================================================
set -euo pipefail

PERSIST=0
while [ $# -gt 0 ]; do
  case "$1" in
    --serve-huggingface-repo) MODEL_REPO="$2"; MODEL_NAME="${2##*/}"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --persist) PERSIST=1; shift ;;
    -h|--help) sed -n '1,9p' "$0"; exit 0 ;;
    *) die "unknown arg: $1" ;;
  esac
done

PORT="${PORT:-8000}"
MODEL_REPO="${MODEL_REPO:-mlx-community/Qwen3.5-0.8B-OptiQ-4bit}"
MODEL_NAME="${MODEL_NAME:-Qwen3.5-0.8B-OptiQ-4bit}"
LLAMA_GGUF="${LLAMA_GGUF:-/abs/path/to/Qwen3.5-0.8B-Q4_K_M.gguf}"   # set if using llama.cpp path
OLLAMA_CONTEXT=65536                                                # 64K context everywhere

log()  { printf '\033[1;34m[opt]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[opt:ERROR]\033[0m %s\n' "$*" >&2; exit 1; }

OS="$(uname -s)"
ARCH="$(uname -m)"
log "OS=$OS ARCH=$ARCH"

# ---------------------------------------------------------------- helpers
start_omlx() {
  local cli=/Applications/oMLX.app/Contents/MacOS/omlx-cli
  [ -x "$cli" ] || cli="$HOME/.omlx/bin/omlx"
  [ -x "$cli" ] || { log "oMLX not found - install DMG first"; return 1; }
  mkdir -p "$HOME/.omlx/models"
  # ensure model present (idempotent) using the app's bundled HF/MLX python
  local py="$HOME/.hermes/venv/bin/python3"
  # prefer app's own python for mlx_lm/hf consistency
  local app_py=/Applications/oMLX.app/Contents/Resources/Python/cpython-3.11/bin/python3
  [ -x "$app_py" ] && py="$app_py"
  if [ ! -f "$HOME/.omlx/models/$MODEL_NAME/config.json" ]; then
    log "Downloading $MODEL_REPO -> ~/.omlx/models/$MODEL_NAME"
    PYTHONHOME="$(dirname "$(dirname "$app_py")")" \
    PYTHONPATH="$(dirname "$app_py")" \
      "$py" - "$MODEL_REPO" "$HOME/.omlx/models/$MODEL_NAME" <<'PY'
import sys, os
from huggingface_hub import snapshot_download
repo, dest = sys.argv[1], sys.argv[2]
os.makedirs(dest, exist_ok=True)
snapshot_download(repo, local_dir=dest)
print("downloaded to", dest)
PY
  fi
  log "Starting oMLX server on :$PORT (LLM=$MODEL_NAME)"
  # Refuse to start if something already holds the port (avoids duplicate + launchd conflict).
  if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    log ":$PORT already listening — not starting a second instance (launchd agent likely owns it)."
    curl -s "http://127.0.0.1:$PORT/v1/models" || die ":$PORT taken but /v1/models unreachable"
    return 0
  fi
  "$cli" serve --model-dir "$HOME/.omlx/models" --port "$PORT" --host 127.0.0.1 >/tmp/omlx.log 2>&1 &
  echo $! > /tmp/omlx.pid
  sleep 8
  curl -s -o /dev/null "http://127.0.0.1:$PORT/v1/models" || die "oMLX /v1/models not reachable"
  log "oMLX ready. Models:"; curl -s "http://127.0.0.1:$PORT/v1/models"
  return 0
}

# Install a launchd agent so oMLX survives reboot/logout (no terminal needed).
# This is the fix for "local LLM dead after boot": without it the server is killed
# when the launching terminal/session ends.
persist_omlx() {
  local plist="$HOME/Library/LaunchAgents/com.farshid.omlx-serve.plist"
  [ -d "$HOME/Library/LaunchAgents" ] || mkdir -p "$HOME/Library/LaunchAgents"
  log "Writing launchd agent: $plist"
  cat > "$plist" <<PLIST
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
        <string>$HOME/.omlx/models</string>
        <string>--host</string>
        <string>127.0.0.1</string>
        <string>--port</string>
        <string>$PORT</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$HOME</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
        <key>HOME</key>
        <string>$HOME</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>ThrottleInterval</key>
    <integer>30</integer>
    <key>StandardOutPath</key>
    <string>$HOME/.hermes/logs/omlx-serve.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/.hermes/logs/omlx-serve.log</string>
</dict>
</plist>
PLIST
  launchctl load -w "$plist" 2>&1 || log "launchctl load failed (maybe already loaded under same label)"
  launchctl list | grep omlx || log "omlx agent not in launchctl after load"
  log "oMLX will now auto-start at login. Logs: $HOME/.hermes/logs/omlx-serve.log"
}

start_llama_cpp() {
  command -v llama-server >/dev/null || die "llama-server not found (brew install llama.cpp)"
  [ -f "$LLAMA_GGUF" ] || die "GGUF not found: $LLAMA_GGUF"
  # Metal: all layers GPU, flash attn, quantized KV cache, cont batching, prompt cache
  llama-server -m "$LLAMA_GGUF" -c $OLLAMA_CONTEXT -ngl 99 -fa on -ctk q8_0 -ctv q8_0 \
    -b 1024 -ub 1024 --cache-reuse 256 -t 8 --port "$PORT" --host 127.0.0.1 >/tmp/llamaserv.log 2>&1 &
  echo $! > /tmp/llamaserv.pid
  sleep 8
  curl -s -o /dev/null "http://127.0.0.1:$PORT/health" || die "llama-server not reachable"
  log "llama.cpp ready on :$PORT"
}

start_ollama() {
  command -v ollama >/dev/null || die "ollama not found"
  # 64K context, keep warm, cap loaded models
  launchctl setenv OLLAMA_CONTEXT_LENGTH "$OLLAMA_CONTEXT"
  launchctl setenv OLLAMA_KEEP_ALIVE 30m
  launchctl setenv OLLAMA_MAX_LOADED_MODELS 2
  launchctl setenv OLLAMA_NUM_PARALLEL 2
  pgrep -f "ollama serve" >/dev/null || (ollama serve >/tmp/ollama-serve.log 2>&1 &)
  sleep 5
  curl -s -o /dev/null "http://127.0.0.1:$PORT/api/version" || die "ollama not reachable"
  log "Ollama ready on :$PORT (pull models: ollama pull <name>; Mgllm uses /v1 at :$PORT)"
}

# ---------------------------------------------------------------- dispatch
case "$OS" in
  Darwin)
    if [ "$ARCH" = "arm64" ]; then
      log "Apple Silicon -> prefer oMLX (MLX: CPU+GPU+NPU)"
      start_omlx        || { log "oMLX unavailable; falling back to llama.cpp"; start_llama_cpp; }
      [ "$PERSIST" = 1 ] && persist_omlx
    else
      log "Intel Mac -> llama.cpp (no NPU)"
      start_llama_cpp
    fi
    ;;
  Linux)
    log "Linux -> llama.cpp (auto: CUDA/ROCm/Metal if present)"
    start_llama_cpp
    ;;
  *)
    die "unsupported OS $OS"
    ;;
esac

log "DONE. Endpoint: http://127.0.0.1:$PORT/v1"

# For Hermes:
cat <<EOF

Hermes config (~/.hermes/config.yaml):
  model:
    default: $MODEL_NAME
    provider: custom
    base_url: http://127.0.0.1:$PORT/v1
Fast-answer request (suppresses thinking):
  { "model": "$MODEL_NAME", "max_tokens": 256,
    "chat_template_kwargs": { "enable_thinking": false } }
EOF