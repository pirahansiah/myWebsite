#!/bin/bash

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🚀  Jekyll Local Development Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if bundle is installed
if ! command -v bundle &> /dev/null; then
    echo "❌ Bundle not found. Installing bundler..."
    gem install bundler
fi

echo "[SETUP] Installing gems..."
bundle install --quiet || bundle install

echo ""
echo "[NAV] Building menu from contents/menus.md..."
ruby scripts/build-nav.rb

echo ""
echo "[BUILD] Building Jekyll site..."
bundle exec jekyll build

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ✨  Server running at:"
echo ""
echo "   🌐  http://localhost:4000"
echo ""
echo "   Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

bundle exec jekyll serve --livereload --host 127.0.0.1 --port 4000 --incremental --watch