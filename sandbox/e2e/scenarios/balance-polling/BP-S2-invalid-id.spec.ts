// Tier-2 edge (BP-S2): requesting balances for a malformed account id is rejected.
// API surface (SG01). @readonly — no mutation, no seed beyond the golden core.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@readonly scenario: balance-polling invalid id', () => {
  test('BP-S2: balances for a malformed account id are rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.get(`${API}/v3/accounts/not-a-valid-id/balances`, { params: { pageSize: '100' } });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('VALIDATION');
  });
});
