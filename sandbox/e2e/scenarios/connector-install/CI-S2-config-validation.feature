Feature: Install Connector — config validation guard (CI-S2)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).

  Background:
    Given the Formance Payments stack is running

  Scenario: Installing with a config missing required fields is rejected with a validation error
    When I install a "dummypay" connector with an empty config "{}"
    Then the request is rejected with 400 and a VALIDATION error naming the required field

    When I install a "dummypay" connector with only a name and no directory
    Then the request is rejected with 400 and a VALIDATION error naming the required directory
