-- =============================================================
-- Migration 001: Schema + vendedores table
-- Schema: frv_omie (shared Supabase project "vn-repertorio")
-- =============================================================

-- Create dedicated schema
CREATE SCHEMA IF NOT EXISTS frv_omie;

-- Grant usage to Supabase roles
GRANT USAGE ON SCHEMA frv_omie TO anon, authenticated, service_role;

-- Default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA frv_omie
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA frv_omie
  GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA frv_omie
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA frv_omie
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA frv_omie
  GRANT USAGE, SELECT ON SEQUENCES TO service_role;

-- =============================================================
-- Helper: auto-update updated_at trigger
-- =============================================================
CREATE OR REPLACE FUNCTION frv_omie.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- Table: vendedores
-- =============================================================
CREATE TABLE frv_omie.vendedores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  omie_id       BIGINT UNIQUE,
  auth_user_id  UUID REFERENCES auth.users(id),
  nome          TEXT NOT NULL,
  email         TEXT,
  status        TEXT DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  meta_mensal   NUMERIC(12,2),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER vendedores_updated_at
  BEFORE UPDATE ON frv_omie.vendedores
  FOR EACH ROW EXECUTE FUNCTION frv_omie.set_updated_at();

COMMENT ON TABLE frv_omie.vendedores IS 'Sales team members';
