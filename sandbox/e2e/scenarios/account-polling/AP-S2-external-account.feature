Feature: Account Polling — external account fetched after forward (AP-S2)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # A forwarded bank account surfaces as an EXTERNAL account on the connector.

  Background:
    Given the Formance Payments stack is running with an installed "dummypay" connector

  Scenario: A forwarded bank account is fetched as an external account
    Given I create a bank account and forward it to the connector
    When the worker fetches external accounts
    Then an account with type EXTERNAL appears in the accounts list for the connector
