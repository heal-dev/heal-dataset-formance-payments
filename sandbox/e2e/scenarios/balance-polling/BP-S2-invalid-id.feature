Feature: Balance Polling — invalid account id guard (BP-S2)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).

  Background:
    Given the Formance Payments stack is running

  Scenario: Requesting balances for a malformed account id is rejected
    When I request balances for a malformed account id
    Then the request is rejected with 400 and a VALIDATION error
