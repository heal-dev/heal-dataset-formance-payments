Feature: Install Connector — oversized request body (CI-S6)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # The connector config body is capped at 500000 bytes; a larger body is rejected
  # with 413 Request Entity Too Large before any install is attempted.

  Background:
    Given the Formance Payments stack is running

  Scenario: Installing a connector with a body over the size limit is rejected as too large
    When I install a "dummypay" connector with a configuration body larger than the 500000-byte limit
    Then the request is rejected with a 413 Request Entity Too Large error
