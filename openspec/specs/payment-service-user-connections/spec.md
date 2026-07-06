# Payment Service User Connections

## Purpose

_(no summary specced)_

_Source: `payments/internal/api/v3/router.go:146-175`, `payments/internal/api/v3/handler_payment_service_users_create.go:33-70`_

## Requirements

### Requirement: Create and manage a payment service user

The system SHALL let the Ops Engineer register a payment service user (PSU).

_Source: `payments/internal/api/v3/handler_payment_service_users_create.go:33-70`_ · _Reference test: `sandbox/e2e/flows/payment-service-user-manage.spec.ts`_

#### Scenario: Create and manage a payment service user — happy path

- GIVEN the Ops Engineer on the app
- WHEN POST /v3/payment-service-users {name, contactDetails?, address?} to create a PSU; receive {data:<psuID>}
- AND GET /v3/payment-service-users and see the PSU listed
- THEN GET /v3/payment-service-users/{psuID} and see its fields {id, name, contactDetails, address, bankAccountIDs, metadata, createdAt}

### Requirement: Ops Engineer creates a payment service user (POST /v3/payment-service-users {name})

When the Ops Engineer creates a payment service user (POST /v3/payment-service-users {name}), the system SHALL create it and return {data:<psuID>}, the PSU SHALL appear in GET /v3/payment-service-users, and GET /v3/payment-service-users/{psuID} SHALL return its fields. [CRAWL-CONFIRMED 2026-06-24: create → {data:<uuid>}; get → {id, name, contactDetails, address, bankAccountIDs, metadata, createdAt}; PSU present in the list.]

_Source: `payments/internal/api/v3/handler_payment_service_users_create.go:60-70`_ · _Reference test: `sandbox/e2e/flows/payment-service-user-manage.spec.ts`_

#### Scenario: Ops Engineer creates a payment service user (POST /v3/payment-service-users {name})

- GIVEN the Ops Engineer in the “Create and manage a payment service user” flow
- WHEN the Ops Engineer creates a payment service user (POST /v3/payment-service-users {name})
- THEN the system shall create it and return {data:<psuID>}, the PSU shall appear in GET /v3/payment-service-users, and GET /v3/payment-service-users/{psuID} shall return its fields. [CRAWL-CONFIRMED 2026-06-24: create → {data:<uuid>}; get → {id, name, contactDetails, address, bankAccountIDs, metadata, createdAt}; PSU present in the list.]

### Requirement: A PSU is created without a name (POST /v3/payment-service-users without name)

When a PSU is created without a name (POST /v3/payment-service-users without name), the system SHALL reject it with 400 VALIDATION (name is required). [CRAWL-CONFIRMED 2026-06-24: → 400 {errorCode:VALIDATION, errorMessage:'Name is a required field'}.]

_Source: `payments/internal/api/v3/handler_payment_service_users_create.go:33-33`_ · _Reference test: `sandbox/e2e/scenarios/payment-service-user-connections/PSU-edges.spec.ts`_

#### Scenario: A PSU is created without a name (POST /v3/payment-service-users without name)

- GIVEN the Ops Engineer in the “Create and manage a payment service user” flow
- WHEN a PSU is created without a name (POST /v3/payment-service-users without name)
- THEN the system shall reject it with 400 VALIDATION (name is required). [CRAWL-CONFIRMED 2026-06-24: → 400 {errorCode:VALIDATION, errorMessage:'Name is a required field'}.]

### Requirement: Ops Engineer deletes a PSU (DELETE /v3/payment-service-users/{psuID})

When the Ops Engineer deletes a PSU (DELETE /v3/payment-service-users/{psuID}), the system SHALL accept it (202) and the PSU SHALL no longer appear in GET /v3/payment-service-users. [CRAWL-CONFIRMED 2026-06-24: DELETE → 202; PSU absent from the list afterwards.]

_Source: `payments/internal/api/v3/router.go:154-154`_ · _Reference test: `sandbox/e2e/scenarios/payment-service-user-connections/PSU-edges.spec.ts`_

#### Scenario: Ops Engineer deletes a PSU (DELETE /v3/payment-service-users/{psuID})

- GIVEN the Ops Engineer in the “Create and manage a payment service user” flow
- WHEN the Ops Engineer deletes a PSU (DELETE /v3/payment-service-users/{psuID})
- THEN the system shall accept it (202) and the PSU shall no longer appear in GET /v3/payment-service-users. [CRAWL-CONFIRMED 2026-06-24: DELETE → 202; PSU absent from the list afterwards.]

### Requirement: Psu s4

A PSU can be connected to a provider via Open Banking (POST .../connectors/{connectorID}/create-link, forward, link-attempts) so that its accounts are linked. [SETUP-GAP SG04: Open-Banking connection/linking requires an Open-Banking-capable connector (a real OB provider or its sandbox); the sandbox's only connector is dummypay, which is not an Open-Banking provider, so the link/connection arcs cannot be demonstrated additively. Resolving needs an OB-capable PSP substitution — a human fidelity-rung decision. Left unverified pending that.]

_Source: `payments/internal/api/v3/router.go:158-169`_

#### Scenario: Psu s4

- GIVEN the Ops Engineer in the “Create and manage a payment service user” flow
- THEN A PSU can be connected to a provider via Open Banking (POST .../connectors/{connectorID}/create-link, forward, link-attempts) so that its accounts are linked. [SETUP-GAP SG04: Open-Banking connection/linking requires an Open-Banking-capable connector (a real OB provider or its sandbox); the sandbox's only connector is dummypay, which is not an Open-Banking provider, so the link/connection arcs cannot be demonstrated additively. Resolving needs an OB-capable PSP substitution — a human fidelity-rung decision. Left unverified pending that.]

### Requirement: A PSU is created with an invalid contact email (fails the email validator)

When a PSU is created with an invalid contact email (fails the email validator), the system SHALL reject it with 400 VALIDATION. [CRAWL-CONFIRMED 2026-06-24: POST /v3/payment-service-users {name, contactDetails:{email:'not-an-email'}} → 400 {errorCode:VALIDATION, errorMessage:'Email is invalid'}.]

_Source: `payments/internal/api/v3/handler_payment_service_users_create.go:19-19`_ · _Reference test: `sandbox/e2e/scenarios/payment-service-user-connections/PSU-edges-2.spec.ts`_

#### Scenario: A PSU is created with an invalid contact email (fails the email validator)

- GIVEN the Ops Engineer in the “Create and manage a payment service user” flow
- WHEN a PSU is created with an invalid contact email (fails the email validator)
- THEN the system shall reject it with 400 VALIDATION. [CRAWL-CONFIRMED 2026-06-24: POST /v3/payment-service-users {name, contactDetails:{email:'not-an-email'}} → 400 {errorCode:VALIDATION, errorMessage:'Email is invalid'}.]

### Requirement: A PSU is created with a malformed bankAccountID (fails the dive

When a PSU is created with a malformed bankAccountID (fails the dive,uuid validator), the system SHALL reject it with 400 VALIDATION. [CRAWL-CONFIRMED 2026-06-24: POST {name, bankAccountIDs:['not-a-uuid']} → 400 {errorCode:VALIDATION, errorMessage:'BankAccountIDs[0] must be a valid UUID'}.]

_Source: `payments/internal/api/v3/handler_payment_service_users_create.go:38-38`_ · _Reference test: `sandbox/e2e/scenarios/payment-service-user-connections/PSU-edges-2.spec.ts`_

#### Scenario: A PSU is created with a malformed bankAccountID (fails the dive

- GIVEN the Ops Engineer in the “Create and manage a payment service user” flow
- WHEN a PSU is created with a malformed bankAccountID (fails the dive
- THEN uuid validator), the system shall reject it with 400 VALIDATION. [CRAWL-CONFIRMED 2026-06-24: POST {name, bankAccountIDs:['not-a-uuid']} → 400 {errorCode:VALIDATION, errorMessage:'BankAccountIDs[0] must be a valid UUID'}.]

### Requirement: A PSU is fetched by a well-formed but non-existent id (GET /v3/payment-service-users/{id})

When a PSU is fetched by a well-formed but non-existent id (GET /v3/payment-service-users/{id}), the system SHALL reject it with 404 NOT_FOUND. [CRAWL-CONFIRMED 2026-06-24: GET /v3/payment-service-users/deadbeef-0000-4000-8000-000000000000 → 404 {errorCode:NOT_FOUND, errorMessage:'cannot get payment service user: not found'}.]

_Source: `payments/internal/api/v3/handler_payment_service_users_get.go:1-40`_ · _Reference test: `sandbox/e2e/scenarios/payment-service-user-connections/PSU-edges-2.spec.ts`_

#### Scenario: A PSU is fetched by a well-formed but non-existent id (GET /v3/payment-service-users/{id})

- GIVEN the Ops Engineer in the “Create and manage a payment service user” flow
- WHEN a PSU is fetched by a well-formed but non-existent id (GET /v3/payment-service-users/{id})
- THEN the system shall reject it with 404 NOT_FOUND. [CRAWL-CONFIRMED 2026-06-24: GET /v3/payment-service-users/deadbeef-0000-4000-8000-000000000000 → 404 {errorCode:NOT_FOUND, errorMessage:'cannot get payment service user: not found'}.]

### Requirement: A non-existent PSU is deleted (DELETE /v3/payment-service-users/{id} for a well-formed but unknown id)

When a non-existent PSU is deleted (DELETE /v3/payment-service-users/{id} for a well-formed but unknown id), the system SHALL reject it with 404 NOT_FOUND. [CRAWL-CONFIRMED 2026-06-24: DELETE /v3/payment-service-users/deadbeef-0000-4000-8000-000000000000 → 404 {errorCode:NOT_FOUND, errorMessage:'cannot get payment service user: not found'}.]

_Source: `payments/internal/api/v3/handler_payment_service_users_delete.go:1-40`_ · _Reference test: `sandbox/e2e/scenarios/payment-service-user-connections/PSU-edges-2.spec.ts`_

#### Scenario: A non-existent PSU is deleted (DELETE /v3/payment-service-users/{id} for a well-formed but unknown id)

- GIVEN the Ops Engineer in the “Create and manage a payment service user” flow
- WHEN a non-existent PSU is deleted (DELETE /v3/payment-service-users/{id} for a well-formed but unknown id)
- THEN the system shall reject it with 404 NOT_FOUND. [CRAWL-CONFIRMED 2026-06-24: DELETE /v3/payment-service-users/deadbeef-0000-4000-8000-000000000000 → 404 {errorCode:NOT_FOUND, errorMessage:'cannot get payment service user: not found'}.]
