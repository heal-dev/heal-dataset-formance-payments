Feature: Create Payment Initiation — validation guards (PIC-S3, PIC-S4, PIC-S5)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # Each request is otherwise valid except for the one field under test, so the
  # 400 VALIDATION isolates that guard.

  Background:
    Given the Formance Payments stack is running with an installed connector and a polled internal account

  Scenario: Initiating without a destination account is rejected
    When I initiate a payment without a destinationAccountID
    Then the request is rejected with 400 and a VALIDATION error that destinationAccountID is required

  Scenario: Initiating with a scheduled date in the past is rejected
    When I initiate a payment with a scheduledAt in the past
    Then the request is rejected with 400 and a VALIDATION error that scheduledAt must be in the future

  Scenario: Initiating with an unknown payment type is rejected
    When I initiate a payment with a type that is not TRANSFER or PAYOUT
    Then the request is rejected with 400 and a VALIDATION error that the type is invalid
