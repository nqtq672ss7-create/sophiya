#!/bin/bash
set -e
export PATH="/Users/vladsaut/.gemini/antigravity/bin:/Users/vladsaut/.local/bin/bin:/Users/vladsaut/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "📦 1. Building production bundle..."
pnpm build

echo "📑 1.1 Generating SPA routing fallbacks for /admin and /crm..."
mkdir -p "$ROOT_DIR/dist/admin" && cp "$ROOT_DIR/dist/index.html" "$ROOT_DIR/dist/admin/index.html"
mkdir -p "$ROOT_DIR/dist/crm" && cp "$ROOT_DIR/dist/index.html" "$ROOT_DIR/dist/crm/index.html"

echo "🌿 2. Syncing dist build to gh-pages branch..."
git worktree remove --force /tmp/sophiya-gh-pages 2>/dev/null || true
git worktree prune 2>/dev/null || true
rm -rf /tmp/sophiya-gh-pages
git worktree add -B gh-pages /tmp/sophiya-gh-pages
rsync -a --delete --exclude '.git' "$ROOT_DIR/dist/" /tmp/sophiya-gh-pages/
git -C /tmp/sophiya-gh-pages add -A
TREE=$(git -C /tmp/sophiya-gh-pages write-tree)
COMMIT=$(git -C /tmp/sophiya-gh-pages commit-tree "$TREE" -m "deploy: update GitHub Pages build $(date +'%Y-%m-%d %H:%M:%S')")
git -C /tmp/sophiya-gh-pages update-ref refs/heads/gh-pages "$COMMIT"
git -C /tmp/sophiya-gh-pages push origin gh-pages --force
git worktree remove --force /tmp/sophiya-gh-pages 2>/dev/null || true
git worktree prune 2>/dev/null || true

echo "🚀 Successfully deployed to GitHub Pages (цветы-софия.рф)!"
