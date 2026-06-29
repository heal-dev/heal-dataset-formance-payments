Feature: Account Polling
  As an Ops Engineer, I install a connector so that the worker fetches the
  connector's accounts from the PSP and they become visible in the accounts list.

  # VERIFY: asserts on the payments API surface the Console calls (Console UI 500s
  # — setup-gap SG01). The worker polls on install; the fixture internal accounts
  # surface within ~1-2s with type INTERNAL and their seeded asset.

  Background:
    Given the Formance Payments stack is running with the dummypay fixtures mounted at "/dummypay"

  Scenario: The worker polls the connector's internal accounts on install
    Given I install a "dummypay" connector pointing at the mounted fixtures
    When the worker polls the connector on install
    Then the "Heal Dummy Checking" account appears in the accounts list with type INTERNAL and asset USD/2
    And the "Heal Dummy Savings" account appears in the accounts list with type INTERNAL and asset EUR/2
