// Tier-2 edges for the inbound webhook endpoint. API surface (SG01).
// WE-S2: malformed connector id → 400 INVALID_ID (rejected before connector lookup).
// WE-S3: a webhook to a well-formed dummypay connector (which registers NO webhook
//   handler) currently returns 500 INTERNAL — asserted as the CURRENT behaviour; the
//   spec flags it as a candidate bug for the verify step to adjudicate (a typed 4xx
//   would be expected). Not weakened or hidden.
//
// The happy path WE-S1 is blocked by setup-gap SG03 (no webhook-capable PSP) and is
// NOT authored here.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker scenario: webhook-events edges', () => {
  test.describe.configure({ mode: 'serial' });
  let connectorId = '';

  test.beforeAll(async ({ request }, workerInfo) => {
    const connectorName = `heal-wh-w${workerInfo.parallelIndex}`;
    const list = await request.get(`${API}/v3/connectors`, { params: { pageSize: '100' } });
    const stale = ((await list.json())?.cursor?.data ?? []).find((c: any) => c.name === connectorName);
    if (stale) await request.delete(`${API}/v3/connectors/${stale.id}`).catch(() => {});

    const ci = await request.post(`${API}/v3/connectors/install/${SEED.dummypay.provider}`, {
      data: { name: connectorName, pollingPeriod: SEED.dummypay.pollingPeriod, directory: SEED.dummypay.directory },
    });
    connectorId = (await ci.json()).data;
    expect(connectorId).toBeTruthy();
  });

  test.afterAll(async ({ request }) => {
    if (connectorId) await request.delete(`${API}/v3/connectors/${connectorId}`).catch(() => {});
  });

  test('WE-S2: a webhook to a malformed connector id is rejected with 400 INVALID_ID', async ({ request }) => {
    const res = await request.post(`${API}/v3/connectors/webhooks/not-a-valid-id/test-event`, {
      data: { event: 'test' },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('INVALID_ID');
  });

  test('WE-S3: a webhook to a connector with no webhook config currently returns 500 INTERNAL', async ({ request }) => {
    const res = await request.post(`${API}/v3/connectors/webhooks/${connectorId}/test-event`, {
      data: { event: 'test' },
    });
    // Documented current behaviour (candidate bug — a typed 4xx is expected). The
    // verify step adjudicates whether this 500 is a bug-gap or the claim is wrong.
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(500);
    expect((await res.json()).errorCode).toBe('INTERNAL');
  });
});
