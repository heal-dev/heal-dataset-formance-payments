Feature: Payout Workflow with Reversal
  As an Ops Engineer, I install a connector, register and forward an external
  bank account, initiate a PAYOUT from an internal account to that external
  account, then reverse the payout so the funds movement is undone and the
  reversal is recorded.

  # VERIFY: The Console v3 UI 500s on every /connectivity/* page (useRouteGuard
  # bug — setup-gap SG01), so this journey asserts on the payments API surface the
  # Console itself calls (/api/payments via the gateway): the real install, the
  # real worker poll, the real bank-account create + forward, the real payout
  # initiation, and the real reversal, read back through the same API. The
  # payments service is the SUT.
  # VERIFY: POST /v3/payment-initiations validates scheduledAt > now (future date
  # required); with ?noValidation=true the initiation is recorded with status
  # SCHEDULED_FOR_PROCESSING. Forwarding a bank account returns 202 and surfaces
  # the account with type EXTERNAL — usable as a payout destination.
  # VERIFY: KNOWN PRODUCT BUG (filed bug-gap) — POST /v3/payment-initiations/{id}/reverse
  # returns HTTP 500 INTERNAL because the reverse-payout Temporal WorkflowId
  # (reverse-payout-<stack>-<CreatedAt> + connectorID + reversal.ID, which itself
  # re-encodes the connectorID) overflows Temporal's WorkflowId length limit. The
  # reverse step asserts success on purpose and is EXPECTED RED until the product
  # is fixed; this red is the evidence, not a flake — do not weaken it.

  Background:
    Given the Formance Payments stack is running with the dummypay fixtures mounted at "/dummypay"

  Scenario: Install a connector, forward an external account, pay out to it, and reverse the payout
    When I install a "dummypay" connector named "heal-payout-<ns>" pointing at the "/dummypay" directory
    Then the connector appears in the list of installed connectors

    When the worker polls the connector on install
    Then the internal account "heal-dummy-acct-001" is available as a payout source

    When I register an external bank account "Heal External Payout Account"
    Then the bank account is created with an id and appears in the bank-accounts list

    When I forward the bank account to the connector
    Then an external account becomes available for the connector as a payout destination

    When I initiate a payout of 1000 in USD/2 from "heal-dummy-acct-001" to the external account
    Then the payout is accepted and recorded as a PAYOUT payment initiation in the payment-initiations list

    When I reverse the payout
    Then the reversal is accepted and recorded as an adjustment against the payment initiation
