#!/usr/bin/env bash
set -euo pipefail

measurement_id="${1:-G-KQMLYS3VVE}"
root="${2:-.}"
missing=0

while IFS= read -r file; do
  if ! rg -qF "$measurement_id" "$file"; then
    printf 'Missing Google Analytics measurement ID in %s\n' "$file" >&2
    missing=1
  fi
done < <(find "$root" -type f -name '*.html' | sort)

if [[ "$missing" -ne 0 ]]; then
  exit 1
fi

printf 'Google Analytics check passed for %s (%s)\n' "$root" "$measurement_id"
