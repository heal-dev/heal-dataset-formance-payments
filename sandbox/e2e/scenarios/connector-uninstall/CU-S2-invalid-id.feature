Feature: Uninstall Connector — invalid connector id (CU-S2)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).

  Background:
    Given the Formance Payments stack is running

  Scenario: Uninstalling with an invalid connector id is rejected
    When I uninstall a connector using a malformed connector id
    Then the request is rejected with 400 and an INVALID_ID error
