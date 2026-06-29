Feature: Payment Service User Connections — create and manage a PSU
  As an Ops Engineer, I register a payment service user (PSU) so that I can later
  connect it to providers and manage its bank accounts.

  # VERIFY: asserts on the payments API surface the Console calls (Console UI 500s
  # — setup-gap SG01). The Open-Banking connection arcs (PSU-S4) need an OB-capable
  # connector the sandbox lacks (setup-gap SG04) and are not covered here.

  Background:
    Given the Formance Payments stack is running

  Scenario: Register a payment service user and read it back
    When I create a payment service user named "Heal Managed PSU" with a contact email
    Then the PSU is created with an id and appears in the payment service users list
    And fetching the PSU returns its name and contact details
