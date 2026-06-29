// Tier-2 edge (CI-S6): an install body larger than the 500000-byte connector
// config limit is rejected 413 Request Entity Too Large.
// API surface (SG01). @readonly — no mutation (request is rejected).

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@readonly scenario: connector-install CI-S6 oversized body', () => {
  test('installing with a body over the 500000-byte limit is rejected 413', async ({ request }) => {
    // ~600KB payload, comfortably over connectorConfigMaxBytes (500000).
    const oversized = JSON.stringify({ name: 'big', padding: 'A'.repeat(600_000) });
    const res = await request.post(`${API}/v3/connectors/install/${SEED.dummypay.provider}`, {
      headers: { 'content-type': 'application/json' },
      data: oversized,
    });
    expect(
      res.status(),
      `oversized body should be 413 Request Entity Too Large, got ${res.status()}: ${await res.text()}`,
    ).toBe(413);
    const body = await res.json();
    expect(body.errorCode, JSON.stringify(body)).toBe('MISSING_OR_INVALID_BODY');
  });
});
