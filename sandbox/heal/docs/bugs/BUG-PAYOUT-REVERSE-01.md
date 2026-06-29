## Bug: Reversing a payout returns HTTP 500 — reverse-payout Temporal WorkflowId exceeds the length limit

Found by [heal.dev](https://www.heal.dev/)

> Repo: payments · Found by: heal E2E — journey payout-to-external-account

**Symptom.** Reversing a payout always fails: POST /v3/payment-initiations/{id}/reverse returns HTTP 500 {"errorCode":"INTERNAL"}. The reversal feature is unusable for dummypay (and likely any connector whose connector id is long), so a created payout can never be reversed via the API.

**Repro.**

1. Install a dummypay connector (POST /v3/connectors/install/dummypay {name, pollingPeriod:'30m', directory:'/dummypay'}).
2. Wait for the worker to poll; take an internal account (reference heal-dummy-acct-001) as the source.
3. Create a bank account (POST /v3/bank-accounts) and forward it to the connector (POST /v3/bank-accounts/{id}/forward {connectorID}); it surfaces as an EXTERNAL account.
4. Initiate a payout (POST /v3/payment-initiations?noValidation=true {type:'PAYOUT', amount:1000, asset:'USD/2', sourceAccountID, destinationAccountID, scheduledAt:<future>}); it is recorded with status SCHEDULED_FOR_PROCESSING.
5. Reverse it: POST /v3/payment-initiations/{paymentInitiationID}/reverse {reference:'hpor-x', amount:1000, asset:'USD/2', description:'...'}.

**Expected.** The reverse call is accepted (202) and a reversal adjustment is recorded against the payment initiation (per openapi V3ReversePaymentInitiationRequest and QA_PLAYBOOK 'Reverse a Payout').

**Actual.** HTTP 500 {"errorCode":"INTERNAL","errorMessage":"Internal error. Consult logs/traces to have more details."}. The payments API server log emits "WorkflowId length exceeds limit." at the moment of the reverse call. Fails identically with and without a metadata field, and with a short request reference.

**Evidence.** expect(res.ok()) failed: reverse returned 500 {"errorCode":"INTERNAL"} (e2e/journeys/payout-to-external-account.spec.ts:154). Steps 1–5 of the journey pass; only the reverse step is red. Server log: level=error msg="WorkflowId length exceeds limit." correlated in time with the reverse POST. Temporal starts the reverse-payout workflow with this id.

**Likely location.**

- payments/internal/connectors/engine/engine.go:744 — ReversePayout builds the Temporal workflow id: TaskIDReference(fmt.Sprintf("reverse-payout-%s-%s", e.stack, reversal.CreatedAt.String()), reversal.ConnectorID, reversal.ID.String()). reversal.ID.String() (PaymentInitiationReversalID) is base64url(canonicaljson({Reference, ConnectorID})) and re-encodes the already-long connector id; combined with the verbose CreatedAt.String() and the connector id, the resulting WorkflowId overflows Temporal's WorkflowId length limit.
- payments/internal/connectors/engine/engine.go:616 — ReverseTransfer constructs the workflow id the same way (reverse-transfer-...) and is likely affected for long connector ids too.
- payments/internal/api/v3/handler_payment_initiations_reverse.go:64 — backend.PaymentInitiationReversalsCreate is where the failing workflow start originates; the error maps through handleServiceErrors → 500 INTERNAL instead of a typed client error.

**Hypothesis.** The reverse-payout/transfer Temporal WorkflowId is built from reverse-<type>-<stack>-<CreatedAt.String()> + connectorID + reversal.ID.String() (which itself contains the connector id), exceeding Temporal's WorkflowId max length; shorten/hash the id (e.g. drop the duplicated connector id and the full timestamp, or hash the composite) so it fits, and surface the underlying Temporal error as a typed 4xx rather than a generic 500.

**Task.** Reproduce the 500 on payout reversal, confirm the Temporal WorkflowId length overflow as the root cause, fix the reverse-payout (and reverse-transfer) WorkflowId construction so it stays within Temporal's limit for long connector ids, and confirm the journey's reverse step passes. Don't weaken or delete the E2E test that caught this (e2e/journeys/payout-to-external-account.spec.ts).
