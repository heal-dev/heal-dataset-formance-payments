// Tier-1 flow: Install Connector (happy path).
//
// Asserts on the payments API the Console itself calls (/api/payments via the
// gateway). The Console v3 UI 500s on /connectivity/* (setup-gap SG01), so it is
// kept out of the assertion path; payments is the SUT.
//
// @worker: installs its own connector (self-owned mutation), cleans it up.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker flow: connector-install', () => {
  test('install a connector for a known provider and see it listed', async ({ request }, testInfo) => {
    const ns = `w${testInfo.parallelIndex}`;
    const connectorName = `heal-install-${ns}`;
    let connectorId = '';

    await test.step('setup: clear any leftover connector with this name', async () => {
      const list = await request.get(`${API}/v3/connectors`, { params: { pageSize: '100' } });
      const rows: any[] = (await list.json())?.cursor?.data ?? [];
      const stale = rows.find((c) => c.name === connectorName);
      if (stale) await request.delete(`${API}/v3/connectors/${stale.id}`).catch(() => {});
    });

    await test.step(`install dummypay connector "${connectorName}"`, async () => {
      const res = await request.post(`${API}/v3/connectors/install/${SEED.dummypay.provider}`, {
        data: { name: connectorName, pollingPeriod: SEED.dummypay.pollingPeriod, directory: SEED.dummypay.directory },
      });
      expect(res.status(), `install returned ${res.status()}: ${await res.text()}`).toBe(202);
      connectorId = (await res.json()).data;
      expect(connectorId, 'a connector id should be returned in {data}').toBeTruthy();
    });

    await test.step('the connector appears in the installed-connectors list with the expected shape', async () => {
      await expect(async () => {
        const res = await request.get(`${API}/v3/connectors`, { params: { pageSize: '100' } });
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        const mine = rows.find((c) => c.id === connectorId);
        expect(mine, `connector ${connectorName} not found in list`).toBeTruthy();
        expect(mine.provider).toBe('dummypay');
        expect(mine.name).toBe(connectorName);
        const caps: string[] = mine.capabilities ?? [];
        for (const cap of ['FETCH_ACCOUNTS', 'FETCH_BALANCES', 'CREATE_TRANSFER', 'CREATE_PAYOUT']) {
          expect(caps, `capability ${cap} missing`).toContain(cap);
        }
      }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 3_000] });
    });

    await test.step('teardown: uninstall the connector', async () => {
      if (connectorId) await request.delete(`${API}/v3/connectors/${connectorId}`).catch(() => {});
    });
  });
});
