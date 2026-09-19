#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# OpenRouter + Ollama + Qwen 3.5 — All-in-One Setup
# ═══════════════════════════════════════════════════════════════════
# Usage: bash OpenRouter_config.sh
# Run once to install, configure, and test everything.
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Colors ──────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $*"; exit 1; }

# ─── 1. Install Ollama ──────────────────────────────────────────
echo ""
echo -e "${CYAN}══════ Step 1: Install Ollama ══════${NC}"

if command -v ollama &>/dev/null; then
    ok "Ollama already installed: $(ollama --version 2>/dev/null || echo 'unknown version')"
else
    info "Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
    ok "Ollama installed"
fi

# ─── 2. Start Ollama server ─────────────────────────────────────
echo ""
echo -e "${CYAN}══════ Step 2: Start Ollama Server ══════${NC}"

if curl -s http://localhost:11434/api/tags &>/dev/null; then
    ok "Ollama server is running"
else
    info "Starting Ollama server..."
    ollama serve &>/dev/null &
    sleep 3
    if curl -s http://localhost:11434/api/tags &>/dev/null; then
        ok "Ollama server started"
    else
        fail "Could not start Ollama server. Run 'ollama serve' manually."
    fi
fi

# ─── 3. Pull Qwen 3.5 models ───────────────────────────────────
echo ""
echo -e "${CYAN}══════ Step 3: Pull Qwen 3.5 Models ══════${NC}"

pull_model() {
    local model="$1"
    if ollama list 2>/dev/null | grep -q "^${model}"; then
        ok "Already installed: ${model}"
    else
        info "Pulling ${model}..."
        ollama pull "$model"
        ok "Pulled: ${model}"
    fi
}

pull_model "qwen3.5:9b"
pull_model "qwen3.5:4b-mlx"

echo ""
info "Installed models:"
ollama list 2>/dev/null | grep -i qwen

# ─── 4. Configure OpenRouter API Key ────────────────────────────
echo ""
echo -e "${CYAN}══════ Step 4: Configure OpenRouter ══════${NC}"

OPENROUTER_ENV="$HOME/.config/openrouter/env"
mkdir -p "$HOME/.config/openrouter"

if [ -f "$OPENROUTER_ENV" ]; then
    source "$OPENROUTER_ENV"
    if [ -n "${OPENROUTER_API_KEY:-}" ]; then
        ok "OpenRouter API key already configured"
    else
        warn "File exists but OPENROUTER_API_KEY is empty"
        read -rp "Enter your OpenRouter API key: " API_KEY
        echo "OPENROUTER_API_KEY=${API_KEY}" > "$OPENROUTER_ENV"
        ok "API key saved to ${OPENROUTER_ENV}"
    fi
else
    warn "No OpenRouter API key found"
    echo "  Get one at: https://openrouter.ai/keys"
    read -rp "Enter your OpenRouter API key (or press Enter to skip): " API_KEY
    if [ -n "$API_KEY" ]; then
        echo "OPENROUTER_API_KEY=${API_KEY}" > "$OPENROUTER_ENV"
        chmod 600 "$OPENROUTER_ENV"
        ok "API key saved to ${OPENROUTER_ENV}"
    else
        warn "Skipping OpenRouter API key — you can set it later"
    fi
fi

# ─── 5. Shell Integration ──────────────────────────────────────
echo ""
echo -e "${CYAN}══════ Step 5: Shell Integration ══════${NC}"

SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_RC="$HOME/.bashrc"
fi

MARKER="# >>> OpenRouter + Ollama setup >>>"

if [ -n "$SHELL_RC" ] && grep -q "$MARKER" "$SHELL_RC" 2>/dev/null; then
    ok "Shell already configured in $(basename $SHELL_RC)"
elif [ -n "$SHELL_RC" ]; then
    cat >> "$SHELL_RC" << 'SHELLBLOCK'

# >>> OpenRouter + Ollama setup >>>
export OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-}"
export OLLAMA_HOST="http://localhost:11434"
alias ollama-chat='ollama run qwen3.5:9b'
alias ollama-code='ollama run qwen3.5:4b-mlx'
# <<< OpenRouter + Ollama setup <<<
SHELLBLOCK
    ok "Added aliases to $(basename $SHELL_RC)"
    info "Run 'source $SHELL_RC' or restart terminal"
else
    warn "No shell RC found — add manually:"
    echo '  export OPENROUTER_API_KEY="your-key"'
    echo '  export OLLAMA_HOST="http://localhost:11434"'
fi

# ─── 6. OpenRouter Python Helper ────────────────────────────────
echo ""
echo -e "${CYAN}══════ Step 6: Python Helper ══════${NC}"

PYTHON_HELPER="$HOME/.config/openrouter/query.py"
cat > "$PYTHON_HELPER" << 'PYEOF'
#!/usr/bin/env python3
"""Query OpenRouter API with Qwen models."""
import os, sys, json, requests

API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

MODELS = {
    "qwen3.5":   "qwen/qwen3-235b-a22b",
    "qwen3.5-8b":"qwen/qwen3-8b",
    "qwen3-coder":"qwen/qwen3-coder",
}

def query(prompt, model="qwen3.5", stream=False):
    if not API_KEY:
        print("Error: Set OPENROUTER_API_KEY environment variable", file=sys.stderr)
        sys.exit(1)

    model_id = MODELS.get(model, model)
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model_id,
        "messages": [{"role": "user", "content": prompt}],
        "stream": stream,
    }

    resp = requests.post(BASE_URL, headers=headers, json=payload, stream=stream)
    resp.raise_for_status()

    if stream:
        for line in resp.iter_lines():
            if line:
                chunk = json.loads(line.decode().removeprefix("data: "))
                delta = chunk["choices"][0]["delta"].get("content", "")
                print(delta, end="", flush=True)
        print()
    else:
        return resp.json()["choices"][0]["message"]["content"]

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python query.py 'your prompt' [model]")
        print(f"Models: {', '.join(MODELS.keys())}")
        sys.exit(1)
    prompt = sys.argv[1]
    model = sys.argv[2] if len(sys.argv) > 2 else "qwen3.5"
    print(query(prompt, model))
PYEOF
chmod +x "$PYTHON_HELPER"
ok "Python helper saved to ${PYTHON_HELPER}"
info "Usage: python3 ${PYTHON_HELPER} 'your prompt' [model]"

# ─── 7. Test Setup ─────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════ Step 7: Test Setup ══════${NC}"

info "Testing local Ollama with qwen3.5:9b..."
RESPONSE=$(ollama run qwen3.5:9b "Say 'Ollama + Qwen 3.5 is working!' in one sentence." 2>/dev/null | head -1)
if [ -n "$RESPONSE" ]; then
    ok "Local Ollama response: ${RESPONSE}"
else
    warn "Local test returned empty (model may still be loading)"
fi

# ─── Summary ────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Local models (Ollama):"
echo "    ollama run qwen3.5:9b          # Full model (6.6GB)"
echo "    ollama run qwen3.5:4b-mlx      # Fast Apple Silicon (4GB)"
echo "    ollama run qwen35-coder        # Code specialist"
echo ""
echo "  OpenRouter (cloud):"
echo "    python3 ~/.config/openrouter/query.py 'your prompt'"
echo ""
echo "  Aliases (restart terminal first):"
echo "    ollama-chat                    # qwen3.5:9b"
echo "    ollama-code                    # qwen3.5:4b-mlx"
echo ""
echo "  OpenRouter API key: ~/.config/openrouter/env"
echo "  Python helper:      ~/.config/openrouter/query.py"
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
