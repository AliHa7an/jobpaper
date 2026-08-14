#!/usr/bin/env bash
# Invariant 1: packages/engine has zero AI, zero network, zero dependencies.
# Fails the build if any forbidden pattern or import appears in the engine.
set -euo pipefail

ENGINE_DIR="$(cd "$(dirname "$0")/.." && pwd)/packages/engine"
FAIL=0

echo "Checking engine purity in $ENGINE_DIR"

# AI / LLM references
if grep -rniE '(openai|anthropic|claude|gemini|@ai-sdk|"ai"|llm|generateText|generateObject)' \
  "$ENGINE_DIR/src" --include='*.ts' --include='*.json'; then
  echo "FAIL: AI reference found in engine"
  FAIL=1
fi

# Network access
if grep -rnE '\b(fetch|axios|XMLHttpRequest|WebSocket|http\.request|https\.request)\b' \
  "$ENGINE_DIR/src" --include='*.ts'; then
  echo "FAIL: network call found in engine"
  FAIL=1
fi

# Imports from outside the engine (only relative imports allowed)
if grep -rnE "^\s*(import|export)[^\"']*from\s+[\"'][^./]" "$ENGINE_DIR/src" --include='*.ts'; then
  echo "FAIL: non-relative (external) import found in engine"
  FAIL=1
fi

# No package.json with dependencies inside the engine
if [ -f "$ENGINE_DIR/package.json" ]; then
  if grep -qE '"(dependencies|peerDependencies)"' "$ENGINE_DIR/package.json"; then
    echo "FAIL: engine package.json declares dependencies"
    FAIL=1
  fi
fi

if [ "$FAIL" -eq 0 ]; then
  echo "OK: engine is pure (no AI, no network, no external imports)"
fi
exit "$FAIL"
