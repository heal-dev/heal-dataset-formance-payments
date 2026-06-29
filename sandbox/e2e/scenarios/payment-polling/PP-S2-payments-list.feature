Feature: Payment Polling — payments are queryable (PP-S2)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # This covers the payments LIST/query surface. The polling-ingestion happy path
  # (PP-S1) is blocked by setup-gap SG02 (dummypay's plugin facade never ingests
  # payments) and is handled at verify, not authored here.

  Background:
    Given the Formance Payments stack is running with the golden seed applied

  Scenario: The payments list returns recorded payments with their fields
    When I list the payments
    Then the seeded "HEAL-SEED-PAYMENT-0001" payment appears with type PAY-IN, status SUCCEEDED and asset USD/2
