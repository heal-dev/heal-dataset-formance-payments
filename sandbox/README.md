# Formance Payments — Heal E2E sandbox

A local test sandbox proving one journey end-to-end: **open the Console → the stack serves a
seeded Payment.** This is the Stage 0 walking skeleton — the thinnest green spec that boots the
real stack (Console + gateway + payments API + Postgres + Temporal) and reads a golden-seeded
payment through the full chain.

**Current stage:** `0-skeleton` — **green.** "Green" = the stack boots healthy, the golden seed
loads, and `e2e/specs/skeleton.spec.ts` passes (seeded payment served via gateway → payments API;
Console frontend serves).

## Prerequisites
- Docker (the whole app stack runs in compose)
- Node 20+ (the Playwright harness)
- No tokens/keys: the local stack has **no auth**.

## Run it
```bash
cp .env.example .env          # defaults are fine for the skeleton
npm run install:sandbox       # once: harness deps, chromium, pull images
npm test                      # infra up (cold build is slow) → wait healthy → seed → run specs
# re-run specs only (stack already up):
npm run test:only
# tear down:
npm run infra:down            # add --volumes to wipe Postgres (forces fresh migrate+seed)
```
First `npm test` is slow: payments + worker run `go run ./` in a golang container and compile on
first boot (several minutes). Subsequent runs are fast.

## Layout
- `config.ts` — single source of ports/URLs + the `SEED` catalog.
- `stack/infra/init/01-golden-seed.sql` — the golden read-only core (connector → payment → adjustment).
- `e2e/global-setup.ts` — health-gates payments API + gateway + console before specs run.
- `e2e/specs/skeleton.spec.ts` — the Stage 0 spec (the template later specs mirror).
- `e2e/data/{seed,fixtures}.ts` — seed symbols + the acquire/release isolation boundary.
- `scripts/{install,infra-up,infra-down}.sh` — lifecycle entry points.

**Every process and how it starts → [architecture.md §4 (Run map)](./architecture.md#4--run-map).**

## Notes
- No auth: the Caddy gateway proxies `/api/payments` without a JWT check (`MICRO_STACK=1`).
- The seeded payment IDs are the app's own `base64url(canonicaljson)` encodings — regenerate via
  `internal/models` if a field changes; don't hand-edit the base64 in the seed SQL.
