#!/usr/bin/env bash
# pc/deploy-agent.sh — deploy agent-server.py + whisper STT wrapper from this repo
# to the WSL PC. Idempotent: only restarts when a file actually changed. Root in WSL.
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
LOG=/opt/llm-redirect/deploy.log
AGENT_SRC="$REPO/pc/agent-server.py"
AGENT_DEST=/opt/bin/agent-server.py
WRAP_SRC="$REPO/pc/whisper-stt.sh"
WRAP_DEST=/opt/bin/whisper-stt.sh

[ -f "$AGENT_SRC" ] || { echo "NO_SRC: $AGENT_SRC not present (repo not pulled yet?)"; exit 1; }

changed=0
if [ ! -x "$AGENT_DEST" ] || ! cmp -s "$AGENT_SRC" "$AGENT_DEST"; then changed=1; fi
if [ -f "$WRAP_SRC" ] && { [ ! -x "$WRAP_DEST" ] || ! cmp -s "$WRAP_SRC" "$WRAP_DEST"; }; then changed=1; fi

if [ "$changed" -eq 0 ]; then
  echo "$(date '+%F %T') unchanged" >> "$LOG"
  exit 0
fi

if [ -f "$AGENT_SRC" ]; then
  install -m 0755 "$AGENT_SRC" "$AGENT_DEST"
  python3 -m py_compile "$AGENT_DEST" || { echo "$(date '+%F %T') SYNTAX_FAIL" >> "$LOG"; exit 1; }
fi
if [ -f "$WRAP_SRC" ]; then
  install -m 0755 "$WRAP_SRC" "$WRAP_DEST"
fi

systemctl restart agent-server
sleep 2
ACTIVE=$(systemctl is-active agent-server)
HEALTH=$(curl -s -m 5 http://127.0.0.1:8080/__models | head -c 60 || true)
echo "$(date '+%F %T') deployed agent_md5=$(md5sum < "$AGENT_DEST") wrapper_md5=$(md5sum < "$WRAP_DEST") active=$ACTIVE health=$HEALTH" >> "$LOG"
echo "DEPLOYED active=$ACTIVE"
