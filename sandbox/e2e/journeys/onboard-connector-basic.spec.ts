// Journey: Connector Installation & Discovery (level-0, sequential).
//
// Walks the arc end-to-end against the REAL stack: install a dummypay connector
// (the app's own real create path) → the REAL worker polls the mounted fixtures →
// assert the discovered accounts and balances. State accretes step → step in ONE
// test. Own namespace (unique connector name per run), sequential within,
// parallel-safe across.
//
// Assertion surface: the payments API the Console itself calls (/api/payments via
// the gateway). The Console v3 UI 500s on /connectivity/* (useRouteGuard/Header
// invariant bug — setup-gap SG01), so it is kept out of the assertion path; the
// payments service is the SUT and is asserted directly. If a fixed Console image
// lands, re-point these assertions at the rendered UI (SG01 → 'real' rung).

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../config';

// Through the gateway, exactly as the Console reaches payments (Caddy strips
// /api/payments → payments:8080).
const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker journey: onboard-connector-basic', () => {
  test('install a connector → discover its accounts → see their balances', async ({ request }, testInfo) => {
    // Own namespace so parallel journeys never collide on the connector name.
    const ns = `w${testInfo.parallelIndex}`;
    const connectorName = `${SEED.dummypay.installName}-${ns}`;
    let connectorId = '';

    // Self-heal: a prior run that failed before its teardown may have left a
    // same-named connector (install is unique-by-name → CONFLICT otherwise).
    // Uninstall any leftover and wait for it to disappear before installing.
    await test.step('setup: clear any leftover connector with this name', async () => {
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

    await test.step(`install a dummypay connector "${connectorName}" pointing at ${SEED.dummypay.directory}`, async () => {
      const res = await request.post(`${API}/v3/connectors/install/${SEED.dummypay.provider}`, {
        data: {
          name: connectorName,
          pollingPeriod: SEED.dummypay.pollingPeriod, // min 20m; first poll runs on install
          directory: SEED.dummypay.directory,
        },
      });
      expect(res.ok(), `install returned ${res.status()}: ${await res.text()}`).toBeTruthy();
      connectorId = (await res.json()).data;
      expect(connectorId, 'install should return a connector id').toBeTruthy();
    });

    await test.step('the connector appears in the installed connectors list', async () => {
      const res = await request.get(`${API}/v3/connectors`, { params: { pageSize: '100' } });
      expect(res.ok()).toBeTruthy();
      const rows: any[] = (await res.json())?.cursor?.data ?? [];
      const mine = rows.find((c) => c.id === connectorId);
      expect(mine, `connector ${connectorName} not in installed list`).toBeTruthy();
      expect(mine.name).toBe(connectorName);
      expect(mine.provider).toBe(SEED.dummypay.provider);
    });

    await test.step('the worker polls and discovers the two fixture accounts for this connector', async () => {
      // Polling is async (worker runs the install workflow); wait for it deterministically.
      await expect(async () => {
        const res = await request.get(`${API}/v3/accounts`, { params: { pageSize: '100' } });
        expect(res.ok()).toBeTruthy();
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        const mine = rows.filter((a) => a.connectorID === connectorId);
        const refs = mine.map((a) => a.reference).sort();
        expect(refs).toEqual(
          SEED.dummypay.accounts.map((a) => a.reference).sort(),
        );
      }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
    });

    await test.step('the discovered account heal-dummy-acct-001 shows balance 1500000 USD/2', async () => {
      // Find this connector's account id for acct-001, then read its balances.
      const accRes = await request.get(`${API}/v3/accounts`, { params: { pageSize: '100' } });
      const accRows: any[] = (await accRes.json())?.cursor?.data ?? [];
      const acct1 = accRows.find(
        (a) => a.connectorID === connectorId && a.reference === SEED.dummypay.accounts[0].reference,
      );
      expect(acct1, 'acct-001 should exist for this connector').toBeTruthy();

      await expect(async () => {
        const res = await request.get(`${API}/v3/accounts/${acct1.id}/balances`);
        expect(res.ok()).toBeTruthy();
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        const usd = rows.find((b) => b.asset === SEED.dummypay.accounts[0].asset);
        expect(usd, 'a USD/2 balance row should be present').toBeTruthy();
        expect(Number(usd.balance)).toBe(SEED.dummypay.accounts[0].balanceMinor);
      }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
    });

    // Cleanup: uninstall the connector so reruns start clean (truncate-per-file
    // also resets, but uninstalling is the faithful teardown).
    await test.step('teardown: uninstall the connector', async () => {
      if (connectorId) {
        await request.delete(`${API}/v3/connectors/${connectorId}`).catch(() => {});
      }
    });
  });
});
