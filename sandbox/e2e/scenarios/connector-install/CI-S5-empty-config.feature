Feature: Install Connector — empty configuration (CI-S5)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # An empty JSON object {} carries none of the provider's required config fields,
  # so provider config validation rejects it on the required Name field.

  Background:
    Given the Formance Payments stack is running

  Scenario: Installing a connector with an empty configuration is rejected as a validation error
    When I install a "dummypay" connector with an empty {} configuration
    Then the request is rejected with a 400 validation error naming the missing required field
