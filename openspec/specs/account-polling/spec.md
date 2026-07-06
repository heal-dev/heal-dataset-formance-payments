# FPY-C03 — Account Polling

## Purpose

_(no summary specced)_

_Source: `payments/internal/api/v3/router.go:28-29`, `payments/internal/api/v3/handler_accounts_list.go:14-40`, `payments/QA_PLAYBOOK.MD:29-29`_

## Requirements

### Requirement: FPY-C03-R01 — Worker polls the connector's accounts on install

The system SHALL let the Ops Engineer install a connector.

_Source: `payments/QA_PLAYBOOK.MD:29-29`, `payments/internal/api/v3/handler_accounts_list.go:14-40`_ · _Reference test: `sandbox/e2e/flows/account-polling.spec.ts`_

#### Scenario: Worker polls the connector's accounts on install — happy path

- GIVEN the Ops Engineer on the app
- WHEN Install a dummypay connector (POST /v3/connectors/install/dummypay) pointing at the mounted fixtures
- AND The worker polls on install and fetches the connector's internal accounts from the PSP fixtures
- THEN GET /v3/accounts and see the two internal accounts (heal-dummy-acct-001 USD/2, heal-dummy-acct-002 EUR/2) listed with type INTERNAL for that connector

### Requirement: FPY-C03-R02 — Ops Engineer installs a connector

When the Ops Engineer installs a connector, the worker SHALL fetch the connector's internal accounts on install and they SHALL appear in GET /v3/accounts with type INTERNAL — for dummypay, heal-dummy-acct-001 (USD/2) and heal-dummy-acct-002 (EUR/2). [CONFIRMED across the onboard-connector-basic / execute-internal-transfer / pool-balance-snapshot journeys: both internal accounts surface for the connector within ~1-2s of install.]

_Source: `payments/QA_PLAYBOOK.MD:29-29`_ · _Reference test: `sandbox/e2e/flows/account-polling.spec.ts`_

#### Scenario: Ops Engineer installs a connector

- GIVEN the Ops Engineer in the “Worker polls the connector's accounts on install” flow
- WHEN the Ops Engineer installs a connector
- THEN the worker shall fetch the connector's internal accounts on install and they shall appear in GET /v3/accounts with type INTERNAL — for dummypay, heal-dummy-acct-001 (USD/2) and heal-dummy-acct-002 (EUR/2). [CONFIRMED across the onboard-connector-basic / execute-internal-transfer / pool-balance-snapshot journeys: both internal accounts surface for the connector within ~1-2s of install.]

### Requirement: FPY-C03-R03 — A bank account is created and forwarded to the connector

When a bank account is created and forwarded to the connector, the worker SHALL fetch it as an EXTERNAL account so it appears in GET /v3/accounts with type EXTERNAL for that connector. [CRAWL-CONFIRMED 2026-06-24: EXTERNAL accounts surface for the connector with reference 'dummypay-<bankAccountUUID>' and type EXTERNAL. Account row fields: id, connectorID, connector{id,reference,name,createdAt,provider}, provider, reference, createdAt, type (INTERNAL|EXTERNAL), name, defaultAsset, metadata, raw.]

_Source: `payments/QA_PLAYBOOK.MD:32-32`_ · _Reference test: `sandbox/e2e/scenarios/account-polling/AP-S2-external-account.spec.ts`_

#### Scenario: A bank account is created and forwarded to the connector

- GIVEN the Ops Engineer in the “Worker polls the connector's accounts on install” flow
- WHEN a bank account is created and forwarded to the connector
- THEN the worker shall fetch it as an EXTERNAL account so it appears in GET /v3/accounts with type EXTERNAL for that connector. [CRAWL-CONFIRMED 2026-06-24: EXTERNAL accounts surface for the connector with reference 'dummypay-<bankAccountUUID>' and type EXTERNAL. Account row fields: id, connectorID, connector{id,reference,name,createdAt,provider}, provider, reference, createdAt, type (INTERNAL|EXTERNAL), name, defaultAsset, metadata, raw.]

### Requirement: FPY-C03-R04 — Ap s3

Account polling is stateful — repeated polling does not refetch and duplicate already-known accounts; the accounts list shows each account once per connector. [Per QA_PLAYBOOK 'Polling is stateful so we don't fetch all accounts at every polling'. Hard to observe deterministically in a short test window — kept as a spec note, not authored as a Tier-2 test.]

_Source: `payments/QA_PLAYBOOK.MD:29-29`_

#### Scenario: Ap s3

- GIVEN the Ops Engineer in the “Worker polls the connector's accounts on install” flow
- THEN Account polling is stateful — repeated polling does not refetch and duplicate already-known accounts; the accounts list shows each account once per connector. [Per QA_PLAYBOOK 'Polling is stateful so we don't fetch all accounts at every polling'. Hard to observe deterministically in a short test window — kept as a spec note, not authored as a Tier-2 test.]

### Requirement: FPY-C03-R05 — An account is fetched by a malformed account id (GET /v3/accounts/{bad-id})

When an account is fetched by a malformed account id (GET /v3/accounts/{bad-id}), the system SHALL reject it with 400 INVALID_ID. [CRAWL-CONFIRMED 2026-06-24: GET /v3/accounts/not-a-valid-account-id → 400 {errorCode:INVALID_ID}.]

_Source: `payments/internal/api/v3/handler_accounts_get.go:18-23`_ · _Reference test: `sandbox/e2e/scenarios/account-polling/AP-account-get-guards.spec.ts`_

#### Scenario: An account is fetched by a malformed account id (GET /v3/accounts/{bad-id})

- GIVEN the Ops Engineer in the “Worker polls the connector's accounts on install” flow
- WHEN an account is fetched by a malformed account id (GET /v3/accounts/{bad-id})
- THEN the system shall reject it with 400 INVALID_ID. [CRAWL-CONFIRMED 2026-06-24: GET /v3/accounts/not-a-valid-account-id → 400 {errorCode:INVALID_ID}.]

### Requirement: FPY-C03-R06 — An account is fetched by a well-formed but non-existent account id

When an account is fetched by a well-formed but non-existent account id, the system SHALL reject it with 404 NOT_FOUND. [CRAWL-CONFIRMED 2026-06-24: GET /v3/accounts/<well-formed non-existent id> → 404 {errorCode:NOT_FOUND, errorMessage:'cannot get account: not found'}.]

_Source: `payments/internal/api/v3/handler_accounts_get.go:25-30`_ · _Reference test: `sandbox/e2e/scenarios/account-polling/AP-account-get-guards.spec.ts`_

#### Scenario: An account is fetched by a well-formed but non-existent account id

- GIVEN the Ops Engineer in the “Worker polls the connector's accounts on install” flow
- WHEN an account is fetched by a well-formed but non-existent account id
- THEN the system shall reject it with 404 NOT_FOUND. [CRAWL-CONFIRMED 2026-06-24: GET /v3/accounts/<well-formed non-existent id> → 404 {errorCode:NOT_FOUND, errorMessage:'cannot get account: not found'}.]
