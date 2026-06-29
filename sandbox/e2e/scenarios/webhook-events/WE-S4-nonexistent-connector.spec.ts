// Tier-2 edge (WE-S4): a webhook to a well-formed but non-existent connector is
// rejected 404 NOT_FOUND — distinct from WE-S3, where an EXISTING connector with
// no webhook config currently 500s.
// API surface (SG01). @readonly — request is rejected, no mutation.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

// A well-formed dummypay connectorID for a connector that does not exist.
const NONEXISTENT_CONNECTOR_ID = Buffer.from(
  JSON.stringify({ Provider: 'dummypay', Reference: 'deadbeef-0000-4000-8000-000000000000' }),
).toString('base64url');

test.describe('@readonly scenario: webhook-events WE-S4 non-existent connector', () => {
  test('a webhook to a non-existent connector is rejected with 404 NOT_FOUND', async ({ request }) => {
    const res = await request.post(`${API}/v3/connectors/webhooks/${NONEXISTENT_CONNECTOR_ID}/test-event`, {
      data: { event: 'x' },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(404);
    expect((await res.json()).errorCode).toBe('NOT_FOUND');
  });
});
