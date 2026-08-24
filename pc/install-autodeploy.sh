#!/usr/bin/env bash
# pc/install-autodeploy.sh — (run as root in WSL, one time)
# Makes the PC SELF-DEPLOY agent-server.py from this repo every 2 minutes, so the
# next time I push a new agent-server.py it applies itself — no SSH needed.
# Usage:  bash /opt/llm-redirect/myWebsite/pc/install-autodeploy.sh
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY="$REPO/pc/deploy-agent.sh"
chmod +x "$DEPLOY"

[ -f "$DEPLOY" ] || { echo "deploy-agent.sh missing"; exit 1; }

# 1) systemd service + timer that runs the deploy check every 2 min
cat > /etc/systemd/system/llm-autodeploy.service <<EOF
[Unit]
Description=Auto-deploy agent-server.py from site repo
After=network-online.target llm-redirect-update.service
[Service]
Type=oneshot
ExecStart=$DEPLOY
EOF

cat > /etc/systemd/system/llm-autodeploy.timer <<EOF
[Unit]
Description=Auto-deploy agent-server.py every 2 min
[Timer]
OnBootSec=2min
OnUnitActiveSec=2min
Persistent=true
[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --quiet llm-autodeploy.timer
systemctl start llm-autodeploy.timer
# deploy NOW so the change lands immediately
bash "$DEPLOY" || echo "first deploy had an issue"
echo "AUTODEPLOY_INSTALLED"
systemctl list-timers 'llm-autodeploy.timer' --no-pager 2>/dev/null | head -3