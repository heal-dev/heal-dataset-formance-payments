Feature: Create Bank Account — validation guards (BC-S2, BC-S3, BC-S4)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).

  Background:
    Given the Formance Payments stack is running

  Scenario: A bank account without a name is rejected
    When I create a bank account with an IBAN but no name
    Then the request is rejected with 400 and a VALIDATION error that name is required

  Scenario: A bank account with neither an account number nor an IBAN is rejected
    When I create a bank account with only a name
    Then the request is rejected with 400 and a VALIDATION error that an account number is required

  Scenario: A bank account with an IBAN shorter than 15 characters is rejected
    When I create a bank account with a name and a too-short IBAN
    Then the request is rejected with 400 and a VALIDATION error about the IBAN length
