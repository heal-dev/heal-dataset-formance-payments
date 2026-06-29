// Tier-2 edge (AP-S2): a forwarded bank account is fetched as an EXTERNAL account.
// Distinct from the Tier-1 internal-account poll. API surface (SG01).
// @worker — installs its own connector + bank account, forwards, cleans up.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker scenario: account-polling external account', () => {
  test('AP-S2: a forwarded bank account appears as an EXTERNAL account', async ({ request }, testInfo) => {
    const ns = `w${testInfo.parallelIndex}`;
    const connectorName = `heal-ap-ext-${ns}`;
    let connectorId = '';

    await test.step('setup: install a connector and create + forward a bank account', async () => {
      const list = await request.get(`${API}/v3/connectors`, { params: { pageSize: '100' } });
      const stale = ((await list.json())?.cursor?.data ?? []).find((c: any) => c.name === connectorName);
      if (stale) await request.delete(`${API}/v3/connectors/${stale.id}`).catch(() => {});

      const ci = await request.post(`${API}/v3/connectors/install/${SEED.dummypay.provider}`, {
        data: { name: connectorName, pollingPeriod: SEED.dummypay.pollingPeriod, directory: SEED.dummypay.directory },
      });
      expect(ci.status(), `install ${ci.status()}: ${await ci.text()}`).toBe(202);
      connectorId = (await ci.json()).data;

      const ba = await request.post(`${API}/v3/bank-accounts`, {
        data: { name: `Heal AP Ext ${ns}`, iban: SEED.payout.bankAccount.iban, country: SEED.payout.bankAccount.country },
      });
      expect(ba.status(), `bank-account ${ba.status()}: ${await ba.text()}`).toBe(201);
      const bankAccountId = (await ba.json()).data;

      const fwd = await request.post(`${API}/v3/bank-accounts/${bankAccountId}/forward`, {
        data: { connectorID: connectorId },
      });
      expect(fwd.status(), `forward ${fwd.status()}: ${await fwd.text()}`).toBe(202);
    });

    await test.step('an EXTERNAL account for the connector becomes available', async () => {
      await expect(async () => {
        const res = await request.get(`${API}/v3/accounts`, { params: { pageSize: '100' } });
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        const ext = rows.find((a) => a.connectorID === connectorId && String(a.type) === 'EXTERNAL');
        expect(ext, 'no EXTERNAL account surfaced after forward').toBeTruthy();
      }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
    });

    await test.step('teardown: uninstall the connector', async () => {
      if (connectorId) await request.delete(`${API}/v3/connectors/${connectorId}`).catch(() => {});
    });
  });
});
