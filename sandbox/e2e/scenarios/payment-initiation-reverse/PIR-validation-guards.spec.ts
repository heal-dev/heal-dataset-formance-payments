// Tier-2 edges (PIR-S2, PIR-S3, PIR-S4): reverse validation guards.
// API surface (SG01). These are rejected at validation BEFORE the reverse workflow
// starts, so they are independent of the reverse-workflow 500 bug (PIR-S1).
// Serial: the three guards share one connector + initiation set up once per worker.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker scenario: payment-initiation-reverse validation guards', () => {
  test.describe.configure({ mode: 'serial' });
  let connectorId = '';
  let initiationId = '';

  test.beforeAll(async ({ request }, workerInfo) => {
    const connectorName = `heal-rev-guard-w${workerInfo.parallelIndex}`;
    const list = await request.get(`${API}/v3/connectors`, { params: { pageSize: '100' } });
    const stale = ((await list.json())?.cursor?.data ?? []).find((c: any) => c.name === connectorName);
    if (stale) await request.delete(`${API}/v3/connectors/${stale.id}`).catch(() => {});

    const ci = await request.post(`${API}/v3/connectors/install/${SEED.dummypay.provider}`, {
      data: { name: connectorName, pollingPeriod: SEED.dummypay.pollingPeriod, directory: SEED.dummypay.directory },
    });
    connectorId = (await ci.json()).data;

    let srcId = '';
    let dstId = '';
    await expect(async () => {
      const res = await request.get(`${API}/v3/accounts`, { params: { pageSize: '100' } });
      const rows: any[] = (await res.json())?.cursor?.data ?? [];
      const byRef = Object.fromEntries(
        rows.filter((a) => a.connectorID === connectorId).map((a) => [a.reference, a.id]),
      );
      expect(byRef[SEED.transfer.sourceRef]).toBeTruthy();
      expect(byRef[SEED.transfer.destinationRef]).toBeTruthy();
      srcId = byRef[SEED.transfer.sourceRef];
      dstId = byRef[SEED.transfer.destinationRef];
    }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });

    const scheduledAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const pi = await request.post(`${API}/v3/payment-initiations`, {
      data: {
        reference: `hrg-${workerInfo.parallelIndex}`,
        scheduledAt,
        connectorID: connectorId,
        type: SEED.transfer.type,
        amount: SEED.transfer.amountMinor,
        asset: SEED.transfer.asset,
        sourceAccountID: srcId,
        destinationAccountID: dstId,
      },
    });
    initiationId = (await pi.json()).data.paymentInitiationID;
  });

  test.afterAll(async ({ request }) => {
    if (connectorId) await request.delete(`${API}/v3/connectors/${connectorId}`).catch(() => {});
  });

  test('PIR-S2: reversing with a malformed payment initiation id is rejected with 400 INVALID_ID', async ({ request }) => {
    const res = await request.post(`${API}/v3/payment-initiations/not-a-valid-id/reverse`, {
      data: { reference: 'g-s2', amount: SEED.transfer.amountMinor, asset: SEED.transfer.asset },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('INVALID_ID');
  });

  test('PIR-S3: reversing without an amount is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/payment-initiations/${initiationId}/reverse`, {
      data: { reference: 'g-s3', asset: SEED.transfer.asset }, // amount omitted
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('VALIDATION');
  });

  test('PIR-S4: reversing with an invalid asset is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/payment-initiations/${initiationId}/reverse`, {
      data: { reference: 'g-s4', amount: SEED.transfer.amountMinor, asset: 'NOTANASSET' },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('VALIDATION');
  });
});
