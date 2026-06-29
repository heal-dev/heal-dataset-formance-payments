## Bug: Inbound webhook to a connector with no registered webhook handler returns 500 INTERNAL instead of a typed 4xx

> Repo: payments · Found by: cover-loop verify-feature (webhook-events, WE-S3)

**Symptom.** POST /v3/connectors/webhooks/{connectorID}/<path> to a well-formed, installed connector that registers no webhook handler (e.g. dummypay) returns HTTP 500 {errorCode:INTERNAL} rather than a typed 4xx (e.g. 404 NOT_FOUND or 501 NOT_IMPLEMENTED).

**Repro.**
1. Install a dummypay connector and capture its connectorID.
2. POST /v3/connectors/webhooks/{connectorID}/test-event with body {"event":"test"}.
3. Observe HTTP 500 {errorCode:INTERNAL} instead of a typed 4xx.

**Expected.** A structurally-valid webhook POST to a known connector that has no webhook configuration should be rejected with a typed 4xx indicating the connector/webhook is not configured — not a generic 500 INTERNAL. (A 500 implies an unexpected server fault; this is a known, handleable condition.)

**Actual.** HTTP 500 {"errorCode":"INTERNAL","errorMessage":"Internal error. Consult logs/traces to have more details."}

**Evidence.** e2e/scenarios/webhook-events/WE-edges.spec.ts WE-S3 asserts the observed 500 (documented divergence). Crawl-confirmed 2026-06-24. WE-S2 (malformed connector id → 400 INVALID_ID) behaves correctly, so the 500 is specific to the no-webhook-config path, not id validation.

**Likely location.**
- payments/internal/api/v3/handler_connectors_webhooks.go:53-58 (dispatch to ConnectorsHandleWebhooks)
- payments/internal/api/services/connectors_handle_webhooks.go (handleEngineErrors mapping)
- payments/internal/connectors/engine (HandleWebhook connector-config lookup)

**Hypothesis.** handler_connectors_webhooks.go validates the connectorID and dispatches to backend.ConnectorsHandleWebhooks → engine.HandleWebhook, which looks up the connector's registered webhook config/translation. dummypay registers none, so the lookup errors; handleServiceErrors maps the unclassified error to 500 INTERNAL instead of a typed not-found/not-implemented. Same error-classification family as BUG-CONNECTOR-INSTALL-MALFORMED-BODY-01 and BUG-CONNECTOR-INSTALL-UNKNOWN-PROVIDER-01 (handleable conditions surfacing as raw 500s).

