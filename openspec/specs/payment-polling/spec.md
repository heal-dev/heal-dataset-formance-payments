# Payment Polling

## Purpose

_(no summary specced)_

_Source: `payments/internal/api/v3/router.go:51-53`, `payments/internal/api/v3/handler_payments_list.go:14-40`, `payments/QA_PLAYBOOK.MD:31-31`_

## Requirements

### Requirement: Worker polls the connector's payments

The system SHALL let the Ops Engineer install a connector.

_Source: `payments/QA_PLAYBOOK.MD:31-31`, `payments/internal/api/v3/handler_payments_list.go:14-40`_

#### Scenario: Worker polls the connector's payments — happy path

- GIVEN the Ops Engineer on the app
- WHEN Install a connector whose PSP has payments to fetch
- AND The worker runs the fetch_payments task on install and ingests the PSP's payments
- THEN GET /v3/payments and see each fetched payment as a row with fields id, connectorID, provider, reference, createdAt, type, status, scheme, asset, amount, initialAmount, sourceAccountID, destinationAccountID, adjustments, metadata

### Requirement: A connector whose PSP has payments is installed

When a connector whose PSP has payments is installed, the worker SHALL fetch those payments on install (fetch_payments task) so they appear in GET /v3/payments. [SETUP-GAP SG02: the sandbox's only connector is dummypay, whose plugin facade FetchNextPayments (plugin.go:70) hard-codes an empty payments list and never calls client.FetchPayments (which would read payments.json). So with dummypay the worker ingests NO payments and this happy path cannot be demonstrated additively. The only payment in the system, HEAL-SEED-PAYMENT-0001, is direct-DB-seeded (golden core), not polled. Resolving this needs a higher-fidelity PSP substitution that actually emits payments — a human fidelity-rung decision. Left unverified pending that.]

_Source: `payments/internal/connectors/plugins/public/dummypay/plugin.go:70-76`, `payments/internal/connectors/plugins/public/dummypay/client/payments.go:22-22`_

#### Scenario: A connector whose PSP has payments is installed

- GIVEN the Ops Engineer in the “Worker polls the connector's payments” flow
- WHEN a connector whose PSP has payments is installed
- THEN the worker shall fetch those payments on install (fetch_payments task) so they appear in GET /v3/payments. [SETUP-GAP SG02: the sandbox's only connector is dummypay, whose plugin facade FetchNextPayments (plugin.go:70) hard-codes an empty payments list and never calls client.FetchPayments (which would read payments.json). So with dummypay the worker ingests NO payments and this happy path cannot be demonstrated additively. The only payment in the system, HEAL-SEED-PAYMENT-0001, is direct-DB-seeded (golden core), not polled. Resolving this needs a higher-fidelity PSP substitution that actually emits payments — a human fidelity-rung decision. Left unverified pending that.]

### Requirement: Pp s2

The payments list is queryable: GET /v3/payments returns recorded payments as rows with fields id, connectorID, provider, reference, createdAt, type, status, scheme, asset, amount, initialAmount, sourceAccountID, destinationAccountID, adjustments, metadata. [CRAWL-CONFIRMED 2026-06-24: GET /v3/payments → 200; the seeded HEAL-SEED-PAYMENT-0001 row present with type PAY-IN, status SUCCEEDED, asset USD/2. This proves the list/query surface independent of polling ingestion (which is blocked by SG02).]

_Source: `payments/internal/api/v3/handler_payments_list.go:14-40`_ · _Reference test: `sandbox/e2e/scenarios/payment-polling/PP-S2-payments-list.spec.ts`_

#### Scenario: Pp s2

- GIVEN the Ops Engineer in the “Worker polls the connector's payments” flow
- THEN the payments list is queryable: GET /v3/payments returns recorded payments as rows with fields id, connectorID, provider, reference, createdAt, type, status, scheme, asset, amount, initialAmount, sourceAccountID, destinationAccountID, adjustments, metadata. [CRAWL-CONFIRMED 2026-06-24: GET /v3/payments → 200; the seeded HEAL-SEED-PAYMENT-0001 row present with type PAY-IN, status SUCCEEDED, asset USD/2. This proves the list/query surface independent of polling ingestion (which is blocked by SG02).]

### Requirement: A payment is fetched by a malformed payment id (GET /v3/payments/{bad-id})

When a payment is fetched by a malformed payment id (GET /v3/payments/{bad-id}), the system SHALL reject it with 400 INVALID_ID. [CRAWL-CONFIRMED 2026-06-24: GET /v3/payments/not-a-valid-payment-id → 400 {errorCode:INVALID_ID}.]

_Source: `payments/internal/api/v3/handler_payments_get.go:18-22`_ · _Reference test: `sandbox/e2e/scenarios/payment-polling/PP-payment-guards.spec.ts`_

#### Scenario: A payment is fetched by a malformed payment id (GET /v3/payments/{bad-id})

- GIVEN the Ops Engineer in the “Worker polls the connector's payments” flow
- WHEN a payment is fetched by a malformed payment id (GET /v3/payments/{bad-id})
- THEN the system shall reject it with 400 INVALID_ID. [CRAWL-CONFIRMED 2026-06-24: GET /v3/payments/not-a-valid-payment-id → 400 {errorCode:INVALID_ID}.]

### Requirement: A payment is fetched by a well-formed but non-existent payment id

When a payment is fetched by a well-formed but non-existent payment id, the system SHALL reject it with 404 NOT_FOUND. [CRAWL-CONFIRMED 2026-06-24: GET /v3/payments/<well-formed non-existent id> → 404 {errorCode:NOT_FOUND, errorMessage:'cannot get payment: not found'}.]

_Source: `payments/internal/api/v3/handler_payments_get.go:24-28`_ · _Reference test: `sandbox/e2e/scenarios/payment-polling/PP-payment-guards.spec.ts`_

#### Scenario: A payment is fetched by a well-formed but non-existent payment id

- GIVEN the Ops Engineer in the “Worker polls the connector's payments” flow
- WHEN a payment is fetched by a well-formed but non-existent payment id
- THEN the system shall reject it with 404 NOT_FOUND. [CRAWL-CONFIRMED 2026-06-24: GET /v3/payments/<well-formed non-existent id> → 404 {errorCode:NOT_FOUND, errorMessage:'cannot get payment: not found'}.]

### Requirement: Pp s5

The payments list is filterable by status: GET /v3/payments?query={"$match":{"status":<S>}} returns only payments whose status is S. [CRAWL-CONFIRMED 2026-06-24: query status=SUCCEEDED → rows all SUCCEEDED (incl. the seeded HEAL-SEED-PAYMENT-0001); status=FAILED → 0 rows.]

_Source: `payments/internal/api/v3/handler_payments_list.go:1-40`_ · _Reference test: `sandbox/e2e/scenarios/payment-polling/PP-payment-guards.spec.ts`_

#### Scenario: Pp s5

- GIVEN the Ops Engineer in the “Worker polls the connector's payments” flow
- THEN the payments list is filterable by status: GET /v3/payments?query={"$match":{"status":<S>}} returns only payments whose status is S. [CRAWL-CONFIRMED 2026-06-24: query status=SUCCEEDED → rows all SUCCEEDED (incl. the seeded HEAL-SEED-PAYMENT-0001); status=FAILED → 0 rows.]
