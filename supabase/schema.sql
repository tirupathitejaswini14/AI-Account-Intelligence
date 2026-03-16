-- ============================================================
-- AccountIQ — Supabase Schema
-- Run this in your Supabase project: SQL Editor → Run
-- ============================================================

-- ── API Keys table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key        TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL DEFAULT 'Default Key',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own keys
CREATE POLICY "api_keys: owner access"
  ON api_keys FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Security-definer RPC for API key validation ──────────────
-- This lets the /api/track endpoint validate a key without user auth,
-- while still preventing any client from enumerating all keys.
CREATE OR REPLACE FUNCTION validate_api_key(p_key TEXT)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT user_id FROM api_keys WHERE key = p_key LIMIT 1;
$$;

-- ── Accounts table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  domain       TEXT,
  industry     TEXT,
  size         TEXT,
  headquarters TEXT,
  founded_year INT,
  description  TEXT,
  logo_url     TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts: owner access"
  ON accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Enrichments table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrichments (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id          UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  intent_score        NUMERIC,
  intent_stage        TEXT CHECK (intent_stage IN ('Awareness', 'Evaluation', 'Decision')),
  likely_persona      TEXT,
  persona_confidence  NUMERIC,
  ai_summary          TEXT,
  recommended_actions JSONB,
  tech_stack          JSONB,
  business_signals    JSONB,
  raw_visitor_data    JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE enrichments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrichments: owner access"
  ON enrichments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Visitors table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visitors (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ip_address          TEXT,
  visitor_id          TEXT,
  pages_visited       JSONB,
  dwell_time_seconds  INT,
  visits_this_week    INT,
  referral_source     TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visitors: owner access"
  ON visitors FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
