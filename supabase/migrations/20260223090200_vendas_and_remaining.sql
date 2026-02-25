-- =============================================================
-- Migration 003: vendas, carteira_historico, config_omie, sync_logs
-- =============================================================

-- Table: vendas
CREATE TABLE frv_omie.vendas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  omie_id         BIGINT UNIQUE,
  cliente_id      UUID NOT NULL REFERENCES frv_omie.clientes(id),
  vendedor_id     UUID NOT NULL REFERENCES frv_omie.vendedores(id),
  valor           NUMERIC(12,2) NOT NULL,
  mes             INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano             INTEGER NOT NULL CHECK (ano BETWEEN 2020 AND 2100),
  data_venda      DATE,
  tipo_cliente    TEXT NOT NULL,
  status          TEXT DEFAULT 'faturado' CHECK (status IN
    ('faturado','pendente','cancelado')),
  nota_fiscal     TEXT,
  pedido_omie_id  BIGINT,
  observacao      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vendas_periodo ON frv_omie.vendas(ano, mes);
CREATE INDEX idx_vendas_cliente ON frv_omie.vendas(cliente_id);
CREATE INDEX idx_vendas_vendedor ON frv_omie.vendas(vendedor_id);
CREATE INDEX idx_vendas_tipo ON frv_omie.vendas(tipo_cliente);

COMMENT ON TABLE frv_omie.vendas IS 'Monthly sales records';

-- Table: carteira_historico
CREATE TABLE frv_omie.carteira_historico (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id            UUID NOT NULL REFERENCES frv_omie.clientes(id),
  vendedor_anterior_id  UUID REFERENCES frv_omie.vendedores(id),
  vendedor_novo_id      UUID NOT NULL REFERENCES frv_omie.vendedores(id),
  data_transferencia    TIMESTAMPTZ DEFAULT now(),
  motivo                TEXT,
  aprovado_por          UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE frv_omie.carteira_historico IS 'Portfolio transfer audit trail';

-- Table: config_omie
CREATE TABLE frv_omie.config_omie (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key             TEXT NOT NULL,
  app_secret          TEXT NOT NULL,
  webhook_secret      TEXT,
  ultimo_sync         TIMESTAMPTZ,
  status_sync         TEXT DEFAULT 'idle',
  sync_interval_hours INTEGER DEFAULT 6
);

COMMENT ON TABLE frv_omie.config_omie IS 'Omie API credentials and sync config';

-- Table: sync_logs
CREATE TABLE frv_omie.sync_logs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo                    TEXT NOT NULL,
  endpoint                TEXT NOT NULL,
  call_method             TEXT,
  status                  TEXT NOT NULL,
  registros_processados   INTEGER DEFAULT 0,
  registros_criados       INTEGER DEFAULT 0,
  registros_atualizados   INTEGER DEFAULT 0,
  erros                   JSONB,
  duracao_ms              INTEGER,
  payload_resumo          JSONB,
  created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_logs_created ON frv_omie.sync_logs(created_at DESC);

COMMENT ON TABLE frv_omie.sync_logs IS 'Omie sync operation logs';
