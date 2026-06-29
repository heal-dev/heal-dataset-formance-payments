// Tier-2 edges (PM-S2 missing-name guard, PM-S3 delete). API surface (SG01).
// Serial: shares one connector + polled accounts set up once per worker.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker scenario: pool-management edges', () => {
  test.describe.configure({ mode: 'serial' });
  let connectorId = '';
  const memberIds: string[] = [];

  test.beforeAll(async ({ request }, workerInfo) => {
    const connectorName = `heal-pool-edge-w${workerInfo.parallelIndex}`;
    const list = await request.get(`${API}/v3/connectors`, { params: { pageSize: '100' } });
    const stale = ((await list.json())?.cursor?.data ?? []).find((c: any) => c.name === connectorName);
    if (stale) await request.delete(`${API}/v3/connectors/${stale.id}`).catch(() => {});

    const ci = await request.post(`${API}/v3/connectors/install/${SEED.dummypay.provider}`, {
      data: { name: connectorName, pollingPeriod: SEED.dummypay.pollingPeriod, directory: SEED.dummypay.directory },
    });
    connectorId = (await ci.json()).data;

    await expect(async () => {
      const res = await request.get(`${API}/v3/accounts`, { params: { pageSize: '100' } });
      const rows: any[] = (await res.json())?.cursor?.data ?? [];
      const byRef = Object.fromEntries(
        rows.filter((a) => a.connectorID === connectorId).map((a) => [a.reference, a.id]),
      );
      const ids = SEED.pool.memberRefs.map((ref) => byRef[ref]);
      expect(ids.every(Boolean)).toBe(true);
      memberIds.length = 0;
      memberIds.push(...ids);
    }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
  });

  test.afterAll(async ({ request }) => {
    if (connectorId) await request.delete(`${API}/v3/connectors/${connectorId}`).catch(() => {});
  });

  test('PM-S2: creating a pool without a name is rejected with 400 VALIDATION', async ({ request }) => {
    const res = await request.post(`${API}/v3/pools`, { data: { accountIDs: memberIds } });
    expect(res.status(), `got ${res.status()}: ${await res.text()}`).toBe(400);
    expect((await res.json()).errorCode).toBe('VALIDATION');
  });

  test('PM-S3: deleting a pool removes it from the list', async ({ request }) => {
    const create = await request.post(`${API}/v3/pools`, {
      data: { name: 'Heal Pool To Delete', accountIDs: memberIds },
    });
    expect(create.status(), `create ${create.status()}: ${await create.text()}`).toBeLessThan(300);
    const poolId = (await create.json()).data;
    expect(poolId).toBeTruthy();

    const del = await request.delete(`${API}/v3/pools/${poolId}`);
    expect(del.status(), `delete ${del.status()}: ${await del.text()}`).toBeLessThan(300);

    await expect(async () => {
      const res = await request.get(`${API}/v3/pools`, { params: { pageSize: '100' } });
      const rows: any[] = (await res.json())?.cursor?.data ?? [];
      expect(rows.some((p) => p.id === poolId), 'deleted pool still present').toBe(false);
    }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 3_000] });
  });
});
