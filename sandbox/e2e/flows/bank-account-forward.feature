Feature: Forward Bank Account
  As an Ops Engineer, I forward a registered bank account to a connector so it
  becomes a usable external account on the PSP for payouts.

  # VERIFY: asserts on the payments API surface the Console calls (Console UI 500s
  # — setup-gap SG01). Forwarding is async: it returns a taskID and the external
  # account appears once the task completes.

  Background:
    Given the Formance Payments stack is running with the dummypay fixtures mounted at "/dummypay"

  Scenario: Forward a bank account and see an external account appear
    Given an installed "dummypay" connector and a registered bank account
    When I forward the bank account to the connector
    Then the request is accepted and a taskID is returned
    And an external account for the connector becomes available
