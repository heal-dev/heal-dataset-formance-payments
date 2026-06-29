## Bug: Installing a connector with a malformed JSON body returns 500 INTERNAL instead of 400

> Repo: payments · Found by: heal E2E — feature connector-install, scenario CI-S3

**Symptom.** POST /v3/connectors/install/{provider} with a malformed JSON body returns HTTP 500 {"errorCode":"INTERNAL"}. A malformed client request should be a 4xx (400 Bad Request), not a server error.

**Repro.**
1. POST /v3/connectors/install/dummypay with Content-Type application/json and a non-JSON / truncated body (e.g. '{bad-json').
2. Observe the response.

**Expected.** 400 Bad Request (the body is invalid JSON the client must fix).

**Actual.** 500 {"errorCode":"INTERNAL","errorMessage":"Internal error. Consult logs/traces to have more details."}

**Evidence.** expect(res.status()).toBeLessThan(500) failed: got 500 (e2e/scenarios/connector-install/CI-S3-malformed-body.spec.ts). A valid-JSON-but-invalid-config body correctly returns 400 VALIDATION, so only the malformed-JSON path is wrong.

**Likely location.**
- payments/internal/api/v3/handler_connectors_install.go:21-42 — the handler reads the raw body and passes it to backend.ConnectorsInstall; the only 400 path (lines 22-31) catches io.ReadAll/MaxBytes errors, not JSON-parse errors. The provider config unmarshal of a malformed body errors downstream and maps through handleServiceErrors to 500 INTERNAL.

**Hypothesis.** JSON unmarshal of the provider config happens in the service/provider layer and its parse error is classified as INTERNAL rather than a client/validation error; classify malformed-JSON config as a 400 (ErrMissingOrInvalidBody / ErrValidation).

**Task.** Reproduce the 500 on a malformed install body, make the malformed-JSON path return 400, and confirm CI-S3 passes. Don't weaken or delete the E2E test that caught this.

