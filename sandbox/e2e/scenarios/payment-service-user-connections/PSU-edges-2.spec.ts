// Tier-2 edges (PSU-S5..PSU-S8): PSU create validation + get/delete not-found guards.
// API surface (SG01). @readonly — all requests are rejected, no mutation.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;
const NONEXISTENT_PSU = 'deadbeef-0000-4000-8000-000000000000';

test.describe('@readonly scenario: payment-service-user-connections edges (2)', () => {
  test('PSU-S5: creating a PSU with an invalid email is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/payment-service-users`, {
      data: { name: 'Heal Bad Email PSU', contactDetails: { email: 'not-an-email' } },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    const body = await res.json();
    expect(body.errorCode).toBe('VALIDATION');
    expect(body.errorMessage, body.errorMessage).toContain('Email');
  });

  test('PSU-S6: creating a PSU with a malformed bankAccountID is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/payment-service-users`, {
      data: { name: 'Heal Bad BA PSU', bankAccountIDs: ['not-a-uuid'] },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    const body = await res.json();
    expect(body.errorCode).toBe('VALIDATION');
    expect(body.errorMessage, body.errorMessage).toContain('BankAccountIDs');
  });

  test('PSU-S7: fetching a non-existent PSU is rejected with 404 NOT_FOUND', async ({ request }) => {
    const res = await request.get(`${API}/v3/payment-service-users/${NONEXISTENT_PSU}`);
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(404);
    expect((await res.json()).errorCode).toBe('NOT_FOUND');
  });

  test('PSU-S8: deleting a non-existent PSU is rejected with 404 NOT_FOUND', async ({ request }) => {
    const res = await request.delete(`${API}/v3/payment-service-users/${NONEXISTENT_PSU}`);
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(404);
    expect((await res.json()).errorCode).toBe('NOT_FOUND');
  });
});
