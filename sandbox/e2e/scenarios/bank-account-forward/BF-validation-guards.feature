Feature: Forward Bank Account — validation guards (BF-S2, BF-S3, BF-S4)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).

  Background:
    Given the Formance Payments stack is running with a registered bank account

  Scenario: Forwarding with a malformed bank account id is rejected
    When I forward using a malformed bank account id
    Then the request is rejected with 400 and an INVALID_ID error

  Scenario: Forwarding without a connectorID is rejected
    When I forward a bank account without a connectorID
    Then the request is rejected with 400 and a VALIDATION error that connectorID is required

  Scenario: Forwarding to a non-existent connector is rejected as not found
    When I forward a bank account to a well-formed but non-existent connectorID
    Then the request is rejected with 404 NOT_FOUND
    And forwarding to a malformed connectorID is rejected with 400 VALIDATION
