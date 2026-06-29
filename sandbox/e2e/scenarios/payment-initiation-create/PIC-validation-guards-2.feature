Feature: Create Payment Initiation — further checks (PIC-S6, PIC-S7, PIC-S8)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # The create request validates the reference length (3..1000) and the asset
  # format. The amount has no sign/min guard, so a negative amount is accepted —
  # PIC-S8 documents that current behaviour (a likely product gap, flagged at verify).

  Background:
    Given the Formance Payments stack is running
    And a connector is installed and its internal accounts have been polled

  Scenario: Initiating with a reference shorter than 3 characters is rejected
    When I initiate a transfer whose reference is only 2 characters long
    Then the request is rejected with a 400 validation error naming the Reference field

  Scenario: Initiating with an invalid asset is rejected
    When I initiate a transfer with an asset that is not a valid asset
    Then the request is rejected with a 400 validation error naming the Asset field

  Scenario: Initiating with a negative amount is currently accepted
    When I initiate a transfer with a negative amount
    Then the request is accepted with 202 and a payment initiation id is returned
