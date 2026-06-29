// Tier-2 edges (PIC-S6, PIC-S7, PIC-S8): further payment-initiation create checks.
// API surface (SG01). @worker — installs a connector + polls accounts so each
// request is valid except the field under test. PIC-S6/S7 are rejected (no
// mutation); PIC-S8 documents that a negative amount is currently ACCEPTED
// (creates one fixture-owned initiation on this file's own connector).

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;
const future = () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

test.describe('@worker scenario: payment-initiation-create validation guards (2)', () => {
  test.describe.configure({ mode: 'serial' });
  let connectorId = '';
  let srcId = '';
  let dstId = '';

  test.beforeAll(async ({ request }, workerInfo) => {
    const connectorName = `heal-pic-guard2-w${workerInfo.parallelIndex}`;
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

  test('PIC-S6: a reference shorter than 3 chars is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/payment-initiations`, {
      data: {
        reference: 'ab',
        scheduledAt: future(),
        connectorID: connectorId,
        type: SEED.transfer.type,
        amount: SEED.transfer.amountMinor,
        asset: SEED.transfer.asset,
        sourceAccountID: srcId,
        destinationAccountID: dstId,
      },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    const body = await res.json();
    expect(body.errorCode).toBe('VALIDATION');
    expect(body.errorMessage, body.errorMessage).toContain('Reference');
  });

  test('PIC-S7: an invalid asset is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/payment-initiations`, {
      data: {
        reference: 'hg-s7',
        scheduledAt: future(),
        connectorID: connectorId,
        type: SEED.transfer.type,
        amount: SEED.transfer.amountMinor,
        asset: 'NOTANASSET',
        sourceAccountID: srcId,
        destinationAccountID: dstId,
      },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    const body = await res.json();
    expect(body.errorCode).toBe('VALIDATION');
    expect(body.errorMessage, body.errorMessage).toContain('Asset');
  });

  test('PIC-S8: a negative amount is currently ACCEPTED (202), documenting a missing guard', async ({ request }) => {
    const res = await request.post(`${API}/v3/payment-initiations`, {
      data: {
        reference: `hg-s8-w${test.info().parallelIndex}`,
        scheduledAt: future(),
        connectorID: connectorId,
        type: SEED.transfer.type,
        amount: -100,
        asset: SEED.transfer.asset,
        sourceAccountID: srcId,
        destinationAccountID: dstId,
      },
    });
    // Documents current behaviour: no sign/min guard on Amount, so this is accepted.
    expect(res.status(), `negative amount got ${res.status()}: ${await res.text()}`).toBe(202);
    const body = await res.json();
    expect(body.data?.paymentInitiationID, JSON.stringify(body)).toBeTruthy();
  });
});
