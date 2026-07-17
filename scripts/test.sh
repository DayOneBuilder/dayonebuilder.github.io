#!/usr/bin/env bash
# Site regression checks. Run before pushing to main (CI runs the same).
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "▶ inline JS syntax check (all HTML pages)"
node scripts/check-inline-js.mjs .

echo
echo "▶ home task-picker widget renders (headless Chrome)"
node scripts/check-home-widget.mjs .

echo
echo "✓ all site checks passed"
