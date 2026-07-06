# FPY-C01 — Create Payment Initiation (Transfer/Payout)

## Purpose

_(no summary specced)_

_Source: `payments/internal/api/v3/router.go:130-130`, `payments/internal/api/v3/handler_payment_initiations_create.go:39-103`, `payments/QA_PLAYBOOK.MD:18-19`_

## Requirements

### Requirement: FPY-C01-R01 — Create a payment initiation

The system SHALL let the Ops Engineer initiate a transfer or payout between accounts.

_Source: `payments/internal/api/v3/handler_payment_initiations_create.go:39-103`, `payments/QA_PLAYBOOK.MD:18-19`_ · _Reference test: `sandbox/e2e/flows/payment-initiation-create.spec.ts`_

#### Scenario: Create a payment initiation — happy path

- GIVEN the Ops Engineer on the app
- WHEN POST /v3/payment-initiations with a JSON body {reference (short, 3-1000 chars), connectorID, type (TRANSFER|PAYOUT), amount (minor units), asset, scheduledAt (FUTURE), sourceAccountID (optional), destinationAccountID (required)}
- AND Receive 202 Accepted with body {data:{paymentInitiationID, taskID}} — paymentInitiationID is the base64url PaymentInitiationID; taskID may be empty
- THEN GET /v3/payment-initiations and see the new initiation as a row with fields id, connectorID, provider, reference, createdAt, scheduledAt, description, type, sourceAccountID, destinationAccountID, amount, asset, metadata, status

### Requirement: FPY-C01-R02 — Ops Engineer initiates a TRANSFER between two internal accounts (POST /v3/payment-initiations

When the Ops Engineer initiates a TRANSFER between two internal accounts (POST /v3/payment-initiations, type TRANSFER) with a valid future scheduledAt, the system SHALL accept it (202), return {data:{paymentInitiationID, taskID}}, and the initiation SHALL appear in GET /v3/payment-initiations with type TRANSFER. [CRAWL-CONFIRMED: 202 → {data:{paymentInitiationID:<base64>, taskID:""}}; list row has type=TRANSFER. NOTE: taskID came back empty ("") on a future-scheduled create. DIVERGENCE: with NO ?noValidation query param, the created initiation's status was WAITING_FOR_VALIDATION (not auto SCHEDULED_FOR_PROCESSING) — assert it is RECORDED as a TRANSFER, not on a 'succeeded' status. Reference must be SHORT (Temporal WorkflowId length limit); scheduledAt must be future.]

_Source: `payments/internal/api/v3/handler_payment_initiations_create.go:92-102`_ · _Reference test: `sandbox/e2e/flows/payment-initiation-create.spec.ts`_

#### Scenario: Ops Engineer initiates a TRANSFER between two internal accounts (POST /v3/payment-initiations

- GIVEN the Ops Engineer in the “Create a payment initiation” flow
- WHEN the Ops Engineer initiates a TRANSFER between two internal accounts (POST /v3/payment-initiations
- THEN type TRANSFER) with a valid future scheduledAt, the system shall accept it (202), return {data:{paymentInitiationID, taskID}}, and the initiation shall appear in GET /v3/payment-initiations with type TRANSFER. [CRAWL-CONFIRMED: 202 → {data:{paymentInitiationID:<base64>, taskID:""}}; list row has type=TRANSFER. NOTE: taskID came back empty ("") on a future-scheduled create. DIVERGENCE: with NO ?noValidation query param, the created initiation's status was WAITING_FOR_VALIDATION (not auto SCHEDULED_FOR_PROCESSING) — assert it is RECORDED as a TRANSFER, not on a 'succeeded' status. Reference must be SHORT (Temporal WorkflowId length limit); scheduledAt must be future.]

### Requirement: FPY-C01-R03 — Ops Engineer initiates a PAYOUT to a forwarded external account (POST /v3/payment-initiations

When the Ops Engineer initiates a PAYOUT to a forwarded external account (POST /v3/payment-initiations, type PAYOUT), the system SHALL accept it (202) and the initiation SHALL appear with type PAYOUT. [CRAWL-CONFIRMED: forwarded a bank account to the dummypay connector → an EXTERNAL account materialized within ~1s (GET /v3/bank-accounts/{id} → relatedAccounts[0].accountID); POST type PAYOUT (source=internal acct-001, destination=external) → 202 {data:{paymentInitiationID:<base64>, taskID:""}}; list row has type=PAYOUT, status=WAITING_FOR_VALIDATION.]

_Source: `payments/internal/api/v3/handler_payment_initiations_create.go:24-24`, `payments/QA_PLAYBOOK.MD:19-19`_ · _Reference test: `sandbox/e2e/scenarios/payment-initiation-create/PIC-S2-payout.spec.ts`_

#### Scenario: Ops Engineer initiates a PAYOUT to a forwarded external account (POST /v3/payment-initiations

- GIVEN the Ops Engineer in the “Create a payment initiation” flow
- WHEN the Ops Engineer initiates a PAYOUT to a forwarded external account (POST /v3/payment-initiations
- THEN type PAYOUT), the system shall accept it (202) and the initiation shall appear with type PAYOUT. [CRAWL-CONFIRMED: forwarded a bank account to the dummypay connector → an EXTERNAL account materialized within ~1s (GET /v3/bank-accounts/{id} → relatedAccounts[0].accountID); POST type PAYOUT (source=internal acct-001, destination=external) → 202 {data:{paymentInitiationID:<base64>, taskID:""}}; list row has type=PAYOUT, status=WAITING_FOR_VALIDATION.]

### Requirement: FPY-C01-R04 — A required field is missing (e.g. destinationAccountID

When a required field is missing (e.g. destinationAccountID, amount, asset, type, or reference), the system SHALL reject it with 400 VALIDATION. [CRAWL-CONFIRMED: POST omitting destinationAccountID → 400 {errorCode:VALIDATION, errorMessage:'DestinationAccountID is a required field'}. NB: sourceAccountID is OPTIONAL (omitempty) — only destinationAccountID is required.]

_Source: `payments/internal/api/v3/handler_payment_initiations_create.go:19-30`_ · _Reference test: `sandbox/e2e/scenarios/payment-initiation-create/PIC-validation-guards.spec.ts`_

#### Scenario: A required field is missing (e.g. destinationAccountID

- GIVEN the Ops Engineer in the “Create a payment initiation” flow
- WHEN a required field is missing (e.g. destinationAccountID
- THEN amount, asset, type, or reference), the system shall reject it with 400 VALIDATION. [CRAWL-CONFIRMED: POST omitting destinationAccountID → 400 {errorCode:VALIDATION, errorMessage:'DestinationAccountID is a required field'}. NB: sourceAccountID is OPTIONAL (omitempty) — only destinationAccountID is required.]

### Requirement: FPY-C01-R05 — ScheduledAt is in the past

When scheduledAt is in the past, the system SHALL reject it with 400 VALIDATION (scheduledAt must be in the future). [CRAWL-CONFIRMED: POST with a past scheduledAt → 400 {errorCode:VALIDATION, errorMessage:'ScheduledAt must be greater than the current Date & Time'}.]

_Source: `payments/internal/api/v3/handler_payment_initiations_create.go:21-21`_ · _Reference test: `sandbox/e2e/scenarios/payment-initiation-create/PIC-validation-guards.spec.ts`_

#### Scenario: ScheduledAt is in the past

- GIVEN the Ops Engineer in the “Create a payment initiation” flow
- WHEN scheduledAt is in the past
- THEN the system shall reject it with 400 VALIDATION (scheduledAt must be in the future). [CRAWL-CONFIRMED: POST with a past scheduledAt → 400 {errorCode:VALIDATION, errorMessage:'ScheduledAt must be greater than the current Date & Time'}.]

### Requirement: FPY-C01-R06 — Type is not a valid payment initiation type (not TRANSFER/PAYOUT)

When the type is not a valid payment initiation type (not TRANSFER/PAYOUT), the system SHALL reject it with 400 VALIDATION. [CRAWL-CONFIRMED: POST with type 'BOGUS' → 400 {errorCode:VALIDATION, errorMessage:'Type is invalid'}.]

_Source: `payments/internal/api/v3/handler_payment_initiations_create.go:24-24`_ · _Reference test: `sandbox/e2e/scenarios/payment-initiation-create/PIC-validation-guards.spec.ts`_

#### Scenario: Type is not a valid payment initiation type (not TRANSFER/PAYOUT)

- GIVEN the Ops Engineer in the “Create a payment initiation” flow
- WHEN the type is not a valid payment initiation type (not TRANSFER/PAYOUT)
- THEN the system shall reject it with 400 VALIDATION. [CRAWL-CONFIRMED: POST with type 'BOGUS' → 400 {errorCode:VALIDATION, errorMessage:'Type is invalid'}.]

### Requirement: FPY-C01-R07 — Reference is shorter than 3 characters (fails gte=3)

When the reference is shorter than 3 characters (fails gte=3), the system SHALL reject it with 400 VALIDATION. [CRAWL-CONFIRMED 2026-06-24: POST /v3/payment-initiations with reference 'ab' → 400 {errorCode:VALIDATION, errorMessage:'Reference must be at least 3 characters in length'}.]

_Source: `payments/internal/api/v3/handler_payment_initiations_create.go:20-20`_ · _Reference test: `sandbox/e2e/scenarios/payment-initiation-create/PIC-validation-guards-2.spec.ts`_

#### Scenario: Reference is shorter than 3 characters (fails gte=3)

- GIVEN the Ops Engineer in the “Create a payment initiation” flow
- WHEN the reference is shorter than 3 characters (fails gte=3)
- THEN the system shall reject it with 400 VALIDATION. [CRAWL-CONFIRMED 2026-06-24: POST /v3/payment-initiations with reference 'ab' → 400 {errorCode:VALIDATION, errorMessage:'Reference must be at least 3 characters in length'}.]

### Requirement: FPY-C01-R08 — Asset is not a valid asset (fails the asset validator)

When the asset is not a valid asset (fails the asset validator), the system SHALL reject it with 400 VALIDATION. [CRAWL-CONFIRMED 2026-06-24: POST with asset 'NOTANASSET' → 400 {errorCode:VALIDATION, errorMessage:'Asset is invalid'}.]

_Source: `payments/internal/api/v3/handler_payment_initiations_create.go:25-25`_ · _Reference test: `sandbox/e2e/scenarios/payment-initiation-create/PIC-validation-guards-2.spec.ts`_

#### Scenario: Asset is not a valid asset (fails the asset validator)

- GIVEN the Ops Engineer in the “Create a payment initiation” flow
- WHEN the asset is not a valid asset (fails the asset validator)
- THEN the system shall reject it with 400 VALIDATION. [CRAWL-CONFIRMED 2026-06-24: POST with asset 'NOTANASSET' → 400 {errorCode:VALIDATION, errorMessage:'Asset is invalid'}.]

### Requirement: FPY-C01-R09 — Pic s8

A negative amount is currently ACCEPTED: the create request validates Amount as 'required' only (no sign/min-value guard), so a negative amount is recorded rather than rejected. [CRAWL-OBSERVED 2026-06-24: POST with amount:-100 → 202 {data:{paymentInitiationID:<base64>, taskID:''}} (NOT a 400). This documents a MISSING guard — a negative payment-initiation amount is accepted. Flag at verify: likely a product gap (amount should be > 0), but the test asserts the current behaviour so it does not certify it as intended.]

_Source: `payments/internal/api/v3/handler_payment_initiations_create.go:24-24`_ · _Reference test: `sandbox/e2e/scenarios/payment-initiation-create/PIC-validation-guards-2.spec.ts`_

#### Scenario: Pic s8

- GIVEN the Ops Engineer in the “Create a payment initiation” flow
- THEN A negative amount is currently ACCEPTED: the create request validates Amount as 'required' only (no sign/min-value guard), so a negative amount is recorded rather than rejected. [CRAWL-OBSERVED 2026-06-24: POST with amount:-100 → 202 {data:{paymentInitiationID:<base64>, taskID:''}} (NOT a 400). This documents a MISSING guard — a negative payment-initiation amount is accepted. Flag at verify: likely a product gap (amount should be > 0), but the test asserts the current behaviour so it does not certify it as intended.]
