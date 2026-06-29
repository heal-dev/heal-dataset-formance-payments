// Tier-2 edge (BF-S5): forwarding a well-formed but non-existent bank account
// id is rejected 404 NOT_FOUND.
// API surface (SG01). @readonly — request is rejected, no mutation.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

// A valid UUID for a bank account that does not exist.
const NONEXISTENT_BANK_ACCOUNT = 'deadbeef-0000-4000-8000-000000000000';

test.describe('@readonly scenario: bank-account-forward BF-S5 non-existent account', () => {
  test('forwarding a non-existent bank account is rejected with 404 NOT_FOUND', async ({ request }) => {
    const res = await request.post(`${API}/v3/bank-accounts/${NONEXISTENT_BANK_ACCOUNT}/forward`, {
      data: { connectorID: SEED.connector.id },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(404);
    expect((await res.json()).errorCode).toBe('NOT_FOUND');
  });
});
