## Bug: Reverse payment initiation returns HTTP 500 — reverse-payout Temporal WorkflowId exceeds the length limit

> Repo: payments · Found by: cover-loop verify-feature (payment-initiation-reverse); related to BUG-PAYOUT-REVERSE-01

**Symptom.** POST /v3/payment-initiations/{id}/reverse on a valid initiation with a valid body returns HTTP 500 {errorCode:INTERNAL} instead of the documented 202; no reversal adjustment is ever recorded. The reverse-payment-initiation feature is entirely non-functional via the API (and the Console, which calls this endpoint).

**Repro.**
1. Install a dummypay connector and let the worker poll its two internal accounts.
2. Create a TRANSFER payment initiation (POST /v3/payment-initiations) and capture its paymentInitiationID.
3. POST /v3/payment-initiations/{paymentInitiationID}/reverse with {reference:'short', amount, asset}.
4. Observe HTTP 500 INTERNAL instead of 202; GET .../adjustments shows no reversal adjustment.

**Expected.** HTTP 202 Accepted with body {data:{paymentInitiationReversalID, taskID}}, and the reversal recorded as an adjustment visible in GET /v3/payment-initiations/{id}/adjustments. This is the coded contract (handler_payment_initiations_reverse.go calls api.Accepted with {paymentInitiationReversalID, taskID}) and a documented supported operation (QA_PLAYBOOK.MD lines 20-21, Reverse a Payout/Transfer).

**Actual.** HTTP 500 {"errorCode":"INTERNAL","errorMessage":"Internal error. Consult logs/traces to have more details."}. GET /v3/payment-initiations/{id}/adjustments shows only the initiation's own creation adjustment — no reversal row.

**Evidence.** e2e/flows/payment-initiation-reverse.spec.ts fails at expect(res.status()).toBe(202) with 'reverse 500: {"errorCode":"INTERNAL",...}'. Independently crawl-confirmed 2026-06-24. The 3 validation guards (PIR-S2/S3/S4) pass — only the reverse workflow itself is broken.

**Likely location.**
- payments/internal/connectors/engine/engine.go (reverse-payout WorkflowId construction + StartWorkflowOptions)
- payments/internal/api/v3/handler_payment_initiations_reverse.go:60-90 (intended 202 contract)
- payments/QA_PLAYBOOK.MD:20-21 (documented support)

**Hypothesis.** engine.go ReversePayout builds the Temporal WorkflowId from fmt.Sprintf("reverse-payout-%s-%s", stack, reversal.CreatedAt) + reversal.ConnectorID + reversal.ID (which itself re-embeds the connectorID), then passes it as StartWorkflowOptions{ID}. The connectorID blob makes the derived id overflow Temporal's WorkflowId length limit; Temporal rejects ExecuteWorkflow, the error propagates through backend.PaymentInitiationReversalsCreate, and handleServiceErrors maps the unclassified error to 500 INTERNAL. NOT fixable by shortening the request reference — the connectorID dominates the length. Same root cause as BUG-PAYOUT-REVERSE-01 (filed at journey level from payout-to-external-account).

