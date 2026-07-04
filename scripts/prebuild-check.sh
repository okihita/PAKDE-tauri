#!/bin/bash
# Pre-build check: verify assets CI requires before local build or commit
set -euo pipefail

ICONS_DIR="src-tauri/icons"
missing=0

check() {
  local file="$1"
  local platform="$2"
  if [ ! -f "$file" ]; then
    echo "  MISSING $file ($platform) — CI will fail on $platform build"
    missing=1
  fi
}

echo "=== Pre-build asset check ==="

# macOS
check "$ICONS_DIR/icon.icns" "macOS"
# Windows
check "$ICONS_DIR/icon.ico" "Windows"
# Base source (required for generating all others)
check "$ICONS_DIR/icon.png" "All (source)"

if [ "$missing" -eq 1 ]; then
  echo ""
  echo "Fix: pnpm tauri icon $ICONS_DIR/icon.png"
  exit 1
fi

echo "All platform assets present. Build should succeed in CI."
