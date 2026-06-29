// Tier-2 edges (PM-S4..PM-S7): pool create/get/balances guards.
// API surface (SG01). @readonly — all requests are rejected, no mutation.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;
const NONEXISTENT_POOL = 'deadbeef-0000-4000-8000-000000000000';

test.describe('@readonly scenario: pool-management edges (2)', () => {
  test('PM-S4: creating a pool with a malformed accountID is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/pools`, {
      data: { name: 'heal-pm-badacct', accountIDs: ['not-a-valid-account-id'] },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('VALIDATION');
  });

  test('PM-S5: fetching a non-existent pool is rejected with 404 NOT_FOUND', async ({ request }) => {
    const res = await request.get(`${API}/v3/pools/${NONEXISTENT_POOL}`);
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(404);
    expect((await res.json()).errorCode).toBe('NOT_FOUND');
  });

  test('PM-S6: latest balances for a non-existent pool are rejected with 404 NOT_FOUND', async ({ request }) => {
    const res = await request.get(`${API}/v3/pools/${NONEXISTENT_POOL}/balances/latest`);
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(404);
    expect((await res.json()).errorCode).toBe('NOT_FOUND');
  });

  test('PM-S7: fetching a pool by a malformed id is rejected with 400 INVALID_ID', async ({ request }) => {
    const res = await request.get(`${API}/v3/pools/not-a-uuid`);
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('INVALID_ID');
  });
});
