# FPY-C06 — Pool Management

## Purpose

_(no summary specced)_

_Source: `payments/internal/api/v3/router.go:62-75`, `payments/internal/api/v3/handler_pools_create.go:24-75`_

## Requirements

### Requirement: FPY-C06-R01 — Create a pool grouping accounts and read its aggregate balances

The system SHALL let the Ops Engineer group several accounts into a pool.

_Source: `payments/internal/api/v3/handler_pools_create.go:24-75`, `payments/internal/api/v3/handler_pools_balances_latest.go:1-40`_ · _Reference test: `sandbox/e2e/flows/pool-management.spec.ts`_

#### Scenario: Create a pool grouping accounts and read its aggregate balances — happy path

- GIVEN the Ops Engineer on the app
- WHEN Install a connector and let its two internal accounts be polled
- AND POST /v3/pools {name, accountIDs:[acct-001, acct-002]} to create a static pool; receive {data:<poolID>}
- AND GET /v3/pools and see the new pool listed
- THEN GET /v3/pools/{poolID}/balances/latest and see the per-asset aggregate {data:[{asset, amount, relatedAccounts[]}]} — USD/2 1500000 and EUR/2 2750000

### Requirement: FPY-C06-R02 — Ops Engineer creates a static pool grouping two internal accounts (POST /v3/pools {name

When the Ops Engineer creates a static pool grouping two internal accounts (POST /v3/pools {name, accountIDs}), the system SHALL create it and return {data:<poolID>}, the pool SHALL appear in GET /v3/pools, and GET /v3/pools/{poolID}/balances/latest SHALL return the per-asset aggregate of the members. [CRAWL-CONFIRMED 2026-06-24: create → {data:<uuid>}; balances/latest → {data:[{asset:'EUR/2',amount:2750000,relatedAccounts[]},{asset:'USD/2',amount:1500000,...}]}.]

_Source: `payments/internal/api/v3/handler_pools_balances_latest.go:1-40`_ · _Reference test: `sandbox/e2e/flows/pool-management.spec.ts`_

#### Scenario: Ops Engineer creates a static pool grouping two internal accounts (POST /v3/pools {name

- GIVEN the Ops Engineer in the “Create a pool grouping accounts and read its aggregate balances” flow
- WHEN the Ops Engineer creates a static pool grouping two internal accounts (POST /v3/pools {name
- THEN accountIDs}), the system shall create it and return {data:<poolID>}, the pool shall appear in GET /v3/pools, and GET /v3/pools/{poolID}/balances/latest shall return the per-asset aggregate of the members. [CRAWL-CONFIRMED 2026-06-24: create → {data:<uuid>}; balances/latest → {data:[{asset:'EUR/2',amount:2750000,relatedAccounts[]},{asset:'USD/2',amount:1500000,...}]}.]

### Requirement: FPY-C06-R03 — A pool is created without a name (POST /v3/pools without name)

When a pool is created without a name (POST /v3/pools without name), the system SHALL reject it with 400 VALIDATION (name is required). [CRAWL-CONFIRMED 2026-06-24: → 400 {errorCode:VALIDATION, errorMessage:'Name is a required field'}.]

_Source: `payments/internal/api/v3/handler_pools_create.go:18-19`_ · _Reference test: `sandbox/e2e/scenarios/pool-management/PM-edges.spec.ts`_

#### Scenario: A pool is created without a name (POST /v3/pools without name)

- GIVEN the Ops Engineer in the “Create a pool grouping accounts and read its aggregate balances” flow
- WHEN a pool is created without a name (POST /v3/pools without name)
- THEN the system shall reject it with 400 VALIDATION (name is required). [CRAWL-CONFIRMED 2026-06-24: → 400 {errorCode:VALIDATION, errorMessage:'Name is a required field'}.]

### Requirement: FPY-C06-R04 — Ops Engineer deletes a pool (DELETE /v3/pools/{poolID})

When the Ops Engineer deletes a pool (DELETE /v3/pools/{poolID}), the system SHALL remove it (204) and it SHALL no longer appear in GET /v3/pools. [CRAWL-CONFIRMED 2026-06-24: DELETE → 204; pool absent from the list afterwards.]

_Source: `payments/internal/api/v3/router.go:69-69`, `payments/internal/api/v3/handler_pools_delete.go:1-40`_ · _Reference test: `sandbox/e2e/scenarios/pool-management/PM-edges.spec.ts`_

#### Scenario: Ops Engineer deletes a pool (DELETE /v3/pools/{poolID})

- GIVEN the Ops Engineer in the “Create a pool grouping accounts and read its aggregate balances” flow
- WHEN the Ops Engineer deletes a pool (DELETE /v3/pools/{poolID})
- THEN the system shall remove it (204) and it shall no longer appear in GET /v3/pools. [CRAWL-CONFIRMED 2026-06-24: DELETE → 204; pool absent from the list afterwards.]

### Requirement: FPY-C06-R05 — A static pool is created with a malformed accountID in accountIDs (fails the dive

When a static pool is created with a malformed accountID in accountIDs (fails the dive,accountID validator), the system SHALL reject it with 400 VALIDATION. [CRAWL-CONFIRMED 2026-06-24: POST /v3/pools {name, accountIDs:['not-a-valid-account-id']} → 400 {errorCode:VALIDATION, errorMessage:'AccountIDs[0] is invalid'}.]

_Source: `payments/internal/api/v3/handler_pools_create.go:21-21`_ · _Reference test: `sandbox/e2e/scenarios/pool-management/PM-edges-2.spec.ts`_

#### Scenario: A static pool is created with a malformed accountID in accountIDs (fails the dive

- GIVEN the Ops Engineer in the “Create a pool grouping accounts and read its aggregate balances” flow
- WHEN a static pool is created with a malformed accountID in accountIDs (fails the dive
- THEN accountID validator), the system shall reject it with 400 VALIDATION. [CRAWL-CONFIRMED 2026-06-24: POST /v3/pools {name, accountIDs:['not-a-valid-account-id']} → 400 {errorCode:VALIDATION, errorMessage:'AccountIDs[0] is invalid'}.]

### Requirement: FPY-C06-R06 — A pool is fetched by a well-formed but non-existent pool id (GET /v3/pools/{id})

When a pool is fetched by a well-formed but non-existent pool id (GET /v3/pools/{id}), the system SHALL reject it with 404 NOT_FOUND. [CRAWL-CONFIRMED 2026-06-24: GET /v3/pools/deadbeef-0000-4000-8000-000000000000 → 404 {errorCode:NOT_FOUND, errorMessage:'cannot get pool: not found'}.]

_Source: `payments/internal/api/v3/handler_pools_get.go:1-40`_ · _Reference test: `sandbox/e2e/scenarios/pool-management/PM-edges-2.spec.ts`_

#### Scenario: A pool is fetched by a well-formed but non-existent pool id (GET /v3/pools/{id})

- GIVEN the Ops Engineer in the “Create a pool grouping accounts and read its aggregate balances” flow
- WHEN a pool is fetched by a well-formed but non-existent pool id (GET /v3/pools/{id})
- THEN the system shall reject it with 404 NOT_FOUND. [CRAWL-CONFIRMED 2026-06-24: GET /v3/pools/deadbeef-0000-4000-8000-000000000000 → 404 {errorCode:NOT_FOUND, errorMessage:'cannot get pool: not found'}.]

### Requirement: FPY-C06-R07 — Latest balances are requested for a well-formed but non-existent pool id (GET /v3/pools/{id}/balances/latest)

When latest balances are requested for a well-formed but non-existent pool id (GET /v3/pools/{id}/balances/latest), the system SHALL reject it with 404 NOT_FOUND. [CRAWL-CONFIRMED 2026-06-24: GET /v3/pools/deadbeef-0000-4000-8000-000000000000/balances/latest → 404 {errorCode:NOT_FOUND, errorMessage:'cannot get pool: not found'}.]

_Source: `payments/internal/api/v3/handler_pools_balances_latest.go:1-40`_ · _Reference test: `sandbox/e2e/scenarios/pool-management/PM-edges-2.spec.ts`_

#### Scenario: Latest balances are requested for a well-formed but non-existent pool id (GET /v3/pools/{id}/balances/latest)

- GIVEN the Ops Engineer in the “Create a pool grouping accounts and read its aggregate balances” flow
- WHEN latest balances are requested for a well-formed but non-existent pool id (GET /v3/pools/{id}/balances/latest)
- THEN the system shall reject it with 404 NOT_FOUND. [CRAWL-CONFIRMED 2026-06-24: GET /v3/pools/deadbeef-0000-4000-8000-000000000000/balances/latest → 404 {errorCode:NOT_FOUND, errorMessage:'cannot get pool: not found'}.]

### Requirement: FPY-C06-R08 — A pool is fetched by a malformed (non-UUID) pool id

When a pool is fetched by a malformed (non-UUID) pool id, the system SHALL reject it with 400 INVALID_ID. [CRAWL-CONFIRMED 2026-06-24: GET /v3/pools/not-a-uuid → 400 {errorCode:INVALID_ID, errorMessage:'invalid UUID length: 10'}.]

_Source: `payments/internal/api/v3/handler_pools_get.go:15-25`_ · _Reference test: `sandbox/e2e/scenarios/pool-management/PM-edges-2.spec.ts`_

#### Scenario: A pool is fetched by a malformed (non-UUID) pool id

- GIVEN the Ops Engineer in the “Create a pool grouping accounts and read its aggregate balances” flow
- WHEN a pool is fetched by a malformed (non-UUID) pool id
- THEN the system shall reject it with 400 INVALID_ID. [CRAWL-CONFIRMED 2026-06-24: GET /v3/pools/not-a-uuid → 400 {errorCode:INVALID_ID, errorMessage:'invalid UUID length: 10'}.]
