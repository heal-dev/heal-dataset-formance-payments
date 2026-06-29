Feature: Install Connector — malformed request body (CI-S3)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # KNOWN DIVERGENCE: a malformed JSON body currently returns 500 INTERNAL; the
  # intended behavior is a 400 Bad Request. This test asserts the intended 400 and
  # is EXPECTED RED until the product is fixed — the red is the evidence (candidate
  # bug), adjudicated at verify. Do not weaken it.

  Background:
    Given the Formance Payments stack is running

  Scenario: Installing with a malformed JSON body is rejected as a client error, not a server error
    When I install a "dummypay" connector with a malformed JSON body
    Then the request is rejected with a 4xx client error, not a 500 server error
