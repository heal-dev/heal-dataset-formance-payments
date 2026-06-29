// Tier-1 flow: Payment Service User management (happy path — PSU-S1).
//
// Asserts on the payments API the Console calls (Console UI 500s — setup-gap SG01).
// Walks: create a PSU → see it in the list → fetch it and read its fields back.
//
// @worker: creates + deletes its own PSU. PSUs are pure-SUT entities (no PSP).

import { test, expect } from '@playwright/test';
import { GATEWAY_URL } from '../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker flow: payment-service-user-manage', () => {
  test('register a payment service user and read it back', async ({ request }, testInfo) => {
    const ns = `w${testInfo.parallelIndex}`;
    const psuName = `Heal Managed PSU ${ns}`;
    const email = `psu-${ns}@heal.dev`;
    let psuId = '';

    await test.step('create a payment service user', async () => {
      const res = await request.post(`${API}/v3/payment-service-users`, {
        data: { name: psuName, contactDetails: { email } },
      });
      expect(res.status(), `create ${res.status()}: ${await res.text()}`).toBeLessThan(300);
      psuId = (await res.json()).data;
      expect(psuId, 'a PSU id should be returned').toBeTruthy();
    });

    await test.step('the PSU appears in the payment service users list', async () => {
      await expect(async () => {
        const res = await request.get(`${API}/v3/payment-service-users`, { params: { pageSize: '100' } });
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        expect(rows.some((p) => p.id === psuId), 'created PSU not in the list').toBe(true);
      }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 3_000] });
    });

    await test.step('fetching the PSU returns its name and contact details', async () => {
      const res = await request.get(`${API}/v3/payment-service-users/${psuId}`);
      expect(res.status(), `get ${res.status()}: ${await res.text()}`).toBe(200);
      const psu = (await res.json()).data;
      expect(psu.name).toBe(psuName);
      expect(psu.contactDetails?.email).toBe(email);
    });

    await test.step('teardown: delete the PSU', async () => {
      if (psuId) await request.delete(`${API}/v3/payment-service-users/${psuId}`).catch(() => {});
    });
  });
});
