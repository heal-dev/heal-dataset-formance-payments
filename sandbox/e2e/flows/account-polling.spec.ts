// Tier-1 flow: Account Polling (happy path — AP-S1).
//
// Asserts on the payments API the Console calls (Console UI 500s — setup-gap SG01).
// Walks the flow: install a connector → the real worker polls the PSP fixtures →
// the two internal accounts appear in GET /v3/accounts with type INTERNAL and the
// seeded asset/name.
//
// @worker: installs its own connector, cleans up.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker flow: account-polling', () => {
  test('the worker polls the connector internal accounts on install', async ({ request }, testInfo) => {
    const ns = `w${testInfo.parallelIndex}`;
    const connectorName = `heal-ap-${ns}`;
    let connectorId = '';

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

    await test.step('the worker polls and both internal accounts appear with the seeded asset', async () => {
      const [a1, a2] = SEED.dummypay.accounts; // acct-001 USD/2, acct-002 EUR/2
      await expect(async () => {
        const res = await request.get(`${API}/v3/accounts`, { params: { pageSize: '100' } });
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        const mine = rows.filter((a) => a.connectorID === connectorId);
        const byRef = Object.fromEntries(mine.map((a) => [a.reference, a]));

        const first = byRef[a1.reference];
        expect(first, `${a1.reference} not polled yet`).toBeTruthy();
        expect(String(first.type)).toBe('INTERNAL');
        expect(first.defaultAsset).toBe(a1.asset);

        const second = byRef[a2.reference];
        expect(second, `${a2.reference} not polled yet`).toBeTruthy();
        expect(String(second.type)).toBe('INTERNAL');
        expect(second.defaultAsset).toBe(a2.asset);
      }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
    });

    await test.step('teardown: uninstall the connector', async () => {
      if (connectorId) await request.delete(`${API}/v3/connectors/${connectorId}`).catch(() => {});
    });
  });
});
