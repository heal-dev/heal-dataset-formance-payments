// Tier-2 edge (CU-S2): invalid connector id on uninstall → 400 INVALID_ID.
// API surface (SG01). @readonly — request is rejected, no mutation.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@readonly scenario: connector-uninstall CU-S2 invalid id', () => {
  test('uninstalling with a malformed connector id is rejected with 400 INVALID_ID', async ({ request }) => {
    const res = await request.delete(`${API}/v3/connectors/not-a-valid-id`);
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    const body = await res.json();
    expect(body.errorCode).toBe('INVALID_ID');
  });
});
