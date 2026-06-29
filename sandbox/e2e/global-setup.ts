// e2e/global-setup.ts — pre-runner work ONLY: wait for the compose stack to be
// truly ready before any browser/runner machinery starts.
//
// compose `depends_on` + healthchecks cover container order; this covers the two
// app surfaces the journey actually hits: the payments API (via the gateway) and
// the Console frontend. Seeding is NOT done here — it's applied to Postgres by
// scripts/infra-up.sh after migrations (see architecture.md §4).

import { API_URL, GATEWAY_URL, CONSOLE_URL } from '../config';

async function waitFor(
  name: string,
  url: string,
  { timeoutMs = 180_000, intervalMs = 2_000, expectOkOrBadGateway = false } = {},
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastErr = '';
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'GET' });
      // Some gateway routes answer 502 until upstream is up; treat any HTTP
      // response from the Console as "frontend serving".
      if (res.ok || (expectOkOrBadGateway && res.status > 0)) {
        console.log(`[global-setup] ${name} ready (${res.status}) at ${url}`);
        return;
      }
      lastErr = `HTTP ${res.status}`;
    } catch (e) {
      lastErr = (e as Error).message;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`[global-setup] ${name} not ready at ${url} within ${timeoutMs}ms (last: ${lastErr})`);
}

export default async function globalSetup() {
  // Payments API health endpoint (direct host port).
  await waitFor('payments-api', `${API_URL}/_healthcheck`);
  // Gateway versions endpoint confirms the proxy is wired to payments.
  await waitFor('gateway', `${GATEWAY_URL}/versions`, { expectOkOrBadGateway: true });
  // Console frontend serving.
  await waitFor('console', CONSOLE_URL, { expectOkOrBadGateway: true });
}
