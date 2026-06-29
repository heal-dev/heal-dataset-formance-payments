// Tier-1 flow: Reverse Payment Initiation (happy path — PIR-S1).
//
// Asserts on the payments API the Console calls (Console UI 500s — setup-gap SG01).
// Walks the flow: install a connector → poll internal accounts → create a TRANSFER
// payment initiation → reverse it → assert it is accepted (202) and a reversal
// adjustment is recorded.
//
// NOTE: the product currently returns 500 INTERNAL on reverse (Temporal WorkflowId
// length overflow — see spec PIR-S1). This test asserts the DOCUMENTED 202 and is
// therefore EXPECTED to fail; the failure is the bug-gap evidence for the verify
// step. The assertion is intentionally NOT softened to green.
//
// @worker: installs its own connector, creates + reverses its own initiation, cleans up.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker flow: payment-initiation-reverse', () => {
  test('reverse an existing payment initiation', async ({ request }, testInfo) => {
    const ns = `w${testInfo.parallelIndex}`;
    const connectorName = `heal-rev-${ns}`;
    const initRef = `hrv-${ns}`; // SHORT (Temporal WorkflowId length limit)
    const reversalRef = `hrvr-${ns}`;
    let connectorId = '';
    let srcId = '';
    let dstId = '';
    let initiationId = '';

    await test.step('setup: clear any leftover connector with this name', async () => {
      const list = await request.get(`${API}/v3/connectors`, { params: { pageSize: '100' } });
      const stale = ((await list.json())?.cursor?.data ?? []).find((c: any) => c.name === connectorName);
      if (stale) {
        await request.delete(`${API}/v3/connectors/${stale.id}`).catch(() => {});
        // The uninstall is async — wait until it's fully gone before re-installing,
        // else the immediate install races the pending delete and 400 CONFLICTs.
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
      expect(res.status(), `install ${res.status()}: ${await res.text()}`).toBe(202);
      connectorId = (await res.json()).data;
    });

    await test.step('the worker polls and the two internal accounts become available', async () => {
      await expect(async () => {
        const res = await request.get(`${API}/v3/accounts`, { params: { pageSize: '100' } });
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        const byRef = Object.fromEntries(
          rows.filter((a) => a.connectorID === connectorId).map((a) => [a.reference, a.id]),
        );
        expect(byRef[SEED.transfer.sourceRef], 'source account not polled yet').toBeTruthy();
        expect(byRef[SEED.transfer.destinationRef], 'destination account not polled yet').toBeTruthy();
        srcId = byRef[SEED.transfer.sourceRef];
        dstId = byRef[SEED.transfer.destinationRef];
      }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
    });

    await test.step('create a TRANSFER payment initiation to reverse', async () => {
      const scheduledAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request.post(`${API}/v3/payment-initiations`, {
        data: {
          reference: initRef,
          scheduledAt,
          connectorID: connectorId,
          description: 'heal payment-initiation-reverse source',
          type: SEED.transfer.type,
          amount: SEED.transfer.amountMinor,
          asset: SEED.transfer.asset,
          sourceAccountID: srcId,
          destinationAccountID: dstId,
        },
      });
      expect(res.status(), `create ${res.status()}: ${await res.text()}`).toBe(202);
      initiationId = (await res.json()).data.paymentInitiationID;
      expect(initiationId).toBeTruthy();
    });

    await test.step('reverse the payment initiation', async () => {
      const res = await request.post(`${API}/v3/payment-initiations/${initiationId}/reverse`, {
        data: { reference: reversalRef, amount: SEED.transfer.amountMinor, asset: SEED.transfer.asset },
      });
      // Claimed behaviour: 202 with {data:{paymentInitiationReversalID, taskID}}.
      expect(res.status(), `reverse ${res.status()}: ${await res.text()}`).toBe(202);
      const data = (await res.json())?.data;
      expect(data?.paymentInitiationReversalID, 'a reversal id should be returned').toBeTruthy();
    });

    await test.step('the reversal is recorded as an adjustment against the initiation', async () => {
      await expect(async () => {
        const res = await request.get(`${API}/v3/payment-initiations/${initiationId}/adjustments`, {
          params: { pageSize: '100' },
        });
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        // A reversal must surface as an adjustment whose status reflects the reversal.
        const reversed = rows.some((a) => String(a.status).includes('REVERSE') || String(a.status).includes('REVERSAL'));
        expect(reversed, `no reversal adjustment found; adjustments: ${JSON.stringify(rows.map((r) => r.status))}`).toBeTruthy();
      }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 3_000] });
    });

    await test.step('teardown: uninstall the connector', async () => {
      if (connectorId) await request.delete(`${API}/v3/connectors/${connectorId}`).catch(() => {});
    });
  });
});
