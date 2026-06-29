Feature: Webhook Events — non-existent connector (WE-S4)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # A webhook for a well-formed but unknown connector resolves to a clean 404,
  # distinct from WE-S3 where an existing-but-unconfigured connector 500s.

  Background:
    Given the Formance Payments stack is running

  Scenario: Posting a webhook to a connector that does not exist is rejected as not found
    When a webhook event is posted to a well-formed but non-existent connector id
    Then the request is rejected with a 404 not-found error
