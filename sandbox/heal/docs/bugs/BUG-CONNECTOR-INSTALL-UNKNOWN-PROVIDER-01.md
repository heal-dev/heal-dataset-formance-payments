## Bug: Installing a connector for an unknown provider returns 500 INTERNAL instead of a 4xx

> Repo: payments · Found by: heal E2E — feature connector-install, scenario CI-S4

**Symptom.** POST /v3/connectors/install/{provider} for a provider that does not exist returns HTTP 500 {"errorCode":"INTERNAL"}. An unknown/unsupported provider is a client error and should be a typed 4xx, not a server error.

**Repro.**
1. POST /v3/connectors/install/nosuchprovider with a valid-length config body, e.g. {"name":"heal-x"}.
2. Observe the response.

**Expected.** A typed 4xx client error indicating the provider is unknown/unsupported (e.g. 400 or 404).

**Actual.** 500 {"errorCode":"INTERNAL","errorMessage":"Internal error. Consult logs/traces to have more details."}

**Evidence.** expect(res.status()).toBeLessThan(500) failed: got 500 (e2e/scenarios/connector-install/CI-S4-unknown-provider.spec.ts). Note: when the config also fails name-length validation the API returns 400 VALIDATION first; with a valid name and an unknown provider it 500s.

**Likely location.**
- payments/internal/api/v3/handler_connectors_install.go:35-42 — provider := strings.ToLower(connector(r)); backend.ConnectorsInstall(ctx, provider, config); an unknown provider (no registered plugin) surfaces as a non-typed error mapped to 500 by handleServiceErrors instead of a client error.
- payments/internal/connectors/plugins/registry — the plugin/provider lookup for an unregistered provider; ensure 'unknown provider' returns a typed ErrInvalidRequest/NotFound.

**Hypothesis.** The provider-registry lookup returns a generic error for an unregistered provider that is not classified as a client error; classify unknown-provider as a typed 4xx (e.g. ErrValidation / not-found).

**Task.** Reproduce the 500 on an unknown provider, return a typed 4xx instead, and confirm CI-S4 passes. Don't weaken or delete the E2E test that caught this.

