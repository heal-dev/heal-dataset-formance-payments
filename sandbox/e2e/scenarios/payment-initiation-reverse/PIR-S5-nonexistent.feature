Feature: Reverse Payment Initiation — non-existent initiation (PIR-S5)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # The not-found lookup fires before the reverse workflow is built, so reversing
  # an unknown initiation returns a clean 404 (distinct from PIR-S1, where a VALID
  # initiation hits the 500 WorkflowId-overflow bug).

  Background:
    Given the Formance Payments stack is running

  Scenario: Reversing a payment initiation that does not exist is rejected as not found
    When I reverse a well-formed but non-existent payment initiation
    Then the request is rejected with a 404 not-found error
