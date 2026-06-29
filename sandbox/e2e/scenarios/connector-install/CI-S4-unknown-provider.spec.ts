// Tier-2 edge (CI-S4): unknown provider should be a 4xx client error.
// API surface (SG01). @readonly — no mutation (request is rejected).
//
// EXPECTED RED — known divergence/candidate bug: the server currently returns
// 500 INTERNAL for an unknown provider instead of a 4xx. The assertion is about
// the claim (a client error); do not weaken it to go green.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@readonly scenario: connector-install CI-S4 unknown provider', () => {
  test('an unknown provider is rejected as a 4xx client error (not 500)', async ({ request }) => {
    const res = await request.post(`${API}/v3/connectors/install/nosuchprovider`, {
      data: { name: 'heal-ci-s4-unknownprov' },
    });
    expect(
      res.status(),
      `unknown provider should be a 4xx client error, got ${res.status()}: ${await res.text()}`,
    ).toBeGreaterThanOrEqual(400);
    expect(
      res.status(),
      `unknown provider should be a 4xx client error, not a 5xx server error (got ${res.status()})`,
    ).toBeLessThan(500);
  });
});
