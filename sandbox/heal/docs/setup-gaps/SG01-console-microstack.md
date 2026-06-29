## Setup gap: Console v3 UI renders '200 Unexpected Error' on every Connectivity page (connectors, accounts, balances) — its micro-stack context handler rejects the payments API's 200 responses, so no UI assertions are possible even though the data and API are correct.

> A substitution/seed the sandbox lacks — NOT a product defect (heal/docs/setup-gaps/SG01-console-microstack.md).

**Where.** /formance/localhost/connectivity/connectors/installed (and /accounts)

**Detail.** Live browser probe: Console loads (200, no auth wall), real nav present (Connectivity → Installed Connectors / Accounts / Bank Accounts / Cash Pools), but the page body shows '200 Unexpected Error' and the SPA makes NO client-side API call. Console SERVER logs show context.server:withContext:microStack logging the payments API's successful 200 (with heal-dummypay + Heal Seed Connector data visible in the body) as level:error — the console-v3 image's MICRO_STACK=1 mode is mis-wired against this payments-only local stack (expects a full Formance stack / different discovery envelope). SUT (payments API) is fully functional: GET /v3/connectors, /v3/accounts, /v3/accounts/{id}/balances all return the seeded+polled data correctly. This is test-infrastructure (the Console frontend), NOT a payments defect.

**Pick a fidelity rung (most-real first):**
- `real`
- `dev-instance`
- `seed`
- `mock`
- `out-of-scope`

**Notes.**
- real: fix/replace the Console so its UI renders (e.g. correct console-v3 config/version, or run the full Formance stack the Console expects) — highest fidelity, drives the real UI
- mock: keep the Console out of the assertion path and verify the journey through the payments API surface (the Console itself calls /api/payments) — proves the SUT behavior without the broken frontend
- out-of-scope: drop the Console-UI requirement for this journey; assert via API only and revisit the Console as its own concern

