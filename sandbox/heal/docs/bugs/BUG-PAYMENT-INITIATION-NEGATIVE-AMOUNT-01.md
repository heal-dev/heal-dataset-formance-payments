## Bug: Payment initiation accepts a negative amount (no sign/min-value guard)

> Found by: heal cover loop — payment-initiation-create edge-case pass

**Symptom.** POST /v3/payment-initiations with amount:-100 returns 202 Accepted and records a payment initiation, instead of rejecting the negative amount.

**Repro.**
1. Install a connector and let its accounts poll
2. POST /v3/payment-initiations with a valid body but amount:-100
3. Observe 202 Accepted instead of a 400 validation error

**Expected.** A negative (or zero) amount should be rejected with 400 VALIDATION; a payment initiation amount must be greater than zero.

**Actual.** HTTP 202 {data:{paymentInitiationID:<base64>, taskID:''}} — the initiation is recorded with a negative amount.

**Evidence.** PIC-validation-guards-2.spec.ts PIC-S8 asserts the current 202 behaviour (green); the divergence from intended validation is documented here as a candidate gap.

**Likely location.**
- payments/internal/api/v3/handler_payment_initiations_create.go:24

**Hypothesis.** The Amount field is validated only as 'required' (validate:\"required\") with no gt=0 / min guard, so any *big.Int including negatives passes validation.

