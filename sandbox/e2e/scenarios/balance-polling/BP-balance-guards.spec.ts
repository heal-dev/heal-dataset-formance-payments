// Tier-2 edges (BP-S3, BP-S4): balances list-endpoint behaviours.
// API surface (SG01). @readonly — read-only, no mutation.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

const NONEXISTENT_ACCOUNT_ID = Buffer.from(
  JSON.stringify({
    ConnectorID: { Provider: 'dummypay', Reference: '00000000-0000-0000-0000-000000000001' },
    Reference: 'no-such-account',
  }),
).toString('base64url');

test.describe('@readonly scenario: balance-polling guards', () => {
  test('BP-S3: balances for a non-existent account return 200 with an empty cursor', async ({ request }) => {
    const res = await request.get(`${API}/v3/accounts/${NONEXISTENT_ACCOUNT_ID}/balances`);
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.cursor?.data), JSON.stringify(body)).toBe(true);
    expect(body.cursor.data.length, 'expected no balances for an unknown account').toBe(0);
  });

  test('BP-S4: balances with an invalid pageSize are rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.get(`${API}/v3/accounts/${NONEXISTENT_ACCOUNT_ID}/balances?pageSize=notanumber`);
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('VALIDATION');
  });
});
