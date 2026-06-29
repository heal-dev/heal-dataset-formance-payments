// e2e/data/fixtures.ts — the isolation boundary (acquire(ns) / release(ns)).
//
// Stage 0 is a READ-ONLY skeleton journey: the spec asserts on the golden core
// (the one seeded payment) and mutates nothing, so it tags itself @readonly and
// needs no per-test namespace. The boundary is declared here now so later stages
// (which DO create/mutate data) plug into the same uniform contract instead of
// inventing one — see docs/parallel-sandbox.md.
//
// Reset strategy: truncate-per-file (recorded in sandbox.config.json). The golden
// seed is re-applied between spec files by scripts/infra-up.sh / the setup project.

import { test as base } from '@playwright/test';
import { SEED } from './seed';

export type Fixtures = {
  // Read-only handle to the golden core. No acquire/release needed at Stage 0.
  golden: typeof SEED;
};

export const test = base.extend<Fixtures>({
  golden: async ({}, use) => {
    await use(SEED);
  },
});

export { expect } from '@playwright/test';

// Later stages add:
//   acquire(ns) -> seed namespaced rows under a unique ns (w${parallelIndex} / -t${testId})
//   release(ns) -> delete by ns
// backed per-dependency by create-and-delete (resettable) or lease-from-pool.
