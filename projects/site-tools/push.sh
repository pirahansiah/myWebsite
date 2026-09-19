#!/bin/bash
set -e

REPO_ROOT="/Volumes/4tb/2026-6/pirahansiah.github.io"
SUBMODULE="$REPO_ROOT/notes"

echo "=== [1/6] Submodule: staging changes ==="
cd "$SUBMODULE"
git add -A
if git diff --cached --quiet; then
  echo "  Nothing to commit in submodule"
else
  git commit -m "auto: update submodule"
  echo "  Committed in submodule"
fi

echo "=== [2/6] Submodule: pushing ==="
git push
echo "  Submodule pushed"

echo "=== [3/6] Main repo: staging submodule pointer ==="
cd "$REPO_ROOT"
git add notes
if git diff --cached --quiet; then
  echo "  Submodule pointer already up to date"
else
  git commit -m "update reddit submodule"
  echo "  Submodule pointer committed"
fi

echo "=== [4/6] Main repo: staging all other changes ==="
git add -A
if git diff --cached --quiet; then
  echo "  Nothing else to commit"
else
  git commit -m "update from push script"
  echo "  Other changes committed"
fi

echo "=== [5/6] Main repo: pushing ==="
git push
echo "  Main repo pushed"

echo "=== [6/6] Done ==="
echo "Both repos pushed successfully."
