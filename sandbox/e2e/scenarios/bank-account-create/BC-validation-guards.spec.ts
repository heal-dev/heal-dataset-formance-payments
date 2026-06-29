// Tier-2 edges (BC-S2, BC-S3, BC-S4): bank-account create validation guards.
// API surface (SG01). @readonly — all requests are rejected, no mutation.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@readonly scenario: bank-account-create validation guards', () => {
  test('BC-S2: a bank account without a name is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/bank-accounts`, {
      data: { iban: SEED.payout.bankAccount.iban },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('VALIDATION');
  });

  test('BC-S3: a bank account with neither accountNumber nor IBAN is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/bank-accounts`, {
      data: { name: 'Heal No Identifier BA' },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('VALIDATION');
  });

  test('BC-S4: a bank account with a too-short IBAN is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/bank-accounts`, {
      data: { name: 'Heal Short IBAN BA', iban: 'DE89' },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('VALIDATION');
  });
});
