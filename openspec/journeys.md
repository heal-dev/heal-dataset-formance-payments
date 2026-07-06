# formance-payments — User Journeys

Level-0 cross-capability arcs. Each threads several capabilities; the data one step `produces` and a later step `consumes` is the assertion no single-capability test makes.

## Journey: FPY-J01 — Connector Installation & Discovery

- **Id**: `onboard-connector-basic`
- **Persona**: Ops Engineer
- **Story**: As an Ops Engineer, I install a connector so that the system begins polling the PSP, and I confirm the connector's accounts and balances are discovered and visible.
- **Entry**: Fresh stack with no connector installed (golden seed empty of connectors); Ops Engineer at the Console.
- **Capabilities threaded**: `connector-install` → `account-polling` → `balance-polling`
- **Reference test**: `sandbox/e2e/journeys/onboard-connector-basic.spec.ts`

### Steps

1. Install a dummypay connector (POST /v3/connectors/install/dummypay, config {directory:'/dummypay', pollingPeriod:'30m'}) and confirm it appears in the Console's Installed Connectors list  
   _(capability `connector-install`; produces `connectorID`)_
2. Confirm the worker polled the connector's accounts on install — the 2 fixture accounts appear in the Console accounts table  
   _(capability `account-polling`; produces `accounts`; consumes `connectorID`)_
3. Confirm the polled accounts' balances are visible in the Console account-detail Balances card, matching the seeded fixture amounts  
   _(capability `balance-polling`; produces `balances`; consumes `accounts`)_

## Journey: FPY-J02 — Internal Transfer Execution

- **Id**: `execute-internal-transfer`
- **Persona**: Ops Engineer
- **Story**: As a Finance User, I install a connector, view its fetched internal accounts, and initiate a transfer between two of them so that money moves and the transfer is recorded.
- **Entry**: Fresh stack; Ops Engineer at the Console. No connector installed yet.
- **Capabilities threaded**: `connector-install` → `account-polling` → `payment-initiation-create`
- **Reference test**: `sandbox/e2e/journeys/execute-internal-transfer.spec.ts`

### Steps

1. Install a dummypay connector (config {directory:'/dummypay', pollingPeriod:'30m'}) and confirm it appears in the installed connectors list  
   _(capability `connector-install`; produces `connectorID`)_
2. Confirm the worker polled the connector's internal accounts — the 2 fixture accounts are available to use as transfer source and destination  
   _(capability `account-polling`; produces `sourceAccount`, `destinationAccount`; consumes `connectorID`)_
3. Initiate a TRANSFER between the two internal accounts (POST /v3/payment-initiations, type TRANSFER, source=acct-001, destination=acct-002) and confirm it is accepted and recorded as a payment initiation  
   _(capability `payment-initiation-create`; produces `paymentInitiation`; consumes `sourceAccount`, `destinationAccount`, `connectorID`)_

## Journey: FPY-J03 — Account Pool & Balance Aggregation

- **Id**: `pool-balance-snapshot`
- **Persona**: Ops Engineer
- **Story**: As a Treasury Manager, I install a connector, group its fetched accounts into a pool, and query the pool's aggregate balances so I can see total holdings per asset.
- **Entry**: Fresh stack; Ops Engineer at the Console. No connector installed yet.
- **Capabilities threaded**: `connector-install` → `account-polling` → `pool-management` → `balance-polling`
- **Reference test**: `sandbox/e2e/journeys/pool-balance-snapshot.spec.ts`

### Steps

1. Install a dummypay connector and confirm it is listed  
   _(capability `connector-install`; produces `connectorID`)_
2. Confirm the worker polled the connector's two internal accounts  
   _(capability `account-polling`; produces `accounts`; consumes `connectorID`)_
3. Create a pool grouping the two accounts (POST /v3/pools {name, accountIDs})  
   _(capability `pool-management`; produces `pool`; consumes `accounts`)_
4. Query the pool's latest aggregate balances (GET /v3/pools/{id}/balances/latest) and confirm the per-asset totals match the seeded fixture balances  
   _(capability `balance-polling`; produces `aggregateBalances`; consumes `pool`)_

## Journey: FPY-J04 — Payout Workflow with Reversal

- **Id**: `payout-to-external-account`
- **Persona**: Ops Engineer
- **Story**: As an Ops Engineer, I install a connector, register and forward an external bank account, initiate a PAYOUT from an internal account to that external account, then reverse the payout so the funds movement is undone and the reversal is recorded.
- **Entry**: Fresh stack; Ops Engineer at the Console. No connector installed yet.
- **Capabilities threaded**: `connector-install` → `account-polling` → `bank-account-create` → `bank-account-forward` → `payment-initiation-create` → `payment-initiation-reverse`
- **Reference test**: `sandbox/e2e/journeys/payout-to-external-account.spec.ts`

### Steps

1. Install a dummypay connector (POST /v3/connectors/install/dummypay, config {directory:'/dummypay', pollingPeriod:'30m'}) and confirm it is listed  
   _(capability `connector-install`; produces `connectorID`)_
2. Confirm the worker polled the connector's internal accounts — the fixture account usable as the payout source is available  
   _(capability `account-polling`; produces `sourceAccount`; consumes `connectorID`)_
3. Create an external bank account (POST /v3/bank-accounts {name, accountNumber/iban, country}) and confirm it is created with an id  
   _(capability `bank-account-create`; produces `bankAccountID`)_
4. Forward the bank account to the connector (POST /v3/bank-accounts/{id}/forward {connectorID}) so it becomes a usable external account on the PSP  
   _(capability `bank-account-forward`; produces `externalAccount`; consumes `bankAccountID`, `connectorID`)_
5. Initiate a PAYOUT from the internal source account to the forwarded external account (POST /v3/payment-initiations, type PAYOUT, source=sourceAccount, destination=externalAccount) and confirm it is accepted and recorded  
   _(capability `payment-initiation-create`; produces `paymentInitiation`; consumes `sourceAccount`, `externalAccount`, `connectorID`)_
6. Reverse the payout (POST /v3/payment-initiations/{id}/reverse {reference, amount, asset}) and confirm the reversal is accepted and recorded as an adjustment  
   _(capability `payment-initiation-reverse`; produces `reversal`; consumes `paymentInitiation`)_
