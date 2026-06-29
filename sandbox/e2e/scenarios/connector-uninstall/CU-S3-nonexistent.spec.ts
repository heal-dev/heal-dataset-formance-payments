// Tier-2 edge (CU-S3): uninstalling a well-formed but non-existent connector
// should be a clean 4xx (e.g. 404), not a 500.
// API surface (SG01). @readonly — request is rejected, no mutation.
//
// EXPECTED RED — candidate bug: the server currently returns 500 INTERNAL for a
// non-existent connector. The assertion is about the claim (a client 4xx, not a
// 500 server error); do not weaken it to go green.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

// Well-formed connector id (base64url of {"Provider":"dummypay","Reference":<uuid>})
// for a connector that does not exist.
const NONEXISTENT_ID = Buffer.from(
  JSON.stringify({ Provider: 'dummypay', Reference: 'deadbeef-0000-4000-8000-000000000000' }),
).toString('base64url');

test.describe('@readonly scenario: connector-uninstall CU-S3 non-existent connector', () => {
  test('uninstalling a non-existent connector is rejected as a 4xx client error (not 500)', async ({ request }) => {
    const res = await request.delete(`${API}/v3/connectors/${NONEXISTENT_ID}`);
    expect(
      res.status(),
      `non-existent connector should be a 4xx client error, got ${res.status()}: ${await res.text()}`,
    ).toBeGreaterThanOrEqual(400);
    expect(
      res.status(),
      `non-existent connector should be a 4xx client error, not a 5xx server error (got ${res.status()})`,
    ).toBeLessThan(500);
  });
});
