# Install Connector

## Purpose

_(no summary specced)_

_Source: `payments/internal/api/v3/router.go:83-83`, `payments/internal/api/v3/handler_connectors_install.go:16-46`, `payments/QA_PLAYBOOK.MD:5-5`_

## Requirements

### Requirement: Install a connector

The system SHALL let the Ops Engineer install a PSP connector with its config.

_Source: `payments/internal/api/v3/handler_connectors_install.go:16-46`, `payments/QA_PLAYBOOK.MD:5-7`_ · _Reference test: `sandbox/e2e/flows/connector-install.spec.ts`_

#### Scenario: Install a connector — happy path

- GIVEN the Ops Engineer on the app

### Requirement: Ops Engineer installs a connector for a known provider with a valid config (POST /v3/connectors/install/{connector})

When the Ops Engineer installs a connector for a known provider with a valid config (POST /v3/connectors/install/{connector}), the system SHALL accept the request (202) and return the new connector id in {data}, and the connector SHALL appear in GET /v3/connectors with fields name, provider, reference, config{directory,pollingPeriod,name}, capabilities[], scheduledForDeletion, createdAt, updatedAt. [CRAWL-CONFIRMED: 202 → {data:<base64 connectorID>}; list row capabilities include FETCH_ACCOUNTS, FETCH_BALANCES, CREATE_TRANSFER, CREATE_PAYOUT; pollingPeriod normalized to '30m0s'.]

_Source: `payments/internal/api/v3/handler_connectors_install.go:37-44`, `payments/QA_PLAYBOOK.MD:5-5`_

#### Scenario: Ops Engineer installs a connector for a known provider with a valid config (POST /v3/connectors/install/{connector})

- GIVEN the Ops Engineer in the “Install a connector” flow
- WHEN the Ops Engineer installs a connector for a known provider with a valid config (POST /v3/connectors/install/{connector})
- THEN the system shall accept the request (202) and return the new connector id in {data}, and the connector shall appear in GET /v3/connectors with fields name, provider, reference, config{directory,pollingPeriod,name}, capabilities[], scheduledForDeletion, createdAt, updatedAt. [CRAWL-CONFIRMED: 202 → {data:<base64 connectorID>}; list row capabilities include FETCH_ACCOUNTS, FETCH_BALANCES, CREATE_TRANSFER, CREATE_PAYOUT; pollingPeriod normalized to '30m0s'.]

### Requirement: Install config is valid JSON but fails provider config validation (e.g. missing required field 'name' or 'directory')

When the install config is valid JSON but fails provider config validation (e.g. missing required field 'name' or 'directory'), the system SHALL reject it with 400 VALIDATION and not create a connector. [CRAWL-CONFIRMED: POST {} → 400 {errorCode:VALIDATION, 'Config.Name ... required'}; POST {name} → 400 {errorCode:VALIDATION, 'Config.Directory ... required'}.]

_Source: `payments/internal/api/v3/handler_connectors_install.go:37-42`_ · _Reference test: `sandbox/e2e/scenarios/connector-install/CI-S2-config-validation.spec.ts`_

#### Scenario: Install config is valid JSON but fails provider config validation (e.g. missing required field 'name' or 'directory')

- GIVEN the Ops Engineer in the “Install a connector” flow
- WHEN the install config is valid JSON but fails provider config validation (e.g. missing required field 'name' or 'directory')
- THEN the system shall reject it with 400 VALIDATION and not create a connector. [CRAWL-CONFIRMED: POST {} → 400 {errorCode:VALIDATION, 'Config.Name ... required'}; POST {name} → 400 {errorCode:VALIDATION, 'Config.Directory ... required'}.]

### Requirement: Install request body is malformed JSON

When the install request body is malformed JSON, the system currently returns 500 INTERNAL (NOT a 400). [CRAWL-DIVERGENCE: expected a 400 Bad Request for a malformed body, but POST a non-JSON body to a known provider → 500 {errorCode:INTERNAL}. The handler's 400 path (handler_connectors_install.go:22-31) only catches io.ReadAll/MaxBytes errors; JSON parsing happens in the provider config unmarshal downstream and surfaces as 500. Candidate bug — adjudicate at verify (bug-gap vs spec).]

_Source: `payments/internal/api/v3/handler_connectors_install.go:21-42`_ · _Reference test: `sandbox/e2e/scenarios/connector-install/CI-S3-malformed-body.spec.ts`_

#### Scenario: Install request body is malformed JSON

- GIVEN the Ops Engineer in the “Install a connector” flow
- WHEN the install request body is malformed JSON
- THEN the system currently returns 500 INTERNAL (NOT a 400). [CRAWL-DIVERGENCE: expected a 400 Bad Request for a malformed body, but POST a non-JSON body to a known provider → 500 {errorCode:INTERNAL}. The handler's 400 path (handler_connectors_install.go:22-31) only catches io.ReadAll/MaxBytes errors; JSON parsing happens in the provider config unmarshal downstream and surfaces as 500. Candidate bug — adjudicate at verify (bug-gap vs spec).]

### Requirement: Install is requested for an unknown/unsupported provider (with an otherwise valid-length name)

When the install is requested for an unknown/unsupported provider (with an otherwise valid-length name), the system currently returns 500 INTERNAL (NOT a clean 4xx). [CRAWL-DIVERGENCE: expected an unknown-provider rejection as a typed 4xx, but POST /v3/connectors/install/nosuchprovider {name:...} → 500 {errorCode:INTERNAL}. Candidate bug — adjudicate at verify.]

_Source: `payments/internal/api/v3/handler_connectors_install.go:35-42`_ · _Reference test: `sandbox/e2e/scenarios/connector-install/CI-S4-unknown-provider.spec.ts`_

#### Scenario: Install is requested for an unknown/unsupported provider (with an otherwise valid-length name)

- GIVEN the Ops Engineer in the “Install a connector” flow
- WHEN the install is requested for an unknown/unsupported provider (with an otherwise valid-length name)
- THEN the system currently returns 500 INTERNAL (NOT a clean 4xx). [CRAWL-DIVERGENCE: expected an unknown-provider rejection as a typed 4xx, but POST /v3/connectors/install/nosuchprovider {name:...} → 500 {errorCode:INTERNAL}. Candidate bug — adjudicate at verify.]

### Requirement: Install request body is the empty JSON object {} (no config fields)

When the install request body is the empty JSON object {} (no config fields), the system SHALL reject it with 400 VALIDATION because the provider config validation fails on the required Name field. [CRAWL-CONFIRMED 2026-06-24: POST /v3/connectors/install/dummypay -d '{}' → 400 {errorCode:VALIDATION, errorMessage:"invalid config: Key: 'Config.Name' Error:Field validation for 'Name' failed on the 'required' tag"}. DIVERGENCE/CANDIDATE-BUG: a truly EMPTY body ('') or whitespace-only body returns 500 {errorCode:INTERNAL} instead of a clean 4xx — the empty-bytes JSON unmarshal is not caught as ErrMissingOrInvalidBody. Tracked separately; this scenario asserts the clean 400 on {}.]

_Source: `payments/internal/api/v3/handler_connectors_install.go:20-39`_ · _Reference test: `sandbox/e2e/scenarios/connector-install/CI-S5-empty-config.spec.ts`_

#### Scenario: Install request body is the empty JSON object {} (no config fields)

- GIVEN the Ops Engineer in the “Install a connector” flow
- WHEN the install request body is the empty JSON object {} (no config fields)
- THEN the system shall reject it with 400 VALIDATION because the provider config validation fails on the required Name field. [CRAWL-CONFIRMED 2026-06-24: POST /v3/connectors/install/dummypay -d '{}' → 400 {errorCode:VALIDATION, errorMessage:"invalid config: Key: 'Config.Name' Error:Field validation for 'Name' failed on the 'required' tag"}. DIVERGENCE/CANDIDATE-BUG: a truly EMPTY body ('') or whitespace-only body returns 500 {errorCode:INTERNAL} instead of a clean 4xx — the empty-bytes JSON unmarshal is not caught as ErrMissingOrInvalidBody. Tracked separately; this scenario asserts the clean 400 on {}.]

### Requirement: Install request body exceeds the connector config size limit (>500000 bytes)

When the install request body exceeds the connector config size limit (>500000 bytes), the system SHALL reject it with 413 Request Entity Too Large. [CRAWL-CONFIRMED 2026-06-24: POST with a ~600KB body → 413 {errorCode:MISSING_OR_INVALID_BODY, errorMessage:'http: request body too large'} — matches the http.MaxBytesReader(connectorConfigMaxBytes=500000) → MaxBytesError → WriteErrorResponse(StatusRequestEntityTooLarge, ErrMissingOrInvalidBody) path.]

_Source: `payments/internal/api/v3/handler_connectors_install.go:13-27`_ · _Reference test: `sandbox/e2e/scenarios/connector-install/CI-S6-oversized-body.spec.ts`_

#### Scenario: Install request body exceeds the connector config size limit (>500000 bytes)

- GIVEN the Ops Engineer in the “Install a connector” flow
- WHEN the install request body exceeds the connector config size limit (>500000 bytes)
- THEN the system shall reject it with 413 Request Entity Too Large. [CRAWL-CONFIRMED 2026-06-24: POST with a ~600KB body → 413 {errorCode:MISSING_OR_INVALID_BODY, errorMessage:'http: request body too large'} — matches the http.MaxBytesReader(connectorConfigMaxBytes=500000) → MaxBytesError → WriteErrorResponse(StatusRequestEntityTooLarge, ErrMissingOrInvalidBody) path.]
