# Webhook Events

## Purpose

_(no summary specced)_

_Source: `payments/internal/api/v3/router.go:19-19`, `payments/internal/api/v3/handler_connectors_webhooks.go:14-62`, `payments/QA_PLAYBOOK.MD:39-39`_

## Requirements

### Requirement: Ingest an inbound PSP webhook

The system SHALL let the Ops Engineer rely on the PSP posting webhook events to the connector's webhook endpoint.

_Source: `payments/internal/api/v3/handler_connectors_webhooks.go:14-62`, `payments/QA_PLAYBOOK.MD:39-39`_

#### Scenario: Ingest an inbound PSP webhook — happy path

- GIVEN the Ops Engineer on the app
- WHEN The PSP POSTs an event to the public route /v3/connectors/webhooks/{connectorID}/<path>
- AND The handler validates the connectorID, captures body/headers/query/basic-auth, and dispatches to the connector's webhook translation
- THEN The event is ingested and the corresponding state change (e.g. a payment adjustment) is recorded

### Requirement: PSP posts a valid webhook event to /v3/connectors/webhooks/{connectorID}/<path>

When the PSP posts a valid webhook event to /v3/connectors/webhooks/{connectorID}/<path>, the system SHALL ingest it and record the corresponding state change. [SETUP-GAP SG03: the sandbox's only connector is dummypay, which registers NO webhook support (no TranslateWebhook / webhook config) — so there is no real PSP to post a translatable webhook, and the happy path cannot be demonstrated additively. Resolving it needs a webhook-capable PSP substitution — a human fidelity-rung decision. Left unverified pending that. NB: posting to the endpoint with a valid dummypay connector currently 500s (see WE-S3).]

_Source: `payments/internal/api/v3/handler_connectors_webhooks.go:53-58`_

#### Scenario: PSP posts a valid webhook event to /v3/connectors/webhooks/{connectorID}/<path>

- GIVEN the Ops Engineer in the “Ingest an inbound PSP webhook” flow
- WHEN the PSP posts a valid webhook event to /v3/connectors/webhooks/{connectorID}/<path>
- THEN the system shall ingest it and record the corresponding state change. [SETUP-GAP SG03: the sandbox's only connector is dummypay, which registers NO webhook support (no TranslateWebhook / webhook config) — so there is no real PSP to post a translatable webhook, and the happy path cannot be demonstrated additively. Resolving it needs a webhook-capable PSP substitution — a human fidelity-rung decision. Left unverified pending that. NB: posting to the endpoint with a valid dummypay connector currently 500s (see WE-S3).]

### Requirement: A webhook is posted to a malformed connector id (/v3/connectors/webhooks/not-a-valid-id/...)

When a webhook is posted to a malformed connector id (/v3/connectors/webhooks/not-a-valid-id/...), the system SHALL reject it with 400 INVALID_ID. [CRAWL-CONFIRMED 2026-06-24: → 400 {errorCode:INVALID_ID, errorMessage:'invalid character ... looking for beginning of value'}.]

_Source: `payments/internal/api/v3/handler_connectors_webhooks.go:20-25`_ · _Reference test: `sandbox/e2e/scenarios/webhook-events/WE-edges.spec.ts`_

#### Scenario: A webhook is posted to a malformed connector id (/v3/connectors/webhooks/not-a-valid-id/...)

- GIVEN the Ops Engineer in the “Ingest an inbound PSP webhook” flow
- WHEN a webhook is posted to a malformed connector id (/v3/connectors/webhooks/not-a-valid-id/...)
- THEN the system shall reject it with 400 INVALID_ID. [CRAWL-CONFIRMED 2026-06-24: → 400 {errorCode:INVALID_ID, errorMessage:'invalid character ... looking for beginning of value'}.]

### Requirement: A webhook is posted to a well-formed connector that has no webhook configuration registered (e.g. dummypay)

When a webhook is posted to a well-formed connector that has no webhook configuration registered (e.g. dummypay), the system currently returns 500 INTERNAL rather than a typed 4xx. [CRAWL-DIVERGENCE 2026-06-24: POST /v3/connectors/webhooks/<valid dummypay connectorID>/test-event → 500 {errorCode:INTERNAL}. Candidate bug — a webhook for a connector with no registered handler should arguably be a typed 4xx (e.g. NOT_FOUND/NOT_IMPLEMENTED), not a raw 500. Adjudicate at verify (bug-gap vs spec). Same family as the install-time 500s already filed.]

_Source: `payments/internal/api/v3/handler_connectors_webhooks.go:53-58`_ · _Reference test: `sandbox/e2e/scenarios/webhook-events/WE-edges.spec.ts`_

#### Scenario: A webhook is posted to a well-formed connector that has no webhook configuration registered (e.g. dummypay)

- GIVEN the Ops Engineer in the “Ingest an inbound PSP webhook” flow
- WHEN a webhook is posted to a well-formed connector that has no webhook configuration registered (e.g. dummypay)
- THEN the system currently returns 500 INTERNAL rather than a typed 4xx. [CRAWL-DIVERGENCE 2026-06-24: POST /v3/connectors/webhooks/<valid dummypay connectorID>/test-event → 500 {errorCode:INTERNAL}. Candidate bug — a webhook for a connector with no registered handler should arguably be a typed 4xx (e.g. NOT_FOUND/NOT_IMPLEMENTED), not a raw 500. Adjudicate at verify (bug-gap vs spec). Same family as the install-time 500s already filed.]

### Requirement: A webhook is posted to a well-formed but NON-EXISTENT connector id

When a webhook is posted to a well-formed but NON-EXISTENT connector id, the system SHALL reject it with 404 NOT_FOUND. [CRAWL-CONFIRMED 2026-06-24: POST /v3/connectors/webhooks/<well-formed non-existent connector id>/test-event → 404 {errorCode:NOT_FOUND, errorMessage:'not found'}. Distinct from WE-S3: an EXISTING connector with no webhook config 500s, whereas a NON-EXISTENT connector resolves to a clean 404.]

_Source: `payments/internal/api/v3/handler_connectors_webhooks.go:54-60`_ · _Reference test: `sandbox/e2e/scenarios/webhook-events/WE-S4-nonexistent-connector.spec.ts`_

#### Scenario: A webhook is posted to a well-formed but NON-EXISTENT connector id

- GIVEN the Ops Engineer in the “Ingest an inbound PSP webhook” flow
- WHEN a webhook is posted to a well-formed but NON-EXISTENT connector id
- THEN the system shall reject it with 404 NOT_FOUND. [CRAWL-CONFIRMED 2026-06-24: POST /v3/connectors/webhooks/<well-formed non-existent connector id>/test-event → 404 {errorCode:NOT_FOUND, errorMessage:'not found'}. Distinct from WE-S3: an EXISTING connector with no webhook config 500s, whereas a NON-EXISTENT connector resolves to a clean 404.]
