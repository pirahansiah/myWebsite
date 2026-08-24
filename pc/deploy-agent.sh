#!/usr/bin/env bash
# pc/deploy-agent.sh — deploy the agent-server.py living in this repo to the WSL PC.
# Idempotent: only restarts when the file actually changed. Run as root in WSL.
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$REPO/pc/agent-server.py"
DEST=/opt/bin/agent-server.py
LOG=/opt/llm-redirect/deploy.log

[ -f "$SRC" ] || { echo "NO_SRC: $SRC not present (repo not pulled yet?)"; exit 1; }

changed=0
if [ ! -x "$DEST" ]; then changed=1; fi
if [ -x "$DEST" ] && ! cmp -s "$SRC" "$DEST"; then changed=1; fi

if [ "$changed" -eq 0 ]; then
  echo "$(date '+%F %T') unchanged" >> "$LOG"
  exit 0
fi

install -m 0755 "$SRC" "$DEST"
python3 -m py_compile "$DEST" || { echo "$(date '+%F %T') SYNTAX_FAIL" >> "$LOG"; exit 1; }
systemctl restart agent-server
sleep 2
ACTIVE=$(systemctl is-active agent-server)
HEALTH=$(curl -s -m 5 http://127.0.0.1:8080/__models | head -c 60 || true)
echo "$(date '+%F %T') deployed md5=$(md5sum < "$DEST") active=$ACTIVE health=$HEALTH" >> "$LOG"
echo "DEPLOYED active=$ACTIVE"