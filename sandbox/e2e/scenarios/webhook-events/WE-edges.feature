Feature: Webhook Events — inbound endpoint edges (WE-S2 invalid id, WE-S3 no-config 500)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # The webhook happy path (WE-S1) is blocked by setup-gap SG03 (dummypay has no
  # webhook support) and is handled at verify, not authored here.

  Background:
    Given the Formance Payments stack is running

  Scenario: Posting a webhook to a malformed connector id is rejected
    When I post a webhook to a malformed connector id
    Then the request is rejected with 400 and an INVALID_ID error

  Scenario: Posting a webhook to a connector with no webhook configuration currently errors
    Given an installed "dummypay" connector that registers no webhook handler
    When I post a webhook event to that connector's webhook endpoint
    Then the system currently returns 500 INTERNAL (candidate bug — a typed 4xx is expected)
