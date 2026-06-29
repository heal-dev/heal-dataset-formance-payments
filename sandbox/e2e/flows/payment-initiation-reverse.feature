Feature: Reverse Payment Initiation
  As an Ops Engineer, I reverse an existing payment initiation so that the
  requested money movement is undone and the reversal is recorded as an adjustment.

  # VERIFY: asserts on the payments API surface the Console calls (Console UI 500s
  # — setup-gap SG01). This claim asserts the DOCUMENTED behaviour (202 + reversal
  # adjustment). The product currently returns 500 INTERNAL (Temporal WorkflowId
  # length overflow) — so this test is EXPECTED to go red; that red is the bug-gap
  # evidence the verify step adjudicates. The assertion is NOT weakened to green.

  Background:
    Given the Formance Payments stack is running with the dummypay fixtures mounted at "/dummypay"

  Scenario: Reverse an existing payment initiation
    Given an installed "dummypay" connector with a created TRANSFER payment initiation
    When I reverse the payment initiation with a valid reference, amount and asset
    Then the request is accepted and a payment initiation reversal id is returned
    And the reversal is recorded as an adjustment against the payment initiation
