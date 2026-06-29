Feature: Forward Bank Account — non-existent bank account (BF-S5)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # Forwarding a valid-shaped but unknown bank account id resolves to a clean
  # 404 NOT_FOUND before any forward task is started.

  Background:
    Given the Formance Payments stack is running

  Scenario: Forwarding a bank account that does not exist is rejected as not found
    When I forward a well-formed but non-existent bank account to a known connector
    Then the request is rejected with a 404 not-found error
