// Tier-2 edges (PSU-S2 missing-name guard, PSU-S3 delete). API surface (SG01).
// @worker — creates/deletes its own PSUs; no shared state, but kept serial for clarity.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker scenario: payment-service-user edges', () => {
  test.describe.configure({ mode: 'serial' });

  test('PSU-S2: creating a PSU without a name is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/payment-service-users`, {
      data: { contactDetails: { email: 'noname@heal.dev' } },
    });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('VALIDATION');
  });

  test('PSU-S3: deleting a PSU removes it from the list', async ({ request }, testInfo) => {
    const ns = `w${testInfo.parallelIndex}`;
    const create = await request.post(`${API}/v3/payment-service-users`, {
      data: { name: `Heal PSU To Delete ${ns}` },
    });
    expect(create.status(), `create ${create.status()}: ${await create.text()}`).toBeLessThan(300);
    const psuId = (await create.json()).data;
    expect(psuId).toBeTruthy();

    const del = await request.delete(`${API}/v3/payment-service-users/${psuId}`);
    expect(del.status(), `delete ${del.status()}: ${await del.text()}`).toBeLessThan(300);

    await expect(async () => {
      const res = await request.get(`${API}/v3/payment-service-users`, { params: { pageSize: '100' } });
      const rows: any[] = (await res.json())?.cursor?.data ?? [];
      expect(rows.some((p) => p.id === psuId), 'deleted PSU still present').toBe(false);
    }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 3_000] });
  });
});
