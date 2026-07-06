# FPY-C02 — Reverse Payment Initiation

## Purpose

_(no summary specced)_

_Source: `payments/internal/api/v3/router.go:139-139`, `payments/internal/api/v3/handler_payment_initiations_reverse.go:31-90`, `payments/QA_PLAYBOOK.MD:20-21`_

## Requirements

### Requirement: FPY-C02-R01 — Reverse a payment initiation

The system SHALL let the Ops Engineer reverse an existing payment initiation.

_Source: `payments/internal/api/v3/handler_payment_initiations_reverse.go:31-90`, `payments/QA_PLAYBOOK.MD:20-21`_ · _Reference test: `sandbox/e2e/flows/payment-initiation-reverse.spec.ts`_

#### Scenario: Reverse a payment initiation — happy path

- GIVEN the Ops Engineer on the app
- WHEN POST /v3/payment-initiations/{id}/reverse with a JSON body {reference (short, 3-1000 chars), amount (minor units), asset, description (optional), metadata (optional)}
- AND Receive 202 Accepted with body {data:{paymentInitiationReversalID, taskID}}
- THEN GET /v3/payment-initiations/{id}/adjustments and see the reversal recorded as an adjustment against the initiation

### Requirement: FPY-C02-R02 — Ops Engineer reverses an existing payment initiation (POST /v3/payment-initiations/{id}/reverse with a valid {reference

When the Ops Engineer reverses an existing payment initiation (POST /v3/payment-initiations/{id}/reverse with a valid {reference, amount, asset}), the system SHALL accept it (202), return {data:{paymentInitiationReversalID, taskID}}, and the reversal SHALL be recorded as an adjustment visible in GET /v3/payment-initiations/{id}/adjustments. [INTENT per handler api.Accepted(...) + QA_PLAYBOOK 'Reverse a Payout/Transfer'. CRAWL-CONFIRMED PRODUCT BUG (reproduced 2026-06-24): reverse of a valid initiation with a valid SHORT body returns HTTP 500 {errorCode:INTERNAL, errorMessage:'Internal error. Consult logs/traces to have more details.'} — the documented 202 {data:{paymentInitiationReversalID, taskID}} is NEVER returned and NO reversal adjustment is recorded (GET .../adjustments shows only the initiation's own creation adjustment). Root cause (from code): Temporal 'WorkflowId length exceeds limit' on the reverse-payout workflow id (engine.go ReversePayout builds the id from reverse-payout-<stack>-<CreatedAt> + connectorID + reversal.ID; the connectorID blob dominates → overflow). NOT fixable by shortening the request reference. Adjudicate as a bug-gap at verify.]

_Source: `payments/internal/api/v3/handler_payment_initiations_reverse.go:83-89`_ · _Reference test: `sandbox/e2e/flows/payment-initiation-reverse.spec.ts`_

#### Scenario: Ops Engineer reverses an existing payment initiation (POST /v3/payment-initiations/{id}/reverse with a valid {reference

- GIVEN the Ops Engineer in the “Reverse a payment initiation” flow
- WHEN the Ops Engineer reverses an existing payment initiation (POST /v3/payment-initiations/{id}/reverse with a valid {reference
- THEN amount, asset}), the system shall accept it (202), return {data:{paymentInitiationReversalID, taskID}}, and the reversal shall be recorded as an adjustment visible in GET /v3/payment-initiations/{id}/adjustments. [INTENT per handler api.Accepted(...) + QA_PLAYBOOK 'Reverse a Payout/Transfer'. CRAWL-CONFIRMED PRODUCT BUG (reproduced 2026-06-24): reverse of a valid initiation with a valid SHORT body returns HTTP 500 {errorCode:INTERNAL, errorMessage:'Internal error. Consult logs/traces to have more details.'} — the documented 202 {data:{paymentInitiationReversalID, taskID}} is NEVER returned and NO reversal adjustment is recorded (GET .../adjustments shows only the initiation's own creation adjustment). Root cause (from code): Temporal 'WorkflowId length exceeds limit' on the reverse-payout workflow id (engine.go ReversePayout builds the id from reverse-payout-<stack>-<CreatedAt> + connectorID + reversal.ID; the connectorID blob dominates → overflow). NOT fixable by shortening the request reference. Adjudicate as a bug-gap at verify.]

### Requirement: FPY-C02-R03 — Reverse is requested with a malformed/invalid payment initiation id (not a valid PaymentInitiationID)

When the reverse is requested with a malformed/invalid payment initiation id (not a valid PaymentInitiationID), the system SHALL reject it with 400 INVALID_ID and not start a reversal. [CRAWL-CONFIRMED: POST /v3/payment-initiations/not-a-valid-id/reverse → 400 {errorCode:INVALID_ID, errorMessage:'invalid character ... looking for beginning of value' (base64-decode failure)}.]

_Source: `payments/internal/api/v3/handler_payment_initiations_reverse.go:38-43`_ · _Reference test: `sandbox/e2e/scenarios/payment-initiation-reverse/PIR-validation-guards.spec.ts`_

#### Scenario: Reverse is requested with a malformed/invalid payment initiation id (not a valid PaymentInitiationID)

- GIVEN the Ops Engineer in the “Reverse a payment initiation” flow
- WHEN the reverse is requested with a malformed/invalid payment initiation id (not a valid PaymentInitiationID)
- THEN the system shall reject it with 400 INVALID_ID and not start a reversal. [CRAWL-CONFIRMED: POST /v3/payment-initiations/not-a-valid-id/reverse → 400 {errorCode:INVALID_ID, errorMessage:'invalid character ... looking for beginning of value' (base64-decode failure)}.]

### Requirement: FPY-C02-R04 — Reverse body is missing a required field (reference

When the reverse body is missing a required field (reference, amount, or asset), the system SHALL reject it with 400 VALIDATION. [CRAWL-CONFIRMED: POST .../reverse omitting amount → 400 {errorCode:VALIDATION, errorMessage:'Amount is a required field'}.]

_Source: `payments/internal/api/v3/handler_payment_initiations_reverse.go:18-23`, `payments/internal/api/v3/handler_payment_initiations_reverse.go:53-58`_ · _Reference test: `sandbox/e2e/scenarios/payment-initiation-reverse/PIR-validation-guards.spec.ts`_

#### Scenario: Reverse body is missing a required field (reference

- GIVEN the Ops Engineer in the “Reverse a payment initiation” flow
- WHEN the reverse body is missing a required field (reference
- THEN amount, or asset), the system shall reject it with 400 VALIDATION. [CRAWL-CONFIRMED: POST .../reverse omitting amount → 400 {errorCode:VALIDATION, errorMessage:'Amount is a required field'}.]

### Requirement: FPY-C02-R05 — Reverse body carries an invalid asset (fails the asset format validator)

When the reverse body carries an invalid asset (fails the asset format validator), the system SHALL reject it with 400 VALIDATION. [CRAWL-CONFIRMED: POST .../reverse with asset 'NOTANASSET' → 400 {errorCode:VALIDATION, errorMessage:'Asset is invalid'}.]

_Source: `payments/internal/api/v3/handler_payment_initiations_reverse.go:22-22`_ · _Reference test: `sandbox/e2e/scenarios/payment-initiation-reverse/PIR-validation-guards.spec.ts`_

#### Scenario: Reverse body carries an invalid asset (fails the asset format validator)

- GIVEN the Ops Engineer in the “Reverse a payment initiation” flow
- WHEN the reverse body carries an invalid asset (fails the asset format validator)
- THEN the system shall reject it with 400 VALIDATION. [CRAWL-CONFIRMED: POST .../reverse with asset 'NOTANASSET' → 400 {errorCode:VALIDATION, errorMessage:'Asset is invalid'}.]

### Requirement: FPY-C02-R06 — Reverse targets a well-formed but non-existent payment initiation id (valid id encoding

When the reverse targets a well-formed but non-existent payment initiation id (valid id encoding, no such initiation), the system SHALL reject it with 404 NOT_FOUND and record no reversal. [CRAWL-CONFIRMED 2026-06-24: POST /v3/payment-initiations/<well-formed non-existent id>/reverse {reference,amount,asset} → 404 {errorCode:NOT_FOUND, errorMessage:'cannot get payment initiation: not found'}. Note: the not-found check fires BEFORE the reverse workflow construction, so this path returns a clean 404 — unlike PIR-S1 where a VALID initiation hits the 500 WorkflowId-overflow bug.]

_Source: `payments/internal/api/v3/handler_payment_initiations_reverse.go:60-90`_ · _Reference test: `sandbox/e2e/scenarios/payment-initiation-reverse/PIR-S5-nonexistent.spec.ts`_

#### Scenario: Reverse targets a well-formed but non-existent payment initiation id (valid id encoding

- GIVEN the Ops Engineer in the “Reverse a payment initiation” flow
- WHEN the reverse targets a well-formed but non-existent payment initiation id (valid id encoding
- THEN no such initiation), the system shall reject it with 404 NOT_FOUND and record no reversal. [CRAWL-CONFIRMED 2026-06-24: POST /v3/payment-initiations/<well-formed non-existent id>/reverse {reference,amount,asset} → 404 {errorCode:NOT_FOUND, errorMessage:'cannot get payment initiation: not found'}. Note: the not-found check fires BEFORE the reverse workflow construction, so this path returns a clean 404 — unlike PIR-S1 where a VALID initiation hits the 500 WorkflowId-overflow bug.]
