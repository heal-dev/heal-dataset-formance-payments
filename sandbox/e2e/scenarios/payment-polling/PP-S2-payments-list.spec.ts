// Tier-2 edge (PP-S2): the payments list/query surface returns recorded payments.
// API surface (SG01). @readonly — asserts on the golden-seeded payment, no mutation.
//
// NOTE: this covers the LIST surface only. The polling-INGESTION happy path (PP-S1)
// is blocked by setup-gap SG02 — dummypay's FetchNextPayments facade hard-codes an
// empty list and never reads payments.json, so the worker ingests no payments. That
// claim is adjudicated as a setup-gap at verify, NOT faked here by seeding a payment
// and calling it "polled".

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@readonly scenario: payment-polling payments list', () => {
  test('PP-S2: the seeded payment appears in the payments list with its fields', async ({ request }) => {
    const res = await request.get(`${API}/v3/payments`, { params: { pageSize: '100' } });
    expect(res.status(), `payments list ${res.status()}: ${await res.text()}`).toBe(200);
    const rows: any[] = (await res.json())?.cursor?.data ?? [];

    const seeded = rows.find((p) => p.reference === SEED.payment.reference);
    expect(seeded, `seeded payment ${SEED.payment.reference} not in the payments list`).toBeTruthy();
    expect(String(seeded.type)).toBe(SEED.payment.type); // PAY-IN
    expect(String(seeded.status)).toBe(SEED.payment.status); // SUCCEEDED
    expect(seeded.asset).toBe(SEED.payment.asset); // USD/2
  });
});
