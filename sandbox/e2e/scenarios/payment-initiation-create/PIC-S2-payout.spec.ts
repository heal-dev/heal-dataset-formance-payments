// Tier-2 edge (PIC-S2): initiate a PAYOUT to a forwarded external account.
// Distinct from the Tier-1 TRANSFER flow — a PAYOUT needs an EXTERNAL destination,
// so this test creates + forwards a bank account, then initiates the payout.
// API surface (SG01). @worker — installs its own connector + bank account, cleans up.

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker scenario: payment-initiation-create payout', () => {
  test('PIC-S2: initiate a PAYOUT to a forwarded external account', async ({ request }, testInfo) => {
    const ns = `w${testInfo.parallelIndex}`;
    const connectorName = `heal-pic-po-${ns}`;
    const payoutRef = `hpo-${ns}`; // SHORT (Temporal WorkflowId length limit)
    let connectorId = '';
    let srcId = '';
    let externalId = '';

    await test.step('setup: install a connector and poll the internal source account', async () => {
      const list = await request.get(`${API}/v3/connectors`, { params: { pageSize: '100' } });
      const stale = ((await list.json())?.cursor?.data ?? []).find((c: any) => c.name === connectorName);
      if (stale) await request.delete(`${API}/v3/connectors/${stale.id}`).catch(() => {});

      const ci = await request.post(`${API}/v3/connectors/install/${SEED.dummypay.provider}`, {
        data: { name: connectorName, pollingPeriod: SEED.dummypay.pollingPeriod, directory: SEED.dummypay.directory },
      });
      expect(ci.status(), `install ${ci.status()}: ${await ci.text()}`).toBe(202);
      connectorId = (await ci.json()).data;

      await expect(async () => {
        const res = await request.get(`${API}/v3/accounts`, { params: { pageSize: '100' } });
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        const src = rows.find((a) => a.connectorID === connectorId && a.reference === SEED.payout.sourceRef);
        expect(src, 'internal source account not polled yet').toBeTruthy();
        srcId = src.id;
      }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
    });

    await test.step('create a bank account and forward it so an external account appears', async () => {
      const ba = await request.post(`${API}/v3/bank-accounts`, {
        data: { name: `Heal PO BA ${ns}`, iban: SEED.payout.bankAccount.iban, country: SEED.payout.bankAccount.country },
      });
      expect(ba.status(), `bank-account ${ba.status()}: ${await ba.text()}`).toBe(201);
      const bankAccountId = (await ba.json()).data;

      const fwd = await request.post(`${API}/v3/bank-accounts/${bankAccountId}/forward`, {
        data: { connectorID: connectorId },
      });
      expect(fwd.status(), `forward ${fwd.status()}: ${await fwd.text()}`).toBe(202);

      await expect(async () => {
        const res = await request.get(`${API}/v3/accounts`, { params: { pageSize: '100' } });
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        const ext = rows.find((a) => a.connectorID === connectorId && String(a.type) === 'EXTERNAL');
        expect(ext, 'no EXTERNAL account surfaced after forward').toBeTruthy();
        externalId = ext.id;
      }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
    });

    await test.step('initiate a PAYOUT from the internal account to the external account', async () => {
      const scheduledAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request.post(`${API}/v3/payment-initiations`, {
        data: {
          reference: payoutRef,
          scheduledAt,
          connectorID: connectorId,
          description: 'heal payment-initiation-create payout',
          type: SEED.payout.type,
          amount: SEED.payout.amountMinor,
          asset: SEED.payout.asset,
          sourceAccountID: srcId,
          destinationAccountID: externalId,
        },
      });
      expect(res.status(), `payout create returned ${res.status()}: ${await res.text()}`).toBe(202);
      const data = (await res.json())?.data;
      expect(data?.paymentInitiationID, 'a payment initiation id should be returned').toBeTruthy();
    });

    await test.step('the payout is recorded as a PAYOUT in the payment-initiations list', async () => {
      await expect(async () => {
        const res = await request.get(`${API}/v3/payment-initiations`, { params: { pageSize: '100' } });
        const rows: any[] = (await res.json())?.cursor?.data ?? [];
        const mine = rows.find((p) => p.reference === payoutRef);
        expect(mine, `payout ${payoutRef} not found in payment-initiations`).toBeTruthy();
        expect(String(mine.type)).toBe(SEED.payout.type);
      }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 3_000] });
    });

    await test.step('teardown: uninstall the connector', async () => {
      if (connectorId) await request.delete(`${API}/v3/connectors/${connectorId}`).catch(() => {});
    });
  });
});
