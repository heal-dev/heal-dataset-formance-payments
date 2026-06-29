// Tier-2 edge (PIR-S5): reversing a well-formed but non-existent payment
// initiation is rejected 404 NOT_FOUND (the not-found check fires before the
// reverse workflow construction that 500s for valid initiations — PIR-S1).
// API surface (SG01). @readonly — request is rejected, no mutation.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

// A well-formed PaymentInitiationID (base64url of the canonical JSON) for an
// initiation that does not exist.
const NONEXISTENT_PI_ID = Buffer.from(
  JSON.stringify({
    ConnectorID: { Provider: 'dummypay', Reference: '00000000-0000-0000-0000-000000000001' },
    Reference: 'heal-nonexistent-pi',
  }),
).toString('base64url');

test.describe('@readonly scenario: payment-initiation-reverse PIR-S5 non-existent', () => {
  test('reversing a non-existent payment initiation is rejected with 404 NOT_FOUND', async ({ request }) => {
    const res = await request.post(`${API}/v3/payment-initiations/${NONEXISTENT_PI_ID}/reverse`, {
      data: { reference: 'hr-ne', amount: 100, asset: 'USD/2' },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(404);
    expect((await res.json()).errorCode).toBe('NOT_FOUND');
  });
});
