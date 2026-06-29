Feature: Account Pool & Balance Aggregation
  As an Ops Engineer, I install a connector, group its fetched accounts into a
  pool, and query the pool's aggregate balances so I see total holdings per asset.

  # VERIFY: The Console v3 UI 500s on every /connectivity/* page (useRouteGuard
  # bug — setup-gap SG01), so this journey asserts on the payments API surface the
  # Console itself calls (/api/payments via the gateway): the real install, real
  # worker poll, real pool create, and real aggregate-balance query. Payments is SUT.

  Background:
    Given the Formance Payments stack is running with the dummypay fixtures mounted at "/dummypay"

  Scenario: Install a connector, pool its accounts, and read aggregate balances
    When I install a "dummypay" connector named "heal-pool-<ns>" pointing at the "/dummypay" directory
    Then the connector appears in the list of installed connectors

    When the worker polls the connector on install
    Then the two internal accounts "heal-dummy-acct-001" and "heal-dummy-acct-002" are available

    When I create a pool grouping both accounts
    Then the pool appears in the list of pools

    When I query the pool's latest balances
    Then the aggregate shows 1500000 in USD/2 and 2750000 in EUR/2
