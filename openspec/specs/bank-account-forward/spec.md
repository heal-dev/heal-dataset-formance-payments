# FPY-C09 — Forward Bank Account

## Purpose

_(no summary specced)_

_Source: `payments/internal/api/v3/router.go:46-46`, `payments/internal/api/v3/handler_bank_accounts_forward_to_connector.go:23-65`, `payments/QA_PLAYBOOK.MD:10-10`_

## Requirements

### Requirement: FPY-C09-R01 — Forward a bank account to a connector

The system SHALL let the Ops Engineer forward a registered bank account to a connector.

_Source: `payments/internal/api/v3/handler_bank_accounts_forward_to_connector.go:23-65`, `payments/QA_PLAYBOOK.MD:10-10`_ · _Reference test: `sandbox/e2e/flows/bank-account-forward.spec.ts`_

#### Scenario: Forward a bank account to a connector — happy path

- GIVEN the Ops Engineer on the app

### Requirement: FPY-C09-R02 — Ops Engineer forwards an existing bank account to an installed connector (POST /v3/bank-accounts/{id}/forward {connectorID})

When the Ops Engineer forwards an existing bank account to an installed connector (POST /v3/bank-accounts/{id}/forward {connectorID}), the system SHALL accept the request (202) and return {data:{taskID}}, and after the async task completes an account with type EXTERNAL for that connector becomes available (GET /v3/accounts). [CRAWL-CONFIRMED: 202 → {data:{taskID:<base64>}}; EXTERNAL account appears within a couple seconds.]

_Source: `payments/internal/api/v3/handler_bank_accounts_forward_to_connector.go:54-64`_

#### Scenario: Ops Engineer forwards an existing bank account to an installed connector (POST /v3/bank-accounts/{id}/forward {connectorID})

- GIVEN the Ops Engineer in the “Forward a bank account to a connector” flow
- WHEN the Ops Engineer forwards an existing bank account to an installed connector (POST /v3/bank-accounts/{id}/forward {connectorID})
- THEN the system shall accept the request (202) and return {data:{taskID}}, and after the async task completes an account with type EXTERNAL for that connector becomes available (GET /v3/accounts). [CRAWL-CONFIRMED: 202 → {data:{taskID:<base64>}}; EXTERNAL account appears within a couple seconds.]

### Requirement: FPY-C09-R03 — Forward is requested with a malformed bank account id (not a UUID)

When the forward is requested with a malformed bank account id (not a UUID), the system SHALL reject it with 400 Bad Request (ErrInvalidID). [CRAWL-CONFIRMED: 400 {errorCode:INVALID_ID, 'invalid UUID length'}.]

_Source: `payments/internal/api/v3/handler_bank_accounts_forward_to_connector.go:29-34`_ · _Reference test: `sandbox/e2e/scenarios/bank-account-forward/BF-validation-guards.spec.ts`_

#### Scenario: Forward is requested with a malformed bank account id (not a UUID)

- GIVEN the Ops Engineer in the “Forward a bank account to a connector” flow
- WHEN the forward is requested with a malformed bank account id (not a UUID)
- THEN the system shall reject it with 400 Bad Request (ErrInvalidID). [CRAWL-CONFIRMED: 400 {errorCode:INVALID_ID, 'invalid UUID length'}.]

### Requirement: FPY-C09-R04 — Forward is requested without a connectorID in the body

When the forward is requested without a connectorID in the body, the system SHALL reject it with 400 VALIDATION (connectorID is required). [CRAWL-CONFIRMED: 400 {errorCode:VALIDATION, 'ConnectorID is a required field'}.]

_Source: `payments/internal/api/v3/handler_bank_accounts_forward_to_connector.go:16-16`, `payments/internal/api/v3/handler_bank_accounts_forward_to_connector.go:46-51`_ · _Reference test: `sandbox/e2e/scenarios/bank-account-forward/BF-validation-guards.spec.ts`_

#### Scenario: Forward is requested without a connectorID in the body

- GIVEN the Ops Engineer in the “Forward a bank account to a connector” flow
- WHEN the forward is requested without a connectorID in the body
- THEN the system shall reject it with 400 VALIDATION (connectorID is required). [CRAWL-CONFIRMED: 400 {errorCode:VALIDATION, 'ConnectorID is a required field'}.]

### Requirement: FPY-C09-R05 — Forward references a well-formed but non-existent connectorID

When the forward references a well-formed but non-existent connectorID, the system SHALL reject it with 404 NOT_FOUND (connector not found); when the connectorID is malformed it SHALL reject with 400 VALIDATION. [CRAWL-CONFIRMED: nonexistent → 404 {errorCode:NOT_FOUND,'connector not found'}; malformed → 400 {errorCode:VALIDATION,'ConnectorID is invalid'}.]

_Source: `payments/internal/api/v3/handler_bank_accounts_forward_to_connector.go:53-60`_ · _Reference test: `sandbox/e2e/scenarios/bank-account-forward/BF-validation-guards.spec.ts`_

#### Scenario: Forward references a well-formed but non-existent connectorID

- GIVEN the Ops Engineer in the “Forward a bank account to a connector” flow
- WHEN the forward references a well-formed but non-existent connectorID
- THEN the system shall reject it with 404 NOT_FOUND (connector not found); when the connectorID is malformed it shall reject with 400 VALIDATION. [CRAWL-CONFIRMED: nonexistent → 404 {errorCode:NOT_FOUND,'connector not found'}; malformed → 400 {errorCode:VALIDATION,'ConnectorID is invalid'}.]

### Requirement: FPY-C09-R06 — Forward targets a well-formed but non-existent bank account id (valid UUID

When the forward targets a well-formed but non-existent bank account id (valid UUID, no such bank account), the system SHALL reject it with 404 NOT_FOUND and start no forward. [CRAWL-CONFIRMED 2026-06-24: POST /v3/bank-accounts/deadbeef-0000-4000-8000-000000000000/forward {connectorID:<valid>} → 404 {errorCode:NOT_FOUND, errorMessage:'failed to get bank account: not found'}.]

_Source: `payments/internal/api/v3/handler_bank_accounts_forward_to_connector.go:53-58`_ · _Reference test: `sandbox/e2e/scenarios/bank-account-forward/BF-S5-nonexistent-account.spec.ts`_

#### Scenario: Forward targets a well-formed but non-existent bank account id (valid UUID

- GIVEN the Ops Engineer in the “Forward a bank account to a connector” flow
- WHEN the forward targets a well-formed but non-existent bank account id (valid UUID
- THEN no such bank account), the system shall reject it with 404 NOT_FOUND and start no forward. [CRAWL-CONFIRMED 2026-06-24: POST /v3/bank-accounts/deadbeef-0000-4000-8000-000000000000/forward {connectorID:<valid>} → 404 {errorCode:NOT_FOUND, errorMessage:'failed to get bank account: not found'}.]
