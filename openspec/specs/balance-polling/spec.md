# FPY-C04 — Balance Polling

## Purpose

_(no summary specced)_

_Source: `payments/internal/api/v3/router.go:34-34`, `payments/internal/api/v3/handler_accounts_balances.go:18-50`, `payments/QA_PLAYBOOK.MD:30-30`_

## Requirements

### Requirement: FPY-C04-R01 — Worker polls the connector's account balances

The system SHALL let the Ops Engineer install a connector.

_Source: `payments/QA_PLAYBOOK.MD:30-30`, `payments/internal/api/v3/handler_accounts_balances.go:18-50`_ · _Reference test: `sandbox/e2e/flows/balance-polling.spec.ts`_

#### Scenario: Worker polls the connector's account balances — happy path

- GIVEN the Ops Engineer on the app
- WHEN Install a dummypay connector and let the worker poll its internal accounts
- AND The worker fetches each internal account's balance from the PSP fixtures
- THEN GET /v3/accounts/{accountID}/balances for a polled account and see its balance with the seeded asset and amount (acct-001 → USD/2 1500000; acct-002 → EUR/2 2750000)

### Requirement: FPY-C04-R02 — A connector is installed and its internal accounts are polled

When a connector is installed and its internal accounts are polled, the worker SHALL fetch each internal account's balance so GET /v3/accounts/{accountID}/balances returns the seeded balance — for dummypay, heal-dummy-acct-001 → asset USD/2 amount 1500000 (minor) and heal-dummy-acct-002 → asset EUR/2 amount 2750000 (minor). [CONFIRMED across onboard-connector-basic + pool-balance-snapshot journeys + live probe 2026-06-24: balance row {accountID, asset, balance, createdAt, lastUpdatedAt, psuID}; acct-001 balance=1500000 asset=USD/2.]

_Source: `payments/QA_PLAYBOOK.MD:30-30`_ · _Reference test: `sandbox/e2e/flows/balance-polling.spec.ts`_

#### Scenario: A connector is installed and its internal accounts are polled

- GIVEN the Ops Engineer in the “Worker polls the connector's account balances” flow
- WHEN a connector is installed and its internal accounts are polled
- THEN the worker shall fetch each internal account's balance so GET /v3/accounts/{accountID}/balances returns the seeded balance — for dummypay, heal-dummy-acct-001 → asset USD/2 amount 1500000 (minor) and heal-dummy-acct-002 → asset EUR/2 amount 2750000 (minor). [CONFIRMED across onboard-connector-basic + pool-balance-snapshot journeys + live probe 2026-06-24: balance row {accountID, asset, balance, createdAt, lastUpdatedAt, psuID}; acct-001 balance=1500000 asset=USD/2.]

### Requirement: FPY-C04-R03 — Balances are requested for a malformed account id (GET /v3/accounts/{bad-id}/balances)

When balances are requested for a malformed account id (GET /v3/accounts/{bad-id}/balances), the system SHALL reject it with 400 and not return balances. [CRAWL-CONFIRMED 2026-06-24: GET /v3/accounts/not-a-valid-id/balances → 400 {errorCode:VALIDATION, errorMessage:'invalid character ... looking for beginning of value' (base64-decode failure of the account id)}.]

_Source: `payments/internal/api/v3/handler_accounts_balances.go:18-50`_ · _Reference test: `sandbox/e2e/scenarios/balance-polling/BP-S2-invalid-id.spec.ts`_

#### Scenario: Balances are requested for a malformed account id (GET /v3/accounts/{bad-id}/balances)

- GIVEN the Ops Engineer in the “Worker polls the connector's account balances” flow
- WHEN balances are requested for a malformed account id (GET /v3/accounts/{bad-id}/balances)
- THEN the system shall reject it with 400 and not return balances. [CRAWL-CONFIRMED 2026-06-24: GET /v3/accounts/not-a-valid-id/balances → 400 {errorCode:VALIDATION, errorMessage:'invalid character ... looking for beginning of value' (base64-decode failure of the account id)}.]

### Requirement: FPY-C04-R04 — Balances are requested for a well-formed but non-existent account id

When balances are requested for a well-formed but non-existent account id, the system SHALL return 200 with an empty balances cursor (the endpoint is a list, not a single-resource get, so an unknown account yields no rows rather than a 404). [CRAWL-CONFIRMED 2026-06-24: GET /v3/accounts/<well-formed non-existent id>/balances → 200 {cursor:{pageSize:15, hasMore:false, data:[]}}.]

_Source: `payments/internal/api/v3/handler_accounts_balances.go:42-50`_ · _Reference test: `sandbox/e2e/scenarios/balance-polling/BP-balance-guards.spec.ts`_

#### Scenario: Balances are requested for a well-formed but non-existent account id

- GIVEN the Ops Engineer in the “Worker polls the connector's account balances” flow
- WHEN balances are requested for a well-formed but non-existent account id
- THEN the system shall return 200 with an empty balances cursor (the endpoint is a list, not a single-resource get, so an unknown account yields no rows rather than a 404). [CRAWL-CONFIRMED 2026-06-24: GET /v3/accounts/<well-formed non-existent id>/balances → 200 {cursor:{pageSize:15, hasMore:false, data:[]}}.]

### Requirement: FPY-C04-R05 — Balances are requested with an invalid pageSize query param

When balances are requested with an invalid pageSize query param, the system SHALL reject it with 400 VALIDATION. [CRAWL-CONFIRMED 2026-06-24: GET /v3/accounts/{id}/balances?pageSize=notanumber → 400 {errorCode:VALIDATION, errorMessage:"invalid 'pageSize' query param"}.]

_Source: `payments/internal/api/v3/handler_accounts_balances.go:29-40`_ · _Reference test: `sandbox/e2e/scenarios/balance-polling/BP-balance-guards.spec.ts`_

#### Scenario: Balances are requested with an invalid pageSize query param

- GIVEN the Ops Engineer in the “Worker polls the connector's account balances” flow
- WHEN balances are requested with an invalid pageSize query param
- THEN the system shall reject it with 400 VALIDATION. [CRAWL-CONFIRMED 2026-06-24: GET /v3/accounts/{id}/balances?pageSize=notanumber → 400 {errorCode:VALIDATION, errorMessage:"invalid 'pageSize' query param"}.]
