// Tier-2 edges (PIC-S3, PIC-S4, PIC-S5): payment-initiation create validation guards.
// API surface (SG01). @worker — installs a connector + polls an account so each
// request is valid except for the one field under test; the requests are rejected
// (400 VALIDATION) so no lasting payment initiation is created.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

const future = () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
const past = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

// Serial: the three guards share one connector polled once in beforeAll. Serial keeps
// them on a single worker so the shared setup runs once and is parallel-safe by
// construction (the file's own connector name never collides across workers).
test.describe('@worker scenario: payment-initiation-create validation guards', () => {
  test.describe.configure({ mode: 'serial' });
  let connectorId = '';
  let srcId = '';
  let dstId = '';

  test.beforeAll(async ({ request }, workerInfo) => {
    const connectorName = `heal-pic-guard-w${workerInfo.parallelIndex}`;
    const list = await request.get(`${API}/v3/connectors`, { params: { pageSize: '100' } });
    const stale = ((await list.json())?.cursor?.data ?? []).find((c: any) => c.name === connectorName);
    if (stale) await request.delete(`${API}/v3/connectors/${stale.id}`).catch(() => {});

    const ci = await request.post(`${API}/v3/connectors/install/${SEED.dummypay.provider}`, {
      data: { name: connectorName, pollingPeriod: SEED.dummypay.pollingPeriod, directory: SEED.dummypay.directory },
    });
    connectorId = (await ci.json()).data;

    await expect(async () => {
      const res = await request.get(`${API}/v3/accounts`, { params: { pageSize: '100' } });
      const rows: any[] = (await res.json())?.cursor?.data ?? [];
      const mine = rows.filter((a) => a.connectorID === connectorId);
      const byRef = Object.fromEntries(mine.map((a) => [a.reference, a.id]));
      expect(byRef[SEED.transfer.sourceRef]).toBeTruthy();
      expect(byRef[SEED.transfer.destinationRef]).toBeTruthy();
      srcId = byRef[SEED.transfer.sourceRef];
      dstId = byRef[SEED.transfer.destinationRef];
    }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
  });

  test.afterAll(async ({ request }) => {
    if (connectorId) await request.delete(`${API}/v3/connectors/${connectorId}`).catch(() => {});
  });

  test('PIC-S3: initiating without a destinationAccountID is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/payment-initiations`, {
      data: {
        reference: 'hg-s3',
        scheduledAt: future(),
        connectorID: connectorId,
        type: SEED.transfer.type,
        amount: SEED.transfer.amountMinor,
        asset: SEED.transfer.asset,
        sourceAccountID: srcId,
        // destinationAccountID omitted
      },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('VALIDATION');
  });

  test('PIC-S4: initiating with a past scheduledAt is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/payment-initiations`, {
      data: {
        reference: 'hg-s4',
        scheduledAt: past(),
        connectorID: connectorId,
        type: SEED.transfer.type,
        amount: SEED.transfer.amountMinor,
        asset: SEED.transfer.asset,
        sourceAccountID: srcId,
        destinationAccountID: dstId,
      },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('VALIDATION');
  });

  test('PIC-S5: initiating with an invalid type is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/payment-initiations`, {
      data: {
        reference: 'hg-s5',
        scheduledAt: future(),
        connectorID: connectorId,
        type: 'BOGUS',
        amount: SEED.transfer.amountMinor,
        asset: SEED.transfer.asset,
        sourceAccountID: srcId,
        destinationAccountID: dstId,
      },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('VALIDATION');
  });
});
