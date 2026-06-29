// Tier-2 edge (CI-S5): an empty JSON object {} as the install config is
// rejected by provider config validation (required Name field missing).
// API surface (SG01). @readonly — no mutation (request is rejected).

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@readonly scenario: connector-install CI-S5 empty config', () => {
  test('installing with an empty {} config is rejected 400 VALIDATION (Name required)', async ({ request }) => {
    const res = await request.post(`${API}/v3/connectors/install/${SEED.dummypay.provider}`, {
      headers: { 'content-type': 'application/json' },
      data: {},
    });
    expect(
      res.status(),
      `empty config should be a 400 VALIDATION, got ${res.status()}: ${await res.text()}`,
    ).toBe(400);
    const body = await res.json();
    expect(body.errorCode, JSON.stringify(body)).toBe('VALIDATION');
    expect(
      body.errorMessage,
      `expected the Name-required validation message, got: ${body.errorMessage}`,
    ).toContain('Name');
  });
});
