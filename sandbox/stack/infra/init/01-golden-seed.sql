-- ============================================================================
-- Heal golden read-only core — Stage 0 skeleton
-- Journey: open Console → see one seeded Payment.
--
-- Tag: 🔵 supporting-context (the page READS these rows; we do not assert the
-- app's prod create/ingest path at Stage 0). Created via direct-db-seed with
-- FIXED, FK-correct IDs — the smallest set the journey needs.
--
-- IDs are the app's own base64url(canonicaljson(...)) encodings:
--   ConnectorID         = {Provider, Reference(uuid)}
--   PaymentID           = {ConnectorID, Reference, Type}
--   PaymentAdjustmentID = {PaymentID, Reference, CreatedAt, Status}
-- Recomputing them requires the same canonical-JSON rules the app uses
-- (sorted keys, no whitespace, base64url no-pad). Do NOT hand-edit the blobs;
-- regenerate via internal/models if a field changes. See architecture.md §3.
--
-- This file is mounted into the postgres container's
-- /docker-entrypoint-initdb.d AFTER the app migrations have created the schema
-- is NOT guaranteed — payments runs migrations separately (payments-migrate).
-- We therefore guard every insert and run this seed AFTER migrate completes
-- (see scripts/infra-up.sh, which applies it with psql once migrate is done),
-- never as a docker-entrypoint init script.
-- ============================================================================

BEGIN;

-- 1 connector (FK parent for payment) — dummypay provider, fixed UUID reference.
-- `reference` is the UUID embedded in the connector id (added by a later migration).
INSERT INTO connectors (id, name, created_at, provider, scheduled_for_deletion, config, reference)
VALUES (
    'eyJQcm92aWRlciI6ImR1bW15cGF5IiwiUmVmZXJlbmNlIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIn0',
    'Heal Seed Connector',
    '2026-01-01T00:00:00Z',
    'dummypay',
    false,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- 1 payment — a PAY-IN of 100.00 USD/cents, the row the Console renders
INSERT INTO payments (
    id, connector_id, reference, created_at, type,
    initial_amount, amount, asset, scheme,
    source_account_id, destination_account_id, metadata
)
VALUES (
    'eyJDb25uZWN0b3JJRCI6eyJQcm92aWRlciI6ImR1bW15cGF5IiwiUmVmZXJlbmNlIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIn0sIlJlZmVyZW5jZSI6IkhFQUwtU0VFRC1QQVlNRU5ULTAwMDEiLCJUeXBlIjoiUEFZLUlOIn0',
    'eyJQcm92aWRlciI6ImR1bW15cGF5IiwiUmVmZXJlbmNlIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIn0',
    'HEAL-SEED-PAYMENT-0001',
    '2026-01-01T00:00:00Z',
    'PAY-IN',
    10000, 10000, 'USD/2', 'CARD_VISA',
    NULL, NULL, '{}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 1 payment adjustment — carries the SUCCEEDED status the UI shows
INSERT INTO payment_adjustments (
    id, payment_id, reference, created_at, status, raw, amount, asset, metadata
)
VALUES (
    'eyJDcmVhdGVkQXQiOiIyMDI2LTAxLTAxVDAwOjAwOjAwWiIsIlBheW1lbnRJRCI6eyJDb25uZWN0b3JJRCI6eyJQcm92aWRlciI6ImR1bW15cGF5IiwiUmVmZXJlbmNlIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIn0sIlJlZmVyZW5jZSI6IkhFQUwtU0VFRC1QQVlNRU5ULTAwMDEiLCJUeXBlIjoiUEFZLUlOIn0sIlJlZmVyZW5jZSI6IkhFQUwtU0VFRC1BREotMDAwMSIsIlN0YXR1cyI6IlNVQ0NFRURFRCJ9',
    'eyJDb25uZWN0b3JJRCI6eyJQcm92aWRlciI6ImR1bW15cGF5IiwiUmVmZXJlbmNlIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIn0sIlJlZmVyZW5jZSI6IkhFQUwtU0VFRC1QQVlNRU5ULTAwMDEiLCJUeXBlIjoiUEFZLUlOIn0',
    'HEAL-SEED-ADJ-0001',
    '2026-01-01T00:00:00Z',
    'SUCCEEDED',
    '{}'::json,
    10000, 'USD/2', '{}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
