Feature: Create Payment Initiation (Transfer/Payout)
  As an Ops Engineer, I initiate a transfer between two internal accounts so that
  money movement is requested and recorded as a payment initiation.

  # VERIFY: asserts on the payments API surface the Console calls (Console UI 500s
  # — setup-gap SG01). The create returns {data:{paymentInitiationID, taskID}};
  # with a future scheduledAt the initiation is recorded (status
  # WAITING_FOR_VALIDATION) — the flow asserts it is RECORDED as a TRANSFER, not a
  # "succeeded" status. Reference is kept SHORT (Temporal WorkflowId length limit).

  Background:
    Given the Formance Payments stack is running with the dummypay fixtures mounted at "/dummypay"

  Scenario: Initiate a transfer between two internal accounts
    Given an installed "dummypay" connector whose two internal accounts have been polled
    When I initiate a TRANSFER from the "Heal Dummy Checking" account to the "Heal Dummy Savings" account with a future scheduled date
    Then the request is accepted and a payment initiation id is returned
    And the new payment initiation appears in the payment-initiations list with type TRANSFER
