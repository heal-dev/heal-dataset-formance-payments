// e2e/specs/skeleton.spec.ts — Stage 0 walking skeleton.
//
// Journey: the full chain serves one seeded Payment.
//   Browser/HTTP → Console (:3000) is up, AND
//   gateway (:8092) → payments API → Postgres returns the seeded payment.
//
// This is the thinnest spec that proves the stack boots and the golden seed is
// readable end-to-end. No auth (local stack is open). Read-only: asserts on the
// golden core, mutates nothing → @readonly.
//
// The load-bearing assertion is the API read (deterministic, selector-free). The
// Console page-load confirms the frontend serves; once we observe the real
// Console DOM at runtime we can tighten it to assert the payment row in the UI.

import { test, expect } from '../data/fixtures';
import { SEED } from '../data/seed';
import { CONSOLE_ENTRY, GATEWAY_URL } from '../../config';

test.describe('@readonly skeleton: Console + seeded Payment', () => {
  test('the seeded payment is served through the gateway → payments API', async ({ request }) => {
    // Host vantage: gateway strips /api/payments → payments:8080 (see Caddyfile).
    const res = await request.get(`${GATEWAY_URL}/api/payments/v3/payments`, {
      params: { pageSize: '100' },
    });
    expect(res.ok(), `GET /v3/payments returned ${res.status()}`).toBeTruthy();

    const body = await res.json();
    const rows: any[] = body?.cursor?.data ?? body?.data ?? [];
    expect(Array.isArray(rows), 'payments list should be an array').toBeTruthy();

    const seeded = rows.find(
      (p) => p?.id === SEED.payment.id || p?.reference === SEED.payment.reference,
    );
    expect(seeded, `seeded payment ${SEED.payment.reference} not found in list`).toBeTruthy();
    expect(seeded.reference).toBe(SEED.payment.reference);
    expect(String(seeded.type)).toBe(SEED.payment.type);
  });

  test('the Console frontend serves the entry screen', async ({ page }) => {
    const res = await page.goto(CONSOLE_ENTRY, { waitUntil: 'domcontentloaded' });
    // Console may redirect / render a SPA shell; any served HTML (not a network
    // error) proves the frontend is up. Tighten to a payment-row assertion once
    // the real Console DOM is observed.
    expect(res, 'no response from Console').toBeTruthy();
    expect(res!.status(), `Console returned ${res!.status()}`).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });
});
