-- Swipewise database schema
-- Run with: psql $DATABASE_URL -f src/db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users & Auth ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL,
  code        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  attempts    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS otp_codes_phone_idx ON otp_codes (phone);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens (user_id);

-- ── Plaid ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plaid_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plaid_item_id       TEXT NOT NULL UNIQUE,
  -- access_token stored AES-encrypted; key managed via AES_KEY env var
  access_token_enc    BYTEA NOT NULL,
  institution_id      TEXT,
  institution_name    TEXT,
  cursor              TEXT,
  status              TEXT NOT NULL DEFAULT 'active', -- active | error | revoked
  error_code          TEXT,
  last_synced_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS plaid_items_user_idx ON plaid_items (user_id);

-- ── Cards ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id         TEXT NOT NULL,          -- 'gold' | 'csr' | 'savor'
  plaid_item_id   UUID REFERENCES plaid_items(id) ON DELETE SET NULL,
  plaid_account_id TEXT,
  source          TEXT NOT NULL DEFAULT 'manual', -- 'plaid' | 'manual'
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, card_id)
);
CREATE INDEX IF NOT EXISTS user_cards_user_idx ON user_cards (user_id);

-- ── Transactions ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plaid_tx_id      TEXT UNIQUE,
  card_id          TEXT,
  amount           NUMERIC(10,2) NOT NULL,
  category         TEXT NOT NULL DEFAULT 'other',
  merchant_name    TEXT,
  merchant_lat     DOUBLE PRECISION,
  merchant_lng     DOUBLE PRECISION,
  plaid_primary    TEXT,
  plaid_detailed   TEXT,
  date             DATE NOT NULL,
  pending          BOOLEAN NOT NULL DEFAULT FALSE,
  removed          BOOLEAN NOT NULL DEFAULT FALSE,
  user_category    TEXT,                  -- per-user override
  source           TEXT NOT NULL DEFAULT 'plaid', -- 'plaid' | 'manual'
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON transactions (user_id, date DESC);
CREATE INDEX IF NOT EXISTS transactions_merchant_idx  ON transactions (merchant_name);

-- ── Merchants ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS merchants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'other',
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  plaid_mcc     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS merchants_name_idx ON merchants (name);

-- User-specific merchant favorites (manual persona)
CREATE TABLE IF NOT EXISTS user_merchant_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, merchant_id)
);

-- ── Credits ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_credits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id     TEXT NOT NULL,
  credit_id   TEXT NOT NULL,
  captured    BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, card_id, credit_id)
);
CREATE INDEX IF NOT EXISTS user_credits_user_idx ON user_credits (user_id);

-- ── Manual swipe log (FR-MAN-01) ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS manual_swipes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id       TEXT NOT NULL,
  merchant_name TEXT,
  merchant_id   UUID REFERENCES merchants(id),
  category      TEXT NOT NULL DEFAULT 'other',
  amount        NUMERIC(10,2),
  logged_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS manual_swipes_user_idx ON manual_swipes (user_id);

-- ── User settings ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_settings (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  cpp               JSONB NOT NULL DEFAULT '{"gold":2.0,"csr":2.05,"savor":1.0}',
  fees              JSONB NOT NULL DEFAULT '{"gold":325,"csr":795,"savor":0}',
  notif_arrivals    BOOLEAN NOT NULL DEFAULT TRUE,
  notif_credits     BOOLEAN NOT NULL DEFAULT TRUE,
  notif_recap       BOOLEAN NOT NULL DEFAULT TRUE,
  quiet_start       TIME NOT NULL DEFAULT '22:00',
  quiet_end         TIME NOT NULL DEFAULT '08:00',
  biometric_lock    BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
