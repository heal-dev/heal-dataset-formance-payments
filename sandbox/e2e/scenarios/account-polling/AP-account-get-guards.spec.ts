// Tier-2 edges (AP-S4, AP-S5): account read-by-id guards on the account surface
// that polling populates.
// API surface (SG01). @readonly — read-only, no mutation.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

// A well-formed AccountID (base64url of the canonical JSON) for an account that
// does not exist.
const NONEXISTENT_ACCOUNT_ID = Buffer.from(
  JSON.stringify({
    ConnectorID: { Provider: 'dummypay', Reference: '00000000-0000-0000-0000-000000000001' },
    Reference: 'no-such-account',
  }),
).toString('base64url');

test.describe('@readonly scenario: account-polling read-by-id guards', () => {
  test('AP-S4: fetching an account by a malformed id is rejected with 400 INVALID_ID', async ({ request }) => {
    const res = await request.get(`${API}/v3/accounts/not-a-valid-account-id`);
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('INVALID_ID');
  });

  test('AP-S5: fetching a non-existent account is rejected with 404 NOT_FOUND', async ({ request }) => {
    const res = await request.get(`${API}/v3/accounts/${NONEXISTENT_ACCOUNT_ID}`);
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(404);
    expect((await res.json()).errorCode).toBe('NOT_FOUND');
  });
});
