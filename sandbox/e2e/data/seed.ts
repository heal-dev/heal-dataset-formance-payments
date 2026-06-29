// e2e/data/seed.ts — the golden read-only core.
//
// The actual rows are loaded into Postgres by stack/infra/init/01-golden-seed.sql
// (applied in scripts/infra-up.sh after the payments migrations run). This module
// re-exports the canonical identifiers so specs reference SEED.* symbols rather
// than guessed literals — a rename is then one edit in config.ts.
//
// INVARIANT: this core is seeded once and NEVER mutated by a test. Any mutable
// entity a future stage needs is acquired through the isolation boundary
// (fixtures.ts), never by writing to a golden row.

export { SEED } from '../../config';
