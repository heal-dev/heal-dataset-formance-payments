// Tier-1 flow: Forward Bank Account (happy path).
//
// Asserts on the payments API the Console calls (Console UI 500s — setup-gap
// SG01). Forwarding is async: returns a taskID; an EXTERNAL account appears once
// the task completes.
//
// @worker: installs its own connector + bank account, forwards, cleans up.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker flow: bank-account-forward', () => {
  test('forward a bank account and see an external account appear', async ({ request }, testInfo) => {
    const ns = `w${testInfo.parallelIndex}`;
    const connectorName = `heal-fwd-${ns}`;
    let connectorId = '';
    let bankAccountId = '';

    await test.step('setup: install a connector and create a bank account', async () => {
      const list = await request.get(`${API}/v3/connectors`, { params: { pageSize: '100' } });
      const stale = ((await list.json())?.cursor?.data ?? []).find((c: any) => c.name === connectorName);
      if (stale) await request.delete(`${API}/v3/connectors/${stale.id}`).catch(() => {});

      const ci = await request.post(`${API}/v3/connectors/install/${SEED.dummypay.provider}`, {
        data: { name: connectorName, pollingPeriod: SEED.dummypay.pollingPeriod, directory: SEED.dummypay.directory },
      });
      expect(ci.status(), `install ${ci.status()}: ${await ci.text()}`).toBe(202);
      connectorId = (await ci.json()).data;

      const ba = await request.post(`${API}/v3/bank-accounts`, {
        data: { name: `Heal FW BA ${ns}`, iban: SEED.payout.bankAccount.iban, country: SEED.payout.bankAccount.country },
      });
      expect(ba.status(), `bank-account ${ba.status()}: ${await ba.text()}`).toBe(201);
      bankAccountId = (await ba.json()).data;
    });

    await test.step('forward the bank account to the connector', async () => {
      const res = await request.post(`${API}/v3/bank-accounts/${bankAccountId}/forward`, {
        data: { connectorID: connectorId },
      });
      expect(res.status(), `forward ${res.status()}: ${await res.text()}`).toBe(202);
      const taskID = (await res.json())?.data?.taskID;
      expect(taskID, 'a taskID should be returned in {data:{taskID}}').toBeTruthy();
    });

    await test.step('an external account for the connector becomes available', async () => {
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
