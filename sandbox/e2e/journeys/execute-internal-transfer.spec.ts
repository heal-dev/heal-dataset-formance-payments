// Journey: Internal Transfer Execution (level-0, sequential).
//
// Walks the arc against the REAL stack: install a dummypay connector → the REAL
// worker polls its internal accounts → initiate a REAL transfer between two of
// them → assert it is recorded as a TRANSFER payment initiation. State accretes
// step → step in ONE test. Own namespace, sequential within, parallel-safe across.
//
// Assertion surface: the payments API the Console itself calls (/api/payments via
// the gateway). The Console v3 UI 500s on /connectivity/* (useRouteGuard bug —
// setup-gap SG01), so it is kept out of the assertion path; payments is the SUT.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker journey: execute-internal-transfer', () => {
  test('install → view internal accounts → transfer between two of them', async ({ request }, testInfo) => {
    const ns = `w${testInfo.parallelIndex}`;
    const connectorName = `heal-transfer-${ns}`;
    // Keep the reference SHORT: Temporal derives a workflow id from it (+ connector
    // id + provider), and a long ref (e.g. the full Playwright testId) overflows
    // Temporal's WorkflowId length limit → 500 on transfer create. Short + unique
    // per worker is enough (truncate-per-file resets between runs).
    const transferRef = `htf-${ns}`;
    let connectorId = '';
    let srcId = '';
    let dstId = '';

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

    await test.step('the worker polls and the two internal accounts become available', async () => {
      await expect(async () => {
        const res = await request.get(`${API}/v3/accounts`, { params: { pageSize: '100' } });
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        const mine = rows.filter((a) => a.connectorID === connectorId);
        const byRef = Object.fromEntries(mine.map((a) => [a.reference, a.id]));
        expect(byRef[SEED.transfer.sourceRef], 'source account not polled yet').toBeTruthy();
        expect(byRef[SEED.transfer.destinationRef], 'destination account not polled yet').toBeTruthy();
        srcId = byRef[SEED.transfer.sourceRef];
        dstId = byRef[SEED.transfer.destinationRef];
      }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
    });

    await test.step('initiate a TRANSFER between the two internal accounts', async () => {
      // scheduledAt must be in the FUTURE (API-validated). Compute it deterministically
      // relative to the run; the exact value isn't asserted on.
      const scheduledAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request.post(`${API}/v3/payment-initiations`, {
        params: { noValidation: 'true' },
        data: {
          reference: transferRef,
          scheduledAt,
          connectorID: connectorId,
          description: 'heal internal transfer journey',
          type: SEED.transfer.type,
          amount: SEED.transfer.amountMinor,
          asset: SEED.transfer.asset,
          sourceAccountID: srcId,
          destinationAccountID: dstId,
        },
      });
      expect(res.ok(), `transfer create returned ${res.status()}: ${await res.text()}`).toBeTruthy();
      const data = (await res.json())?.data;
      expect(data?.paymentInitiationID, 'a payment initiation id should be returned').toBeTruthy();
    });

    await test.step('the transfer is recorded as a TRANSFER in the payment-initiations list', async () => {
      await expect(async () => {
        const res = await request.get(`${API}/v3/payment-initiations`, { params: { pageSize: '100' } });
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        const mine = rows.find((p) => p.reference === transferRef);
        expect(mine, `transfer ${transferRef} not found in payment-initiations`).toBeTruthy();
        expect(String(mine.type)).toBe(SEED.transfer.type);
      }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 3_000] });
    });

    await test.step('teardown: uninstall the connector', async () => {
      if (connectorId) await request.delete(`${API}/v3/connectors/${connectorId}`).catch(() => {});
    });
  });
});
