// Tier-2 edge (CI-S2): connector install config validation → 400 VALIDATION.
// API surface (SG01). @readonly — no mutation (all requests are rejected).

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@readonly scenario: connector-install CI-S2 config validation', () => {
  test('a config missing required fields is rejected with 400 VALIDATION', async ({ request }) => {
    await test.step('empty config {} → 400 VALIDATION (name required)', async () => {
      const res = await request.post(`${API}/v3/connectors/install/${SEED.dummypay.provider}`, {
        data: {},
      });
      expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
      const body = await res.json();
      expect(body.errorCode).toBe('VALIDATION');
    });

    await test.step('name only, no directory → 400 VALIDATION (directory required)', async () => {
      const res = await request.post(`${API}/v3/connectors/install/${SEED.dummypay.provider}`, {
        data: { name: 'heal-ci-s2-guard' },
      });
      expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
      const body = await res.json();
      expect(body.errorCode).toBe('VALIDATION');
    });
  });
});
