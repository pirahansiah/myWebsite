#!/bin/bash

echo "=== MiMoCode + Qwen3.5 9B Setup ==="

# 1. Pull model
echo "[1/4] Pulling qwen3.5:9b..."
ollama pull qwen3.5:9b

# 2. Create tuned Modelfile
echo "[2/4] Creating qwen35 with max context..."
cat > /tmp/Modelfile-qwen35 << 'MODELFILE'
FROM qwen3.5:9b
PARAMETER num_ctx 65536
PARAMETER temperature 0.0
MODELFILE
ollama create qwen35 -f /tmp/Modelfile-qwen35

# 3. Write MiMoCode config
echo "[3/4] Writing ~/.mimocode/mimocode.json..."
mkdir -p ~/.mimocode
cat > ~/.mimocode/mimocode.json << 'CONFIG'
{
  "$schema": "https://mimo.xiaomi.com//config.json",
  "model": "ollama/qwen35",
  "permission": {
    "bash": "allow",
    "read": "allow",
    "write": "ask"
  },
  "provider": {
    "ollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama",
      "options": {
        "baseURL": "http://localhost:11434/v1",
        "apiKey": "ollama"
      },
      "models": {
        "qwen35": { "name": "Qwen3.5 9B" }
      }
    }
  }
}
CONFIG

# 4. Clear MiMoCode cache
echo "[4/4] Clearing MiMoCode cache..."
rm -f ~/.local/share/mimocode/mimocode.db
rm -f ~/.local/share/mimocode/mimocode.db-shm
rm -f ~/.local/share/mimocode/mimocode.db-wal

echo ""
echo "=== Done! Launching MiMoCode... ==="
echo ""

# Launch mimo in current directory
mimo . -m ollama/qwen35
