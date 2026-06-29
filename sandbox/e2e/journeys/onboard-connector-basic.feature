Feature: Connector Installation & Discovery
  As an Ops Engineer operating Formance Payments, I install a connector so the
  system begins polling the PSP, and I confirm its accounts and balances are
  discovered.

  # VERIFY: The Console v3 UI (console-v3 v2.6.2/v2.5.3) 500s on every /connectivity/*
  # page due to a useRouteGuard/Header tiny-invariant bug (setup-gap SG01), so this
  # journey asserts on the payments API surface the Console itself calls
  # (/api/payments via the gateway) — the real install + real worker poll, read back
  # through the same API. The payments service is the SUT; the Console is the broken
  # third-party frontend, kept out of the assertion path.

  Background:
    Given the Formance Payments stack is running with the dummypay fixtures mounted at "/dummypay"

  Scenario: Install a connector and discover its accounts and balances
    When I install a "dummypay" connector named "heal-dummypay-<ns>" pointing at the "/dummypay" directory
    Then the connector appears in the list of installed connectors

    When the worker polls the connector on install
    Then the two fixture accounts "heal-dummy-acct-001" (USD/2) and "heal-dummy-acct-002" (EUR/2) are discovered for that connector

    When the worker polls the discovered internal accounts' balances
    Then the balance of "heal-dummy-acct-001" reads 1500000 in USD/2
