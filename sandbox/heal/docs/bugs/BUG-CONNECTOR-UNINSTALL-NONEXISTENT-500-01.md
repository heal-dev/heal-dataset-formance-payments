## Bug: Uninstalling a non-existent connector returns 500 INTERNAL instead of a 4xx

> Found by: heal cover loop — connector-uninstall edge-case pass

**Symptom.** DELETE /v3/connectors/{id} with a well-formed but non-existent connector id returns HTTP 500 {errorCode:INTERNAL} rather than a clean client error (e.g. 404 Not Found).

**Repro.**
1. Pick a well-formed connector id for a connector that does not exist (base64url of {"Provider":"dummypay","Reference":"deadbeef-0000-4000-8000-000000000000"})
2. DELETE /v3/connectors/{thatId}
3. Observe HTTP 500 {errorCode:INTERNAL} instead of a 4xx

**Expected.** A clean 4xx client error (e.g. 404 Not Found) indicating the connector does not exist; no uninstall started.

**Actual.** HTTP 500 {errorCode:INTERNAL, errorMessage:'Internal error. Consult logs/traces to have more details.'}

**Evidence.** CU-S3-nonexistent.spec.ts asserts status < 500; run on 2026-06-24 failed: got 500. The malformed-id path (CU-S2) correctly returns 400 INVALID_ID, confirming the divergence is specific to the not-found (well-formed) case.

**Likely location.**
- payments/internal/api/v3/handler_connectors_uninstall.go:31-36

**Hypothesis.** The handler routes EVERY backend error through common.InternalServerError, so a not-found from backend.ConnectorsUninstall surfaces as a 500 rather than being mapped to a 404/4xx. A typed not-found error mapped via handleServiceErrors (as other handlers do) would yield the correct 4xx.

