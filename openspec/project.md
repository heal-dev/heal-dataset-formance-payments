# formance-payments — Project Context

## Overview

payments

## Personas

- **Ops Engineer** — Operates the Formance Payments stack: installs connectors and verifies that data (accounts, balances) flows in from the PSP.

## Repos & sandbox

- App repos: `payments`
- Test sandbox: `sandbox/` (Playwright; suites under `sandbox/e2e/`)

## Capabilities

| Index | Capability | Purpose | Requirements | Edge scenarios |
|---|---|---|---:|---:|
| FPY-C01 | [`payment-initiation-create`](specs/payment-initiation-create/spec.md) |  | 9 | 8 |
| FPY-C02 | [`payment-initiation-reverse`](specs/payment-initiation-reverse/spec.md) |  | 6 | 5 |
| FPY-C03 | [`account-polling`](specs/account-polling/spec.md) |  | 6 | 5 |
| FPY-C04 | [`balance-polling`](specs/balance-polling/spec.md) |  | 5 | 4 |
| FPY-C05 | [`payment-polling`](specs/payment-polling/spec.md) |  | 6 | 5 |
| FPY-C06 | [`pool-management`](specs/pool-management/spec.md) |  | 8 | 7 |
| FPY-C07 | [`webhook-events`](specs/webhook-events/spec.md) |  | 5 | 4 |
| FPY-C08 | [`payment-service-user-connections`](specs/payment-service-user-connections/spec.md) |  | 9 | 8 |
| FPY-C09 | [`bank-account-forward`](specs/bank-account-forward/spec.md) |  | 6 | 5 |
| FPY-C10 | [`bank-account-create`](specs/bank-account-create/spec.md) |  | 8 | 7 |
| FPY-C11 | [`connector-uninstall`](specs/connector-uninstall/spec.md) |  | 4 | 3 |
| FPY-C12 | [`connector-install`](specs/connector-install/spec.md) |  | 7 | 6 |

## Journeys

4 cross-capability arcs — see [journeys.md](journeys.md).

_Generated from `sandbox/heal/state/spec.json` by `heal-datasets-shared/scripts/gen-openspec.ts`; hand-curated afterwards._
