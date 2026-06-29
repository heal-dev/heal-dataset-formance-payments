Feature: Balance Polling — list-endpoint behaviours (BP-S3, BP-S4)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # Balances is a list endpoint: an unknown account yields an empty page (200),
  # and an invalid pageSize query param is a 400 validation error.

  Background:
    Given the Formance Payments stack is running

  Scenario: Requesting balances for an unknown account returns an empty result
    When I request balances for a well-formed but non-existent account id
    Then the response is 200 with an empty balances list

  Scenario: Requesting balances with an invalid pageSize is rejected
    When I request balances with a pageSize that is not a number
    Then the request is rejected with a 400 validation error
