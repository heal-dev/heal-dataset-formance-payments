// Tier-2 edges (PP-S3, PP-S4, PP-S5): payment read-by-id guards + list status filter.
// API surface (SG01). @readonly — read-only, asserts on the golden-seeded payment.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

const NONEXISTENT_PAYMENT_ID = Buffer.from(
  JSON.stringify({
    ConnectorID: { Provider: 'dummypay', Reference: '00000000-0000-0000-0000-000000000001' },
    Reference: 'NO-SUCH-PAYMENT',
    Type: 'PAY-IN',
  }),
).toString('base64url');

test.describe('@readonly scenario: payment-polling guards + filter', () => {
  test('PP-S3: fetching a payment by a malformed id is rejected with 400 INVALID_ID', async ({ request }) => {
    const res = await request.get(`${API}/v3/payments/not-a-valid-payment-id`);
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('INVALID_ID');
  });

  test('PP-S4: fetching a non-existent payment is rejected with 404 NOT_FOUND', async ({ request }) => {
    const res = await request.get(`${API}/v3/payments/${NONEXISTENT_PAYMENT_ID}`);
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(404);
    expect((await res.json()).errorCode).toBe('NOT_FOUND');
  });

  test('PP-S5: the payments list filters by status', async ({ request }) => {
    // The seeded payment is SUCCEEDED — it must appear when filtering SUCCEEDED...
    const succeeded = await request.get(`${API}/v3/payments`, {
      params: { pageSize: '100', query: JSON.stringify({ $match: { status: 'SUCCEEDED' } }) },
    });
    expect(succeeded.status(), `got ${succeeded.status()}: ${await succeeded.text()}`).toBe(200);
    const sRows: any[] = (await succeeded.json())?.cursor?.data ?? [];
    expect(sRows.every((p) => p.status === 'SUCCEEDED'), 'all rows should be SUCCEEDED').toBe(true);
    expect(sRows.some((p) => p.reference === SEED.payment.reference), 'seeded SUCCEEDED payment should be present').toBe(true);

    // ...and must NOT appear when filtering a status it does not have.
    const failed = await request.get(`${API}/v3/payments`, {
      params: { pageSize: '100', query: JSON.stringify({ $match: { status: 'FAILED' } }) },
    });
    expect(failed.status()).toBe(200);
    const fRows: any[] = (await failed.json())?.cursor?.data ?? [];
    expect(fRows.some((p) => p.reference === SEED.payment.reference), 'SUCCEEDED payment must not match FAILED filter').toBe(false);
  });
});
