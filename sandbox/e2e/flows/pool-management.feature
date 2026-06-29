Feature: Pool Management
  As an Ops Engineer, I group several accounts into a pool so that I can see
  their aggregate balances per asset.

  # VERIFY: asserts on the payments API surface the Console calls (Console UI 500s
  # — setup-gap SG01). The pool is created live over the connector's polled internal
  # accounts; balances/latest returns the per-asset aggregate of the members.

  Background:
    Given the Formance Payments stack is running with the dummypay fixtures mounted at "/dummypay"

  Scenario: Create a pool and read its aggregate balances
    Given an installed "dummypay" connector whose two internal accounts have been polled
    When I create a pool grouping the "Heal Dummy Checking" and "Heal Dummy Savings" accounts
    Then the pool is created with an id and appears in the pools list
    And the pool's latest balances show USD/2 totalling 1500000 and EUR/2 totalling 2750000
