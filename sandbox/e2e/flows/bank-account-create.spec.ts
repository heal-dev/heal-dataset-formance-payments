// Tier-1 flow: Create Bank Account (happy path).
//
// Asserts on the payments API the Console calls (Console UI 500s — setup-gap
// SG01). Sensitive fields (iban/accountNumber/swiftBicCode) are encrypted at rest
// and read back as null, so assert by id/name/country.
//
// @worker: creates its own bank account (self-owned, uniquely named per worker).

import { test, expect } from '@playwright/test';
import { GATEWAY_URL, SEED } from '../../config';

const API = `${GATEWAY_URL}/api/payments`;

test.describe('@worker flow: bank-account-create', () => {
  test('create a bank account with a name and IBAN and see it listed', async ({ request }, testInfo) => {
    const ns = `w${testInfo.parallelIndex}`;
    const name = `Heal BA ${ns} ${testInfo.testId.slice(0, 6)}`;
    let bankAccountId = '';

    await test.step('create the bank account', async () => {
      const res = await request.post(`${API}/v3/bank-accounts`, {
        data: {
          name,
          iban: SEED.payout.bankAccount.iban,
          swiftBicCode: SEED.payout.bankAccount.swiftBicCode,
          country: SEED.payout.bankAccount.country,
        },
      });
      expect(res.status(), `create returned ${res.status()}: ${await res.text()}`).toBe(201);
      bankAccountId = (await res.json()).data;
      expect(bankAccountId, 'a bank account id should be returned in {data}').toBeTruthy();
    });

    await test.step('the bank account appears in the list with the expected shape', async () => {
      const res = await request.get(`${API}/v3/bank-accounts`, { params: { pageSize: '100' } });
      const rows: any[] = (await res.json())?.cursor?.data ?? [];
      const mine = rows.find((b) => b.id === bankAccountId);
      expect(mine, `bank account ${bankAccountId} not found in list`).toBeTruthy();
      expect(mine.name).toBe(name);
      expect(mine.country).toBe(SEED.payout.bankAccount.country);
    });
  });
});
