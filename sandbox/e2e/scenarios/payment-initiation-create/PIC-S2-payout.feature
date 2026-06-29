Feature: Create Payment Initiation — payout to an external account (PIC-S2)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # A PAYOUT needs an EXTERNAL destination, so the bank account is forwarded to the
  # connector first; the payout is recorded (status WAITING_FOR_VALIDATION).

  Background:
    Given the Formance Payments stack is running with the dummypay fixtures mounted at "/dummypay"

  Scenario: Initiate a payout from an internal account to a forwarded external account
    Given an installed "dummypay" connector with a polled internal account and a forwarded external account
    When I initiate a PAYOUT from the internal account to the external account with a future scheduled date
    Then the request is accepted and a payment initiation id is returned
    And the new payment initiation appears in the payment-initiations list with type PAYOUT
