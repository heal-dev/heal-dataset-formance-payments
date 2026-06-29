Feature: Create Bank Account — further validation guards (BC-S5, BC-S6, BC-S7)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # The create request validates the country code, the IBAN length (15..31), and
  # the SWIFT/BIC length (8..11); each violation is a 400 validation error.

  Background:
    Given the Formance Payments stack is running

  Scenario: Creating a bank account with an invalid country code is rejected
    When I create a bank account with a valid IBAN but country code "XX"
    Then the request is rejected with a 400 validation error naming the Country field

  Scenario: Creating a bank account with an over-long IBAN is rejected
    When I create a bank account with an IBAN longer than 31 characters
    Then the request is rejected with a 400 validation error naming the IBAN field

  Scenario: Creating a bank account with a too-short SWIFT/BIC code is rejected
    When I create a bank account with a swiftBicCode shorter than 8 characters
    Then the request is rejected with a 400 validation error naming the SwiftBicCode field
