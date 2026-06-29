Feature: Reverse Payment Initiation — validation guards (PIR-S2, PIR-S3, PIR-S4)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # Each request is rejected at validation BEFORE the reverse workflow starts, so
  # these guards are unaffected by the reverse-workflow 500 bug (PIR-S1).

  Background:
    Given the Formance Payments stack is running with an existing payment initiation to reverse

  Scenario: Reversing with a malformed payment initiation id is rejected
    When I reverse using a malformed payment initiation id
    Then the request is rejected with 400 and an INVALID_ID error

  Scenario: Reversing without a required amount is rejected
    When I reverse without an amount in the body
    Then the request is rejected with 400 and a VALIDATION error that amount is required

  Scenario: Reversing with an invalid asset is rejected
    When I reverse with an asset that is not a valid asset
    Then the request is rejected with 400 and a VALIDATION error that the asset is invalid
