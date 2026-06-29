# Formance Payments — Heal sandbox (Stage 0 skeleton)

**Journey (first goal / skeleton):** open the Console → the stack serves one seeded Payment.
**Eventual target:** richer payment journeys (install connector → poll → see payments; create
bank account; transfers/payouts) layered on this spine in later stages.

**Target:** local-first (`docker compose up`). **Auth:** none — the local Caddy gateway proxies
`/api/payments` via `handle_path_route_without_auth` (no JWT); no identity provider in compose.

---

## 1 · Topology (Console → Payment)

```mermaid
graph LR
    browser["Browser (Playwright)<br/>context · real"]
    console["Console v3 :3000<br/>context · real"]
    gateway["Gateway / Caddy :8092<br/>context · real"]
    payments["⭐ Payments API :8080<br/>SUT · real"]
    worker["Payments Worker<br/>context · real"]
    postgres[("Postgres :5432<br/>context · real+seed")]
    temporal["Temporal :7233<br/>context · real"]
    psp["PSP Connectors (dummypay)<br/>out-of-scope · off"]

    browser -->|HTTP :3000| console
    console -->|API /api| gateway
    gateway -->|proxy → :8080| payments
    payments -->|SQL r/w| postgres
    payments -->|start workflows| temporal
    worker -->|poll tasks| temporal
    worker -->|SQL r/w| postgres
    worker -.->|poll/ingest (substituted off)| psp
```

## 2 · Boundary

```
Legend — boundary tags
 🟢 SUT                run real; behavior is asserted
 🔵 supporting-context real/seeded so the SUT works; not itself asserted
 ⚪ out-of-scope        mocked, stubbed, or disabled; outside the boundary
```

| Node | Tag | Strategy | How |
|---|---|---|---|
| Payments API (:8080) | 🟢 SUT | real | `go run ./ server` (compose) |
| Console v3 (:3000) | 🔵 context | real | `ghcr.io/formancehq/console-v3:v2.6.2` |
| Gateway / Caddy (:8092) | 🔵 context | real | `ghcr.io/formancehq/gateway:latest` |
| Payments Worker | 🔵 context | real | `go run ./ worker` (compose) |
| Postgres (:5432) | 🔵 context | real+seed | `postgres:14-alpine`, golden seed |
| Temporal (:7233) | 🔵 context | real | `temporalio/auto-setup:1.29.1` |
| PSP Connectors (dummypay) | ⚪ out-of-scope | off | no connector installed; payment direct-seeded |

**Out-of-scope crossing — `psp-connector` (dummypay):** has a wire in general, but the skeleton
crosses no PSP traffic. Rung = **off** (verified): no connector is installed, the worker polls
nothing, and the payment ingestion would normally produce is instead direct-db-seeded. If a later
stage adds a polling/ingestion journey, re-classify off→behavioral (dummypay plugin or spec-mock).

## 3 · Data topology (golden read-only core)

Reset: **truncate-per-file**. All three entities are 🔵 supporting-context (the journey *reads*
them; Stage 0 does not assert the prod ingest path) → **direct-db-seed**, fixed FK-correct IDs.

| Entity | Lives in (node · table · schema) | Tag | How it's created (§G) | Derived from | Stage |
|---|---|---|---|---|---|
| connector | postgres · `connectors` · public | 🔵 | direct-db-seed | goldenSeed | 0 |
| payment | postgres · `payments` · public | 🔵 | direct-db-seed | goldenSeed (FK→connector) | 0 |
| payment_adjustment | postgres · `payment_adjustments` · public | 🔵 | direct-db-seed | goldenSeed (FK→payment) | 0 |

IDs are the app's own `base64url(canonicaljson(...))` encodings (ConnectorID / PaymentID /
PaymentAdjustmentID). Computed once from the canonical-JSON rules; verified against the live API,
which round-trips them exactly. **Do not hand-edit the base64 blobs** — regenerate via
`internal/models` if a field changes. Source of truth: `stack/infra/init/01-golden-seed.sql`,
symbols in `config.ts → SEED`.

Seeded payment: `reference=HEAL-SEED-PAYMENT-0001`, `type=PAY-IN`, `status=SUCCEEDED`,
`scheme=CARD_VISA`, `asset=USD/2`, `amount=10000` (minor units).

## 4 · Run map

| Process | Tier | Started by | Command / how | Port | Ready gate | Stage |
|---|---|---|---|---|---|---|
| postgres | A | infra-up.sh → docker compose | compose svc `postgres` | 5432 | compose healthcheck (`pg_isready`) | 0 |
| temporal | A | infra-up.sh → docker compose | compose svc `temporal` | 7233 | compose dep | 0 |
| payments-migrate | A | infra-up.sh → docker compose | `go run ./ migrate up` (one-shot) | — | exits 0 | 0 |
| payments (API) | A | infra-up.sh → docker compose | `go run ./ server` | 8080 | `GET /_healthcheck` (infra-up polls) | 0 |
| payments-worker | A | infra-up.sh → docker compose | `go run ./ worker` | 9090 | runs (compose healthcheck unreliable, not gated) | 0 |
| gateway | A | infra-up.sh → docker compose | `ghcr.io/.../gateway` | 8092 | compose healthcheck | 0 |
| console | A | infra-up.sh → docker compose | `ghcr.io/.../console-v3` | 3000 | compose healthcheck | 0 |
| golden seed | A | infra-up.sh (post-migrate) | `psql < stack/infra/init/01-golden-seed.sql` | — | rows present | 0 |
| skeleton spec | C | `npx playwright test` | `e2e/specs/skeleton.spec.ts` | — | globalSetup health gate | 0 |

> All app processes run inside compose, so there is **no Playwright `webServer`** (Tier B
> collapses); readiness is gated in `e2e/global-setup.ts` (payments API + gateway + console) and in
> `infra-up.sh`.

## Boot contract (host-run apps)

The apps run in **compose**, not on the host, so there is no host start-script env file to honour.
Notes that bit during the build:
- **Cold first boot is slow.** payments + worker run `go run ./` in `golang:1.26-alpine`, mounting
  source — first boot downloads the full module tree and compiles (minutes). `infra-up.sh` budgets
  for this and does **not** use `docker compose up --wait` (which would abort on the worker).
- **Worker healthcheck is unreliable.** `payments-worker`'s compose healthcheck (`curl
  :8080/_healthcheck`) does not reflect its real readiness; we don't gate on it.
- **Migrations run as a separate one-shot** (`payments-migrate`), before the API/worker. The golden
  seed is applied **after** migrations complete (the schema must exist first).
- **Schema drift vs the v1 migration:** the live `connectors` table has a NOT-NULL `reference uuid`
  (added by a later migration) and `payments.scheme` must be a valid `PaymentScheme` string
  (`CARD_VISA`, not `card`) — both enforced by the app on read. The seed reflects the live schema.
- `CONFIG_ENCRYPTION_KEY=mysuperencryptionkey`, `PLUGIN_MAGIC_COOKIE=mysupercookie` are baked into
  the compose file (non-secret local values).
