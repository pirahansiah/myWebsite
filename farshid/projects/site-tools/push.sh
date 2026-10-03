#!/bin/bash
# push.sh — publish pirahansiah.com.
#
# The site is a markdown-first SPA: every page is ONE markdown file under
# farshid/ and GitHub Pages serves the tree raw. There is no Jekyll build step,
# no notes/ submodule, and no second working copy — the site lives only in
# /Users/farshid/Library/CloudStorage/Dropbox/pirahansiah-com.
#
# If this clone is behind origin/main or has diverging commits, do not fight it:
# publish from a throwaway worktree instead —
#   git worktree add --detach /tmp/site-wt origin/main
#   # copy the changed files in, git add, commit, then:
#   git -C /tmp/site-wt push origin HEAD:main
set -e

REPO_ROOT="/Users/farshid/Library/CloudStorage/Dropbox/pirahansiah-com"
cd "$REPO_ROOT"

echo "=== [1/3] Staging site changes ==="
git add -A
if git diff --cached --quiet; then
  echo "  Nothing to commit"
else
  git -c user.name="Farshid PirahanSiah" -c user.email="farshid@Mac.fritz.box" \
    commit -m "update from push script"
  echo "  Committed"
fi

echo "=== [2/3] Pushing main ==="
git push origin main
echo "  Pushed"

echo "=== [3/3] Done ==="
echo "Site pushed. GitHub Pages serves it about a minute later."
