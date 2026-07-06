#!/usr/bin/env bash
# infra-down.sh — per session. Tear the stack down. Pass --volumes to also wipe
# the Postgres data (forces a fresh migrate + re-seed next up).
set -euo pipefail
cd "$(dirname "$0")/.."

SANDBOX_DIR="$(pwd)"
PAYMENTS_DIR="$(cd .. && pwd)/payments"
PROJECT="fpay-sbx-s2"
OVERRIDE="$SANDBOX_DIR/stack/infra/docker-compose.heal.yml"
export HEAL_FIXTURES_DIR="$SANDBOX_DIR/stack/infra/dummypay-fixtures"

WIPE=""
[ "${1:-}" = "--volumes" ] && WIPE="-v"

echo "[infra-down] stopping stack ${WIPE:+(+volumes)} ..."
docker compose -p "$PROJECT" -f "$PAYMENTS_DIR/docker-compose.yml" -f "$OVERRIDE" \
  down --remove-orphans $WIPE
echo "[infra-down] done."
