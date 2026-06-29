Feature: Account Polling — read-by-id guards (AP-S4, AP-S5)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # The accounts the worker polls in are read back by id; a malformed id is a 400
  # INVALID_ID and a well-formed unknown id is a 404 NOT_FOUND.

  Background:
    Given the Formance Payments stack is running

  Scenario: Fetching an account by a malformed id is rejected as an invalid id
    When I fetch an account by a malformed account id
    Then the request is rejected with a 400 invalid-id error

  Scenario: Fetching a non-existent account is rejected as not found
    When I fetch an account by a well-formed but non-existent account id
    Then the request is rejected with a 404 not-found error
