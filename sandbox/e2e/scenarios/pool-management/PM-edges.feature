Feature: Pool Management — edges (PM-S2 missing name, PM-S3 delete)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).

  Background:
    Given the Formance Payments stack is running with an installed connector and polled internal accounts

  Scenario: Creating a pool without a name is rejected
    When I create a pool without a name
    Then the request is rejected with 400 and a VALIDATION error that name is required

  Scenario: Deleting a pool removes it from the list
    Given a pool grouping the two internal accounts
    When I delete the pool
    Then the delete is accepted and the pool no longer appears in the pools list
