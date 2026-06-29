// Tier-2 edges (BF-S2, BF-S3, BF-S4): forward validation guards.
// API surface (SG01). @worker — needs a real bank account to forward; requests
// are rejected so no lasting mutation beyond the bank account it creates.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

// A well-formed dummypay connectorID that does not exist (base64url of the canonical JSON).
const NONEXISTENT_CONNECTOR_ID = Buffer.from(
  JSON.stringify({ Provider: 'dummypay', Reference: '00000000-0000-0000-0000-0000000000ff' }),
).toString('base64url');

test.describe('@worker scenario: bank-account-forward validation guards', () => {
  let bankAccountId = '';

  test.beforeAll(async ({ request }) => {
    const ba = await request.post(`${API}/v3/bank-accounts`, {
      data: { name: 'Heal FW Guard BA', iban: SEED.payout.bankAccount.iban, country: SEED.payout.bankAccount.country },
    });
    bankAccountId = (await ba.json()).data;
  });

  test('BF-S2: a malformed bank account id is rejected with 400 INVALID_ID', async ({ request }) => {
    const res = await request.post(`${API}/v3/bank-accounts/not-a-uuid/forward`, {
      data: { connectorID: NONEXISTENT_CONNECTOR_ID },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('INVALID_ID');
  });

  test('BF-S3: forwarding without a connectorID is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/bank-accounts/${bankAccountId}/forward`, { data: {} });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('VALIDATION');
  });

  test('BF-S4: a non-existent connector → 404, a malformed connectorID → 400', async ({ request }) => {
    const notFound = await request.post(`${API}/v3/bank-accounts/${bankAccountId}/forward`, {
      data: { connectorID: NONEXISTENT_CONNECTOR_ID },
    });
    expect(notFound.status(), `nonexistent got ${notFound.status()}: ${await notFound.text()}`).toBe(404);
    expect((await notFound.json()).errorCode).toBe('NOT_FOUND');

    const malformed = await request.post(`${API}/v3/bank-accounts/${bankAccountId}/forward`, {
      data: { connectorID: 'clearly-not-valid' },
    });
    expect(malformed.status(), `malformed got ${malformed.status()}: ${await malformed.text()}`).toBe(400);
    expect((await malformed.json()).errorCode).toBe('VALIDATION');
  });
});
