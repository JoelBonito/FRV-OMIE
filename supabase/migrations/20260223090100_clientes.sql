-- =============================================================
-- Migration 002: clientes table
-- =============================================================

CREATE TABLE frv_omie.clientes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  omie_id           BIGINT UNIQUE,
  nome              TEXT NOT NULL,
  tipo              TEXT NOT NULL CHECK (tipo IN
    ('administradora','empresa','sindico','consumidor_final')),
  status            TEXT DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  vendedor_id       UUID REFERENCES frv_omie.vendedores(id),
  cnpj              TEXT,
  telefone          TEXT,
  email             TEXT,
  notas             TEXT,
  data_inativacao   DATE,
  motivo_inativacao TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clientes_vendedor ON frv_omie.clientes(vendedor_id);
CREATE INDEX idx_clientes_tipo ON frv_omie.clientes(tipo);
CREATE INDEX idx_clientes_status ON frv_omie.clientes(status);

CREATE TRIGGER clientes_updated_at
  BEFORE UPDATE ON frv_omie.clientes
  FOR EACH ROW EXECUTE FUNCTION frv_omie.set_updated_at();

COMMENT ON TABLE frv_omie.clientes IS 'Clients: administradoras, empresas, sindicos, consumidor_final';
