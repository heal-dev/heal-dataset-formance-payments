// sandbox/config.ts — the single source of ports/URLs/paths/seed constants.
// Both zones (stack/ and e2e/) import from here; never hard-code a URL twice.

// Host ports live in formance-payments' reserved 15xxx block (see
// heal-datasets-shared/PORTS.md); remapped by stack/infra/docker-compose.heal.yml.
export const PORTS = {
  console: 15000, // Console v3 frontend (the entry screen)
  gateway: 15092, // Caddy gateway → proxies /api to payments
  api: 15080, // payments server (the SUT)
  temporalUi: 15081,
  db: 15432,
} as const;

export const CONSOLE_URL = `http://localhost:${PORTS.console}`;
// The Console entry route for the local stack (see payments/README.md).
export const CONSOLE_ENTRY = `${CONSOLE_URL}/formance/localhost?region=localhost`;
export const GATEWAY_URL = `http://localhost:${PORTS.gateway}`;
export const API_URL = `http://localhost:${PORTS.api}`;

export const STORAGE_STATE = 'e2e/auth/.auth/user.json';

// ── Golden read-only core ───────────────────────────────────────────────────
// The SAME identifiers the seed SQL writes and the spec asserts on. Each value
// a test asserts on must be UI-observable in the Console.
export const SEED = {
  // The one seeded payment the skeleton journey renders.
  payment: {
    reference: 'HEAL-SEED-PAYMENT-0001',
    type: 'PAY-IN',
    status: 'SUCCEEDED',
    scheme: 'CARD_VISA',
    asset: 'USD/2',
    // initial_amount / amount are minor units (100.00 USD)
    amount: 10000,
    // The app's base64url(canonicaljson) PaymentID — stored as payments.id.
    id: 'eyJDb25uZWN0b3JJRCI6eyJQcm92aWRlciI6ImR1bW15cGF5IiwiUmVmZXJlbmNlIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIn0sIlJlZmVyZW5jZSI6IkhFQUwtU0VFRC1QQVlNRU5ULTAwMDEiLCJUeXBlIjoiUEFZLUlOIn0',
  },
  connector: {
    name: 'Heal Seed Connector',
    provider: 'dummypay',
    id: 'eyJQcm92aWRlciI6ImR1bW15cGF5IiwiUmVmZXJlbmNlIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIn0',
  },
  // ── Journey: onboard-connector-basic ─────────────────────────────────────
  // The dummypay connector the journey INSTALLS (real action), pointing at the
  // mounted fixtures dir. Accounts/balances are then produced by the real worker
  // poll (app-self-seed) — these symbols mirror the fixtures so the spec asserts
  // on UI-observable values without guessed literals. Fixtures live in
  // stack/infra/dummypay-fixtures/{accounts,balances}.json.
  dummypay: {
    installName: 'heal-dummypay',
    provider: 'dummypay',
    directory: '/dummypay',
    // pollingPeriod minimum is 20m (server-validated); first poll runs on install.
    pollingPeriod: '30m',
    accounts: [
      { reference: 'heal-dummy-acct-001', name: 'Heal Dummy Checking', asset: 'USD/2', balanceMinor: 1500000 },
      { reference: 'heal-dummy-acct-002', name: 'Heal Dummy Savings', asset: 'EUR/2', balanceMinor: 2750000 },
    ],
  },
  // ── Journey: execute-internal-transfer ───────────────────────────────────
  // A TRANSFER between the two dummypay internal accounts (acct-001 → acct-002).
  // NB: POST /v3/payment-initiations validates scheduledAt > now — the spec must
  // pass a FUTURE timestamp. With ?noValidation=true the initiation lands in
  // status WAITING_FOR_VALIDATION (recorded but not auto-completed), so the
  // journey asserts it is CREATED + RECORDED as a TRANSFER, not "succeeded".
  transfer: {
    type: 'TRANSFER',
    amountMinor: 1000,
    asset: 'USD/2',
    sourceRef: 'heal-dummy-acct-001',
    destinationRef: 'heal-dummy-acct-002',
  },
  // ── Journey: pool-balance-snapshot ───────────────────────────────────────
  // A pool grouping the two dummypay accounts; GET /v3/pools/{id}/balances/latest
  // returns per-asset aggregate totals = the seeded fixture balances.
  pool: {
    memberRefs: ['heal-dummy-acct-001', 'heal-dummy-acct-002'],
    aggregate: [
      { asset: 'USD/2', amount: 1500000 },
      { asset: 'EUR/2', amount: 2750000 },
    ],
  },
  // ── Journey: payout-to-external-account ───────────────────────────────────
  // Register an EXTERNAL bank account (POST /v3/bank-accounts — drive-real-action),
  // forward it to the dummypay connector (POST /v3/bank-accounts/{id}/forward) so it
  // surfaces as an external account, then initiate a PAYOUT from the internal source
  // account to it (type PAYOUT) and REVERSE it (POST /v3/payment-initiations/{id}/reverse).
  // The bank account + payout + reversal are all created live per-worker (no golden row);
  // these symbols are the request payload + assertion constants. Same scheduledAt-future /
  // SHORT-reference / ?noValidation=true learnings as the transfer journey apply.
  payout: {
    type: 'PAYOUT',
    amountMinor: 1000,
    asset: 'USD/2',
    sourceRef: 'heal-dummy-acct-001',
    // The external bank account the journey creates + forwards (real action).
    bankAccount: {
      name: 'Heal External Payout Account',
      accountNumber: '123456789',
      iban: 'DE89370400440532013000',
      swiftBicCode: 'COBADEFFXXX',
      country: 'DE',
    },
  },
} as const;
