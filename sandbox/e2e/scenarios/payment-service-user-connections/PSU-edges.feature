Feature: Payment Service User — edges (PSU-S2 missing name, PSU-S3 delete)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).

  Background:
    Given the Formance Payments stack is running

  Scenario: Creating a PSU without a name is rejected
    When I create a payment service user without a name
    Then the request is rejected with 400 and a VALIDATION error that name is required

  Scenario: Deleting a PSU removes it from the list
    Given a registered payment service user
    When I delete the payment service user
    Then the delete is accepted and the PSU no longer appears in the list
