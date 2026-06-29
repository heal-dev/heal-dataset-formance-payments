Feature: Uninstall Connector
  As an Ops Engineer, I uninstall a connector so the system stops polling the PSP
  and the connector is removed.

  # VERIFY: asserts on the payments API surface the Console calls (Console UI 500s
  # — setup-gap SG01). Uninstall is async: DELETE returns a taskID and the
  # connector disappears once the task completes.

  Background:
    Given the Formance Payments stack is running with the dummypay fixtures mounted at "/dummypay"

  Scenario: Install then uninstall a connector and see it removed
    Given an installed "dummypay" connector named "heal-uninstall-<ns>"
    When I uninstall the connector
    Then the request is accepted and a taskID is returned
    And the connector no longer appears in the list of installed connectors
