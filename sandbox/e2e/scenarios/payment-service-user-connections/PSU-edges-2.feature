Feature: Payment Service User Connections — further guards (PSU-S5..PSU-S8)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # PSU create validates the contact email and each bankAccountID; get and delete
  # both 404 for a well-formed but unknown PSU id.

  Background:
    Given the Formance Payments stack is running

  Scenario: Creating a PSU with an invalid email is rejected
    When I create a payment service user with an invalid contact email
    Then the request is rejected with a 400 validation error naming the Email field

  Scenario: Creating a PSU with a malformed bank account id is rejected
    When I create a payment service user whose bankAccountIDs contains a non-UUID
    Then the request is rejected with a 400 validation error naming the BankAccountIDs field

  Scenario: Fetching a non-existent PSU is rejected as not found
    When I fetch a well-formed but non-existent payment service user id
    Then the request is rejected with a 404 not-found error

  Scenario: Deleting a non-existent PSU is rejected as not found
    When I delete a well-formed but non-existent payment service user id
    Then the request is rejected with a 404 not-found error
