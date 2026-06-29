// Journey: Payout Workflow with Reversal (level-0, sequential).
//
// Walks the arc against the REAL stack: install a dummypay connector → the REAL
// worker polls its internal accounts → register a REAL external bank account →
// forward it to the connector so it surfaces as an EXTERNAL account → initiate a
// REAL payout from an internal account to it → reverse the payout. State accretes
// step → step in ONE test. Own namespace, sequential within, parallel-safe across.
//
// Assertion surface: the payments API the Console itself calls (/api/payments via
// the gateway). The Console v3 UI 500s on /connectivity/* (useRouteGuard bug —
// setup-gap SG01), so it is kept out of the assertion path; payments is the SUT.
//
// KNOWN PRODUCT BUG (filed bug-gap): the final "reverse the payout" step asserts
// success and is EXPECTED RED — POST /v3/payment-initiations/{id}/reverse 500s
// because the reverse-payout Temporal WorkflowId overflows Temporal's length
// limit. The red assertion is the evidence; do not weaken it to go green.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker journey: payout-to-external-account', () => {
  test('install → forward external account → payout → reverse', async ({ request }, testInfo) => {
    const ns = `w${testInfo.parallelIndex}`;
    const connectorName = `heal-payout-${ns}`;
    // Keep references SHORT: Temporal derives workflow ids from them (+ connector
    // id + provider). Short + unique per worker is enough.
    const payoutRef = `hpo-${ns}`;
    const reversalRef = `hpor-${ns}`;
    let connectorId = '';
    let srcId = '';
    let bankAccountId = '';
    let externalId = '';
    let paymentInitiationId = '';

    await test.step('setup: clear any leftover connector with this name', async () => {
      const list = await request.get(`${API}/v3/connectors`, { params: { pageSize: '100' } });
      const rows: any[] = (await list.json())?.cursor?.data ?? [];
      const stale = rows.find((c) => c.name === connectorName);
      if (stale) {
        await request.delete(`${API}/v3/connectors/${stale.id}`).catch(() => {});
        await expect(async () => {
          const r = await request.get(`${API}/v3/connectors`, { params: { pageSize: '100' } });
          const cur: any[] = (await r.json())?.cursor?.data ?? [];
          expect(cur.some((c) => c.name === connectorName)).toBe(false);
        }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 3_000] });
      }
    });

    await test.step(`install dummypay connector "${connectorName}"`, async () => {
      const res = await request.post(`${API}/v3/connectors/install/${SEED.dummypay.provider}`, {
        data: { name: connectorName, pollingPeriod: SEED.dummypay.pollingPeriod, directory: SEED.dummypay.directory },
      });
      expect(res.ok(), `install returned ${res.status()}: ${await res.text()}`).toBeTruthy();
      connectorId = (await res.json()).data;
      expect(connectorId).toBeTruthy();
    });

    await test.step('the worker polls and the internal source account becomes available', async () => {
      await expect(async () => {
        const res = await request.get(`${API}/v3/accounts`, { params: { pageSize: '100' } });
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        const mine = rows.filter((a) => a.connectorID === connectorId);
        const byRef = Object.fromEntries(mine.map((a) => [a.reference, a.id]));
        expect(byRef[SEED.payout.sourceRef], 'source account not polled yet').toBeTruthy();
        srcId = byRef[SEED.payout.sourceRef];
      }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
    });

    await test.step('register an external bank account', async () => {
      const res = await request.post(`${API}/v3/bank-accounts`, {
        data: {
          name: SEED.payout.bankAccount.name,
          accountNumber: SEED.payout.bankAccount.accountNumber,
          iban: SEED.payout.bankAccount.iban,
          swiftBicCode: SEED.payout.bankAccount.swiftBicCode,
          country: SEED.payout.bankAccount.country,
        },
      });
      expect(res.ok(), `bank-account create returned ${res.status()}: ${await res.text()}`).toBeTruthy();
      bankAccountId = (await res.json()).data;
      expect(bankAccountId, 'a bank account id should be returned').toBeTruthy();
    });

    await test.step('the bank account appears in the bank-accounts list', async () => {
      const res = await request.get(`${API}/v3/bank-accounts`, { params: { pageSize: '100' } });
      const rows: any[] = (await res.json())?.cursor?.data ?? [];
      expect(rows.some((b) => b.id === bankAccountId), `bank account ${bankAccountId} not in list`).toBeTruthy();
    });

    await test.step('forward the bank account to the connector', async () => {
      const res = await request.post(`${API}/v3/bank-accounts/${bankAccountId}/forward`, {
        data: { connectorID: connectorId },
      });
      expect(res.ok(), `forward returned ${res.status()}: ${await res.text()}`).toBeTruthy();
    });

    await test.step('an external account becomes available as a payout destination', async () => {
      await expect(async () => {
        const res = await request.get(`${API}/v3/accounts`, { params: { pageSize: '100' } });
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        const ext = rows.find((a) => a.connectorID === connectorId && String(a.type) === 'EXTERNAL');
        expect(ext, 'no external account surfaced after forward').toBeTruthy();
        externalId = ext.id;
      }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
    });

    await test.step('initiate a PAYOUT from the internal account to the external account', async () => {
      // scheduledAt must be in the FUTURE (API-validated). The exact value isn't asserted on.
      const scheduledAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request.post(`${API}/v3/payment-initiations`, {
        params: { noValidation: 'true' },
        data: {
          reference: payoutRef,
          scheduledAt,
          connectorID: connectorId,
          description: 'heal payout journey',
          type: SEED.payout.type,
          amount: SEED.payout.amountMinor,
          asset: SEED.payout.asset,
          sourceAccountID: srcId,
          destinationAccountID: externalId,
        },
      });
      expect(res.ok(), `payout create returned ${res.status()}: ${await res.text()}`).toBeTruthy();
      const data = (await res.json())?.data;
      paymentInitiationId = data?.paymentInitiationID;
      expect(paymentInitiationId, 'a payment initiation id should be returned').toBeTruthy();
    });

    await test.step('the payout is recorded as a PAYOUT in the payment-initiations list', async () => {
      await expect(async () => {
        const res = await request.get(`${API}/v3/payment-initiations`, { params: { pageSize: '100' } });
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        const mine = rows.find((p) => p.reference === payoutRef);
        expect(mine, `payout ${payoutRef} not found in payment-initiations`).toBeTruthy();
        expect(String(mine.type)).toBe(SEED.payout.type);
      }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 3_000] });
    });

    await test.step('reverse the payout', async () => {
      // EXPECTED RED — known product bug: the reverse-payout Temporal WorkflowId
      // overflows Temporal's length limit, so this 500s. The journey claims reversal
      // works; this assertion is the evidence the claim fails. Do not weaken it.
      const res = await request.post(`${API}/v3/payment-initiations/${paymentInitiationId}/reverse`, {
        data: {
          reference: reversalRef,
          amount: SEED.payout.amountMinor,
          asset: SEED.payout.asset,
          description: 'heal payout reversal',
        },
      });
      expect(res.ok(), `reverse returned ${res.status()}: ${await res.text()}`).toBeTruthy();
    });

    await test.step('teardown: uninstall the connector', async () => {
      if (connectorId) await request.delete(`${API}/v3/connectors/${connectorId}`).catch(() => {});
    });
  });
});
