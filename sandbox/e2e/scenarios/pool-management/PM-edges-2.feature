Feature: Pool Management — further guards (PM-S4, PM-S5, PM-S6, PM-S7)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # Pool create validates each accountID; pool get and pool balances both 404 for an
  # unknown pool and 400 for a malformed id.

  Background:
    Given the Formance Payments stack is running

  Scenario: Creating a pool with a malformed account id is rejected
    When I create a static pool whose accountIDs contains a malformed account id
    Then the request is rejected with a 400 validation error

  Scenario: Fetching a non-existent pool is rejected as not found
    When I fetch a well-formed but non-existent pool id
    Then the request is rejected with a 404 not-found error

  Scenario: Fetching latest balances for a non-existent pool is rejected as not found
    When I request latest balances for a well-formed but non-existent pool id
    Then the request is rejected with a 404 not-found error

  Scenario: Fetching a pool by a malformed id is rejected as an invalid id
    When I fetch a pool by a malformed pool id
    Then the request is rejected with a 400 invalid-id error
