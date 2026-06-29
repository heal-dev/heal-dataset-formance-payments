Feature: Install Connector
  As an Ops Engineer, I install a PSP connector with its config so the worker
  begins polling the PSP and its accounts/balances flow into Payments.

  # VERIFY: The Console v3 UI 500s on every /connectivity/* page (useRouteGuard
  # bug — setup-gap SG01), so this flow asserts on the payments API surface the
  # Console itself calls (/api/payments via the gateway). The payments service is
  # the SUT.

  Background:
    Given the Formance Payments stack is running with the dummypay fixtures mounted at "/dummypay"

  Scenario: Install a connector for a known provider and see it listed
    When I install a "dummypay" connector named "heal-install-<ns>" pointing at the "/dummypay" directory
    Then the request is accepted and a connector id is returned
    And the connector appears in the list of installed connectors with provider "dummypay"
    And the connector advertises the capabilities FETCH_ACCOUNTS, FETCH_BALANCES, CREATE_TRANSFER and CREATE_PAYOUT
