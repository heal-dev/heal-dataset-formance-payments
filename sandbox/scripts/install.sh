#!/usr/bin/env bash
# install.sh — run once. Install harness deps + Playwright browser, pull images,
# compile the connector plugins the payments stack needs.
set -euo pipefail
cd "$(dirname "$0")/.."

SANDBOX_DIR="$(pwd)"
PAYMENTS_DIR="$(cd .. && pwd)/payments"

echo "[install] harness deps (npm) ..."
npm install

echo "[install] Playwright chromium + deps ..."
npx playwright install --with-deps chromium

echo "[install] pulling compose images (best-effort) ..."
( cd "$PAYMENTS_DIR" && docker compose pull --ignore-pull-failures || true )

# The payments console talks to compiled connector plugins. `just compile-plugins`
# needs the nix dev shell; we don't require it for the skeleton (dummypay seed is
# direct-db), but note it here for stages that install a real connector.
echo "[install] NOTE: real-connector stages need 'just compile-plugins' in 'nix develop' (payments/)."

echo "[install] done."
