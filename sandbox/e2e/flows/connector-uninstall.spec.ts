// Tier-1 flow: Uninstall Connector (happy path).
//
// Asserts on the payments API the Console calls (/api/payments via the gateway;
// Console UI 500s — setup-gap SG01). Uninstall is async: DELETE returns a taskID
// and the connector disappears once the task completes.
//
// @worker: installs + uninstalls its own connector (self-owned).

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker flow: connector-uninstall', () => {
  test('install then uninstall a connector and see it removed', async ({ request }, testInfo) => {
    const ns = `w${testInfo.parallelIndex}`;
    const connectorName = `heal-uninstall-${ns}`;
    let connectorId = '';

    await test.step('setup: clear any leftover, then install a connector', async () => {
      const list = await request.get(`${API}/v3/connectors`, { params: { pageSize: '100' } });
      const rows: any[] = (await list.json())?.cursor?.data ?? [];
      const stale = rows.find((c) => c.name === connectorName);
      if (stale) await request.delete(`${API}/v3/connectors/${stale.id}`).catch(() => {});

      const res = await request.post(`${API}/v3/connectors/install/${SEED.dummypay.provider}`, {
        data: { name: connectorName, pollingPeriod: SEED.dummypay.pollingPeriod, directory: SEED.dummypay.directory },
      });
      expect(res.status(), `install returned ${res.status()}: ${await res.text()}`).toBe(202);
      connectorId = (await res.json()).data;
      expect(connectorId).toBeTruthy();
    });

    await test.step('uninstall the connector', async () => {
      const res = await request.delete(`${API}/v3/connectors/${connectorId}`);
      expect(res.status(), `uninstall returned ${res.status()}: ${await res.text()}`).toBe(202);
      const taskID = (await res.json())?.data?.taskID;
      expect(taskID, 'a taskID should be returned in {data:{taskID}}').toBeTruthy();
    });

    await test.step('the connector no longer appears in the installed-connectors list', async () => {
      await expect(async () => {
        const res = await request.get(`${API}/v3/connectors`, { params: { pageSize: '100' } });
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        expect(rows.some((c) => c.id === connectorId), 'connector still present after uninstall').toBe(false);
      }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 3_000] });
    });
  });
});
