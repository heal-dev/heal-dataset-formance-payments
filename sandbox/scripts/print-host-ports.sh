#!/usr/bin/env bash
# print-host-ports.sh — print every host port this sandbox publishes, one per
# line, as "<host-port>\t<label>" (TAB-separated, no header). Consumed by the
# cross-repo port-collision check; reserved block 15200–15999 (see
# heal-datasets-shared/PORTS.md). Uses the same compose file set + project as
# infra-up.sh so the output reflects exactly what `infra-up.sh` would publish.
set -euo pipefail
cd "$(dirname "$0")/.."

SANDBOX_DIR="$(pwd)"
PAYMENTS_DIR="$(cd .. && pwd)/payments"
PROJECT="fpay-sbx-s2"
OVERRIDE="$SANDBOX_DIR/stack/infra/docker-compose.heal.yml"
# The override requires HEAL_FIXTURES_DIR (fixture mount) even just to render config.
export HEAL_FIXTURES_DIR="$SANDBOX_DIR/stack/infra/dummypay-fixtures"

if [ ! -f "$PAYMENTS_DIR/docker-compose.yml" ]; then
  echo "print-host-ports: $PAYMENTS_DIR/docker-compose.yml not found (submodule not pulled?)" >&2
  exit 2
fi

docker compose -p "$PROJECT" \
  -f "$PAYMENTS_DIR/docker-compose.yml" -f "$OVERRIDE" \
  config --format json 2>/dev/null \
  | jq -r '.services | to_entries[] | .key as $svc | .value.ports[]? | select(.published) | "\(.published)\tformance-payments:\($svc)"'
