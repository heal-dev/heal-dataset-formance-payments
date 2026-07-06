#!/usr/bin/env bash
# infra-up.sh — per session. Bring the payments stack up DETACHED + bounded,
# poll real readiness, then apply the golden seed. Never foregrounds anything.
#
# The compose file lives in payments/. We run it under an isolated project name
# so the sandbox doesn't collide with a dev stack.
set -euo pipefail
cd "$(dirname "$0")/.."

SANDBOX_DIR="$(pwd)"
PAYMENTS_DIR="$(cd .. && pwd)/payments"
PROJECT="fpay-sbx-s2"

# Base compose (in payments/) + the Heal override (in sandbox/stack/infra/): the
# override runs server+worker with `-tags it` (real dummypay) and mounts the
# dummypay fixtures. Each -f file resolves ITS OWN relative paths against ITS dir.
OVERRIDE="$SANDBOX_DIR/stack/infra/docker-compose.heal.yml"
# Absolute fixtures dir — override relative paths resolve against payments/, not here.
export HEAL_FIXTURES_DIR="$SANDBOX_DIR/stack/infra/dummypay-fixtures"
dc() { docker compose -p "$PROJECT" -f "$PAYMENTS_DIR/docker-compose.yml" -f "$OVERRIDE" "$@"; }

# Load sandbox .env if present (STACK_PUBLIC_URL etc.).
[ -f "$SANDBOX_DIR/.env" ] && set -a && . "$SANDBOX_DIR/.env" && set +a
# NB: host ports below (15xxx) must stay in sync with sandbox/config.ts
# (remapped by the compose override into the reserved 15200–15999 block).
export STACK_PUBLIC_URL="${STACK_PUBLIC_URL:-http://localhost:15280}"

echo "[infra-up] bringing stack up (detached) ..."
# NOTE: we do NOT use `--wait` here. The payments + payments-worker services run
# `go run ./` in a golang-alpine container; first boot downloads the full module
# tree and compiles (several minutes, cold). And the worker's compose healthcheck
# (curl :8080/_healthcheck) does not reflect its real readiness, so `--wait` would
# abort the boot. We gate on the real signals ourselves below instead.
dc up -d

# --- real readiness gate: the payments API actually serving (cold-build budget) ---
echo "[infra-up] waiting for payments API healthcheck (cold Go build can take minutes) ..."
for i in $(seq 1 180); do
  if curl -fsS -m 5 "http://localhost:15280/_healthcheck" >/dev/null 2>&1; then
    echo "[infra-up] payments API healthy (after ~$((i*5))s)."; break
  fi
  [ "$i" -eq 180 ] && { echo "[infra-up] payments API never became healthy"; \
    dc logs payments --tail 20; exit 1; }
  sleep 5
done

# --- apply the golden seed AFTER migrations (payments-migrate runs separately) ---
# We wait for the payments table to exist, then load the idempotent seed.
echo "[infra-up] waiting for schema + applying golden seed ..."
SEED_SQL="$SANDBOX_DIR/stack/infra/init/01-golden-seed.sql"
for i in $(seq 1 60); do
  if dc exec -T postgres \
       psql -U payments -d payments -p "${POSTGRES_PORT:-5432}" -tAc \
       "select to_regclass('public.payments') is not null" 2>/dev/null | grep -q t; then
    dc exec -T postgres \
       psql -U payments -d payments -p "${POSTGRES_PORT:-5432}" -v ON_ERROR_STOP=1 \
       < "$SEED_SQL"
    echo "[infra-up] golden seed applied."
    break
  fi
  [ "$i" -eq 60 ] && { echo "[infra-up] payments schema never appeared"; exit 1; }
  sleep 2
done

echo "[infra-up] ready. Console: http://localhost:15200  Gateway: http://localhost:15292"
