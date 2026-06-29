Feature: Uninstall Connector — non-existent connector (CU-S3)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # KNOWN DIVERGENCE: uninstalling a well-formed but non-existent connector id
  # currently returns 500 INTERNAL; the intended behavior is a clean 4xx (e.g. 404).
  # This test asserts the intended 4xx and is EXPECTED RED until the product is
  # fixed — the red is the evidence (candidate bug), adjudicated at verify.

  Background:
    Given the Formance Payments stack is running

  Scenario: Uninstalling a connector that does not exist is rejected as a client error, not a server error
    When I uninstall a connector whose id is well-formed but does not exist
    Then the request is rejected with a 4xx client error, not a 500 server error
