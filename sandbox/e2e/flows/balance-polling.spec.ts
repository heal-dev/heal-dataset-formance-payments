// Tier-1 flow: Balance Polling (happy path — BP-S1).
//
// Asserts on the payments API the Console calls (Console UI 500s — setup-gap SG01).
// Walks the flow: install a connector → the real worker polls the internal accounts
// → fetch each account's balances → assert the seeded fixture amount + asset.
//
// @worker: installs its own connector, cleans up.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker flow: balance-polling', () => {
  test('the worker polls each internal account balance on install', async ({ request }, testInfo) => {
    const ns = `w${testInfo.parallelIndex}`;
    const connectorName = `heal-bp-${ns}`;
    let connectorId = '';
    const idByRef: Record<string, string> = {};

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
        const mine = rows.filter((a) => a.connectorID === connectorId);
        for (const acct of SEED.dummypay.accounts) {
          const row = mine.find((a) => a.reference === acct.reference);
          expect(row, `${acct.reference} not polled yet`).toBeTruthy();
          idByRef[acct.reference] = row.id;
        }
      }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
    });

    await test.step('each account balance is fetched with the seeded amount and asset', async () => {
      for (const acct of SEED.dummypay.accounts) {
        await expect(async () => {
          const res = await request.get(`${API}/v3/accounts/${idByRef[acct.reference]}/balances`, {
            params: { pageSize: '100' },
          });
          const rows: any[] = (await res.json())?.cursor?.data ?? [];
          const bal = rows.find((b) => b.asset === acct.asset);
          expect(bal, `no ${acct.asset} balance for ${acct.reference} yet`).toBeTruthy();
          expect(Number(bal.balance)).toBe(acct.balanceMinor);
        }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
      }
    });

    await test.step('teardown: uninstall the connector', async () => {
      if (connectorId) await request.delete(`${API}/v3/connectors/${connectorId}`).catch(() => {});
    });
  });
});
