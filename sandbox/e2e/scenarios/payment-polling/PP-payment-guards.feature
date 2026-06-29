Feature: Payment Polling — read guards and status filter (PP-S3, PP-S4, PP-S5)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # Polled payments are read back by id (malformed → 400, unknown → 404) and the
  # list is filterable by status.

  Background:
    Given the Formance Payments stack is running

  Scenario: Fetching a payment by a malformed id is rejected as an invalid id
    When I fetch a payment by a malformed payment id
    Then the request is rejected with a 400 invalid-id error

  Scenario: Fetching a non-existent payment is rejected as not found
    When I fetch a payment by a well-formed but non-existent payment id
    Then the request is rejected with a 404 not-found error

  Scenario: Filtering the payments list by status narrows the results
    When I list payments filtered to status "SUCCEEDED"
    Then every returned payment has status "SUCCEEDED" and the seeded payment is present
    And the seeded payment is absent when filtering to status "FAILED"
