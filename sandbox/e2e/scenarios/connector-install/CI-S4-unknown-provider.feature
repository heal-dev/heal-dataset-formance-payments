Feature: Install Connector — unknown provider (CI-S4)
  # VERIFY: asserts on the payments API surface (Console UI 500s — setup-gap SG01).
  # KNOWN DIVERGENCE: installing for an unknown provider currently returns 500
  # INTERNAL; the intended behavior is a 4xx client error (the provider does not
  # exist). This test asserts the intended 4xx and is EXPECTED RED until the
  # product is fixed — the red is the evidence (candidate bug), adjudicated at
  # verify. Do not weaken it.

  Background:
    Given the Formance Payments stack is running

  Scenario: Installing for an unknown provider is rejected as a client error, not a server error
    When I install a connector for the unknown provider "nosuchprovider" with a valid name
    Then the request is rejected with a 4xx client error, not a 500 server error
