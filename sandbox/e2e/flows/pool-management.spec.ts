// Tier-1 flow: Pool Management (happy path — PM-S1).
//
// Asserts on the payments API the Console calls (Console UI 500s — setup-gap SG01).
// Walks the flow: install a connector → poll its two internal accounts → create a
// static pool grouping them → see it in the pools list → read /balances/latest and
// assert the per-asset aggregate equals the members' seeded balances.
//
// @worker: installs its own connector, creates + deletes its own pool, cleans up.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker flow: pool-management', () => {
  test('create a pool and read its aggregate balances', async ({ request }, testInfo) => {
    const ns = `w${testInfo.parallelIndex}`;
    const connectorName = `heal-pool-${ns}`;
    let connectorId = '';
    let poolId = '';
    const memberIds: string[] = [];

    await test.step('setup: clear any leftover connector with this name', async () => {
      const list = await request.get(`${API}/v3/connectors`, { params: { pageSize: '100' } });
      const stale = ((await list.json())?.cursor?.data ?? []).find((c: any) => c.name === connectorName);
      if (stale) {
        await request.delete(`${API}/v3/connectors/${stale.id}`).catch(() => {});
        await expect(async () => {
          const r = await request.get(`${API}/v3/connectors`, { params: { pageSize: '100' } });
          const cur: any[] = (await r.json())?.cursor?.data ?? [];
          expect(cur.some((c) => c.name === connectorName)).toBe(false);
        }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 3_000] });
      }
    });

    await test.step(`install dummypay connector "${connectorName}"`, async () => {
      const res = await request.post(`${API}/v3/connectors/install/${SEED.dummypay.provider}`, {
        data: { name: connectorName, pollingPeriod: SEED.dummypay.pollingPeriod, directory: SEED.dummypay.directory },
      });
      expect(res.status(), `install ${res.status()}: ${await res.text()}`).toBe(202);
      connectorId = (await res.json()).data;
    });

    await test.step('the worker polls the two internal accounts', async () => {
      await expect(async () => {
        const res = await request.get(`${API}/v3/accounts`, { params: { pageSize: '100' } });
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        const byRef = Object.fromEntries(
          rows.filter((a) => a.connectorID === connectorId).map((a) => [a.reference, a.id]),
        );
        const ids = SEED.pool.memberRefs.map((ref) => byRef[ref]);
        expect(ids.every(Boolean), 'both pool member accounts not polled yet').toBe(true);
        memberIds.length = 0;
        memberIds.push(...ids);
      }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
    });

    await test.step('create a static pool grouping the two accounts', async () => {
      const res = await request.post(`${API}/v3/pools`, {
        data: { name: `Heal Pool ${ns}`, accountIDs: memberIds },
      });
      expect(res.status(), `pool create ${res.status()}: ${await res.text()}`).toBeLessThan(300);
      poolId = (await res.json()).data;
      expect(poolId, 'a pool id should be returned').toBeTruthy();
    });

    await test.step('the pool appears in the pools list', async () => {
      await expect(async () => {
        const res = await request.get(`${API}/v3/pools`, { params: { pageSize: '100' } });
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        expect(rows.some((p) => p.id === poolId), 'created pool not in the list').toBe(true);
      }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 3_000] });
    });

    await test.step('the pool latest balances show the per-asset aggregate of the members', async () => {
      await expect(async () => {
        const res = await request.get(`${API}/v3/pools/${poolId}/balances/latest`);
        const rows: any[] = (await res.json())?.data ?? [];
        const byAsset = Object.fromEntries(rows.map((b) => [b.asset, Number(b.amount)]));
        for (const { asset, amount } of SEED.pool.aggregate) {
          expect(byAsset[asset], `no aggregate for ${asset} yet`).toBe(amount);
        }
      }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 3_000] });
    });

    await test.step('teardown: delete the pool and uninstall the connector', async () => {
      if (poolId) await request.delete(`${API}/v3/pools/${poolId}`).catch(() => {});
      if (connectorId) await request.delete(`${API}/v3/connectors/${connectorId}`).catch(() => {});
    });
  });
});
