Feature: Create Bank Account
  As an Ops Engineer, I register an external bank account so I can later forward
  it to a connector and pay out to it.

  # VERIFY: asserts on the payments API surface the Console calls (Console UI 500s
  # — setup-gap SG01). Sensitive fields (iban/accountNumber/swiftBicCode) are
  # encrypted at rest and read back as null, so the flow asserts by id/name/country.

  Background:
    Given the Formance Payments stack is running

  Scenario: Create a bank account with a name and IBAN and see it listed
    When I create a bank account named "Heal BA <ns>" with an IBAN and country "DE"
    Then the bank account is created and an id is returned
    And the bank account appears in the list of bank accounts with name "Heal BA <ns>" and country "DE"
