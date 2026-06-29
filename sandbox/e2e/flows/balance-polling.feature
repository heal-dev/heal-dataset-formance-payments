Feature: Balance Polling
  As an Ops Engineer, I install a connector so that the worker fetches each
  internal account's balance from the PSP and it becomes visible on the account.

  # VERIFY: asserts on the payments API surface the Console calls (Console UI 500s
  # — setup-gap SG01). The worker fetches balances after the accounts are polled;
  # the seeded fixture amounts surface on each account's balances.

  Background:
    Given the Formance Payments stack is running with the dummypay fixtures mounted at "/dummypay"

  Scenario: The worker polls each internal account's balance
    Given I install a "dummypay" connector and its internal accounts are polled
    When the worker fetches the account balances
    Then the "Heal Dummy Checking" account shows a balance of 1500000 in USD/2
    And the "Heal Dummy Savings" account shows a balance of 2750000 in EUR/2
