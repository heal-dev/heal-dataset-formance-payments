// Tier-2 edge (CI-S3): malformed JSON body should be a 4xx client error.
// API surface (SG01). @readonly — no mutation (request is rejected).
//
// EXPECTED RED — known divergence/candidate bug: the server currently returns
// 500 INTERNAL for a malformed body instead of a 4xx. The assertion is about the
// claim (a client error, not a server error); do not weaken it to go green.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@readonly scenario: connector-install CI-S3 malformed body', () => {
  test('a malformed JSON body is rejected as a 4xx client error (not 500)', async ({ request }) => {
    const res = await request.post(`${API}/v3/connectors/install/${SEED.dummypay.provider}`, {
      headers: { 'content-type': 'application/json' },
      data: '{bad-json',
    });
    expect(
      res.status(),
      `malformed body should be a 4xx client error, got ${res.status()}: ${await res.text()}`,
    ).toBeGreaterThanOrEqual(400);
    expect(
      res.status(),
      `malformed body should be a 4xx client error, not a 5xx server error (got ${res.status()})`,
    ).toBeLessThan(500);
  });
});
