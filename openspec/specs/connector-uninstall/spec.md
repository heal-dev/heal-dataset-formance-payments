# Uninstall Connector

## Purpose

_(no summary specced)_

_Source: `payments/internal/api/v3/router.go:89-89`, `payments/internal/api/v3/handler_connectors_uninstall.go:18-42`, `payments/QA_PLAYBOOK.MD:39-39`_

## Requirements

### Requirement: Uninstall a connector

The system SHALL let the Ops Engineer uninstall a connector.

_Source: `payments/internal/api/v3/handler_connectors_uninstall.go:18-42`, `payments/QA_PLAYBOOK.MD:39-39`_ · _Reference test: `sandbox/e2e/flows/connector-uninstall.spec.ts`_

#### Scenario: Uninstall a connector — happy path

- GIVEN the Ops Engineer on the app

### Requirement: Ops Engineer uninstalls an installed connector (DELETE /v3/connectors/{connectorID})

When the Ops Engineer uninstalls an installed connector (DELETE /v3/connectors/{connectorID}), the system SHALL accept the request (202) and return {data:{taskID}}, and after the async uninstall task completes (~2-4s) the connector SHALL no longer appear in GET /v3/connectors. [CRAWL-CONFIRMED: 202 → {data:{taskID:<base64>}}; connector present immediately after DELETE, gone within a couple seconds.]

_Source: `payments/internal/api/v3/handler_connectors_uninstall.go:31-40`_

#### Scenario: Ops Engineer uninstalls an installed connector (DELETE /v3/connectors/{connectorID})

- GIVEN the Ops Engineer in the “Uninstall a connector” flow
- WHEN the Ops Engineer uninstalls an installed connector (DELETE /v3/connectors/{connectorID})
- THEN the system shall accept the request (202) and return {data:{taskID}}, and after the async uninstall task completes (~2-4s) the connector shall no longer appear in GET /v3/connectors. [CRAWL-CONFIRMED: 202 → {data:{taskID:<base64>}}; connector present immediately after DELETE, gone within a couple seconds.]

### Requirement: Uninstall is requested with a malformed/invalid connector id

When the uninstall is requested with a malformed/invalid connector id, the system SHALL reject it with 400 Bad Request and not start an uninstall. [CRAWL-CONFIRMED: DELETE /v3/connectors/not-a-valid-id → 400 {errorCode:INVALID_ID}.]

_Source: `payments/internal/api/v3/handler_connectors_uninstall.go:24-29`_ · _Reference test: `sandbox/e2e/scenarios/connector-uninstall/CU-S2-invalid-id.spec.ts`_

#### Scenario: Uninstall is requested with a malformed/invalid connector id

- GIVEN the Ops Engineer in the “Uninstall a connector” flow
- WHEN the uninstall is requested with a malformed/invalid connector id
- THEN the system shall reject it with 400 Bad Request and not start an uninstall. [CRAWL-CONFIRMED: DELETE /v3/connectors/not-a-valid-id → 400 {errorCode:INVALID_ID}.]

### Requirement: Uninstall targets a well-formed but non-existent connector id

When the uninstall targets a well-formed but non-existent connector id, the system should reject it with a clean 4xx (e.g. 404 Not Found) and start no uninstall. [CRAWL-DIVERGENCE/CANDIDATE-BUG 2026-06-24: DELETE /v3/connectors/<well-formed base64 id for a connector that does not exist> → 500 {errorCode:INTERNAL} instead of a 4xx. The handler routes every backend error (including not-found) through common.InternalServerError. Adjudicate as a bug-gap at verify.]

_Source: `payments/internal/api/v3/handler_connectors_uninstall.go:31-36`_ · _Reference test: `sandbox/e2e/scenarios/connector-uninstall/CU-S3-nonexistent.spec.ts`_

#### Scenario: Uninstall targets a well-formed but non-existent connector id

- GIVEN the Ops Engineer in the “Uninstall a connector” flow
- WHEN the uninstall targets a well-formed but non-existent connector id
- THEN the system should reject it with a clean 4xx (e.g. 404 Not Found) and start no uninstall. [CRAWL-DIVERGENCE/CANDIDATE-BUG 2026-06-24: DELETE /v3/connectors/<well-formed base64 id for a connector that does not exist> → 500 {errorCode:INTERNAL} instead of a 4xx. The handler routes every backend error (including not-found) through common.InternalServerError. Adjudicate as a bug-gap at verify.]
