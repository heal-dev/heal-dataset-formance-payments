// Journey: Account Pool & Balance Aggregation (level-0, sequential).
//
// Walks the arc against the REAL stack: install a dummypay connector → the REAL
// worker polls its accounts → create a REAL pool grouping them → query the pool's
// REAL aggregate balances. State accretes step → step in ONE test. Own namespace,
// sequential within, parallel-safe across.
//
// Assertion surface: the payments API the Console itself calls (/api/payments via
// the gateway). The Console v3 UI 500s on /connectivity/* (useRouteGuard bug —
// setup-gap SG01), so it is kept out of the assertion path; payments is the SUT.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker journey: pool-balance-snapshot', () => {
  test('install → poll accounts → pool them → read aggregate balances', async ({ request }, testInfo) => {
    const ns = `w${testInfo.parallelIndex}`;
    const connectorName = `heal-pool-${ns}`;
    const poolName = `heal-pool-${ns}`;
    let connectorId = '';
    let poolId = '';
    const accountIds: string[] = [];

    await test.step('setup: clear any leftover pool + connector with these names', async () => {
      // Pool create is unique-by-name → CONFLICT if a prior run left one. Clear it.
      const pools = await request.get(`${API}/v3/pools`, { params: { pageSize: '100' } });
      const prows: any[] = (await pools.json())?.cursor?.data ?? [];
      const stalePool = prows.find((p) => p.name === poolName);
      if (stalePool) await request.delete(`${API}/v3/pools/${stalePool.id}`).catch(() => {});

      const list = await request.get(`${API}/v3/connectors`, { params: { pageSize: '100' } });
      const rows: any[] = (await list.json())?.cursor?.data ?? [];
      const stale = rows.find((c) => c.name === connectorName);
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
      expect(res.ok(), `install returned ${res.status()}: ${await res.text()}`).toBeTruthy();
      connectorId = (await res.json()).data;
      expect(connectorId).toBeTruthy();
    });

    await test.step('the worker polls and both internal accounts become available', async () => {
      await expect(async () => {
        const res = await request.get(`${API}/v3/accounts`, { params: { pageSize: '100' } });
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        const mine = rows.filter((a) => a.connectorID === connectorId);
        const byRef = Object.fromEntries(mine.map((a) => [a.reference, a.id]));
        for (const ref of SEED.pool.memberRefs) {
          expect(byRef[ref], `account ${ref} not polled yet`).toBeTruthy();
        }
        accountIds.length = 0;
        accountIds.push(...SEED.pool.memberRefs.map((ref) => byRef[ref]));
      }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
    });

    await test.step('create a pool grouping the two accounts', async () => {
      const res = await request.post(`${API}/v3/pools`, {
        data: { name: poolName, accountIDs: accountIds },
      });
      expect(res.ok(), `pool create returned ${res.status()}: ${await res.text()}`).toBeTruthy();
      poolId = (await res.json()).data;
      expect(poolId, 'a pool id should be returned').toBeTruthy();

      const list = await request.get(`${API}/v3/pools`, { params: { pageSize: '100' } });
      const rows: any[] = (await list.json())?.cursor?.data ?? [];
      expect(rows.some((p) => p.id === poolId), 'pool not in pools list').toBeTruthy();
    });

    await test.step('the pool aggregate balances match the seeded fixtures', async () => {
      await expect(async () => {
        const res = await request.get(`${API}/v3/pools/${poolId}/balances/latest`);
        expect(res.ok()).toBeTruthy();
        const rows: any[] = (await res.json())?.data ?? [];
        const byAsset = Object.fromEntries(rows.map((b) => [b.asset, Number(b.amount)]));
        for (const { asset, amount } of SEED.pool.aggregate) {
          expect(byAsset[asset], `no aggregate for ${asset}`).toBe(amount);
        }
      }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
    });

    await test.step('teardown: delete the pool and uninstall the connector', async () => {
      if (poolId) await request.delete(`${API}/v3/pools/${poolId}`).catch(() => {});
      if (connectorId) await request.delete(`${API}/v3/connectors/${connectorId}`).catch(() => {});
    });
  });
});
