// Tier-2 edges (BC-S5, BC-S6, BC-S7): additional bank-account create validation guards.
// API surface (SG01). @readonly — all requests are rejected, no mutation.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;
const VALID_IBAN = 'DE89370400440532013000';

test.describe('@readonly scenario: bank-account-create validation guards (2)', () => {
  test('BC-S5: a bank account with an invalid country code is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/bank-accounts`, {
      data: { name: 'Heal Bad Country BA', iban: VALID_IBAN, country: 'XX' },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    const body = await res.json();
    expect(body.errorCode).toBe('VALIDATION');
    expect(body.errorMessage, body.errorMessage).toContain('Country');
  });

  test('BC-S6: a bank account with an IBAN longer than 31 chars is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/bank-accounts`, {
      data: { name: 'Heal Long IBAN BA', iban: 'DE893704004405320130001234567890123456' },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    const body = await res.json();
    expect(body.errorCode).toBe('VALIDATION');
    expect(body.errorMessage, body.errorMessage).toContain('IBAN');
  });

  test('BC-S7: a bank account with a too-short swiftBicCode is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/bank-accounts`, {
      data: { name: 'Heal Bad SWIFT BA', iban: VALID_IBAN, swiftBicCode: 'AB' },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    const body = await res.json();
    expect(body.errorCode).toBe('VALIDATION');
    expect(body.errorMessage, body.errorMessage).toContain('SwiftBicCode');
  });
});
