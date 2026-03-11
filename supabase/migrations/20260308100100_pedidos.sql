-- =============================================================
-- Migration: pedidos + pedido_itens tables
-- Stores orders synced from Omie (ListarPedidos)
-- =============================================================

-- Table: pedidos (order header)
CREATE TABLE frv_omie.pedidos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  omie_id               BIGINT UNIQUE NOT NULL,
  cliente_id            UUID REFERENCES frv_omie.clientes(id),
  vendedor_id           UUID REFERENCES frv_omie.vendedores(id),
  numero_pedido         TEXT,
  valor_total           NUMERIC(12,2) DEFAULT 0,
  etapa                 TEXT,
  status                TEXT DEFAULT 'aberto',
  previsao_faturamento  DATE,
  data_pedido           DATE,
  tags                  TEXT[],
  observacao            TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pedidos_etapa ON frv_omie.pedidos(etapa);
CREATE INDEX idx_pedidos_cliente ON frv_omie.pedidos(cliente_id);
CREATE INDEX idx_pedidos_vendedor ON frv_omie.pedidos(vendedor_id);
CREATE INDEX idx_pedidos_data ON frv_omie.pedidos(data_pedido);

COMMENT ON TABLE frv_omie.pedidos IS 'Orders synced from Omie (pedido_venda_produto)';

-- Table: pedido_itens (order line items)
CREATE TABLE frv_omie.pedido_itens (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id         UUID NOT NULL REFERENCES frv_omie.pedidos(id) ON DELETE CASCADE,
  produto_omie_id   BIGINT,
  descricao         TEXT,
  quantidade        NUMERIC(12,4) DEFAULT 0,
  valor_unitario    NUMERIC(12,4) DEFAULT 0,
  valor_total       NUMERIC(12,2) DEFAULT 0,
  unidade           TEXT
);

CREATE INDEX idx_pedido_itens_pedido ON frv_omie.pedido_itens(pedido_id);

COMMENT ON TABLE frv_omie.pedido_itens IS 'Order line items (det[] from Omie pedido)';

-- =============================================================
-- RLS: pedidos (same pattern as vendas)
-- =============================================================
ALTER TABLE frv_omie.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY pedidos_admin_all ON frv_omie.pedidos
  FOR ALL USING (frv_omie.get_user_role() IN ('admin', 'gerente'));

CREATE POLICY pedidos_vendedor_read ON frv_omie.pedidos
  FOR SELECT USING (vendedor_id = frv_omie.get_my_vendedor_id());

-- =============================================================
-- RLS: pedido_itens (inherit via pedido → vendedor)
-- =============================================================
ALTER TABLE frv_omie.pedido_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY pedido_itens_admin_all ON frv_omie.pedido_itens
  FOR ALL USING (frv_omie.get_user_role() IN ('admin', 'gerente'));

CREATE POLICY pedido_itens_vendedor_read ON frv_omie.pedido_itens
  FOR SELECT USING (
    pedido_id IN (
      SELECT id FROM frv_omie.pedidos
      WHERE vendedor_id = frv_omie.get_my_vendedor_id()
    )
  );
