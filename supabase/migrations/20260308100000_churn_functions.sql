-- =============================================================
-- Migration: Churn analysis functions + administradora column
-- Adds ability to compare two periods and detect client churn
-- =============================================================

-- Add administradora column to track which admin company manages each client
ALTER TABLE frv_omie.clientes ADD COLUMN IF NOT EXISTS administradora TEXT;

-- Index for faster churn queries grouped by administradora
CREATE INDEX IF NOT EXISTS idx_clientes_administradora ON frv_omie.clientes (administradora);
CREATE INDEX IF NOT EXISTS idx_vendas_ano_mes_status ON frv_omie.vendas (ano, mes, status);

-- =============================================================
-- fn_churn_por_administradora: Compare two periods by admin
-- Replicates "Resumo_Administradoras" spreadsheet tab
-- =============================================================
CREATE OR REPLACE FUNCTION frv_omie.fn_churn_por_administradora(
  p_ano1 INT, p_mes1 INT,  -- Period 1 (reference)
  p_ano2 INT, p_mes2 INT   -- Period 2 (current)
)
RETURNS TABLE (
  administradora TEXT,
  condominios_mes1 BIGINT,
  condominios_mes2 BIGINT,
  retidos BIGINT,
  perdidos BIGINT,
  novos BIGINT,
  taxa_retencao NUMERIC,
  faturamento_mes1 NUMERIC,
  faturamento_mes2 NUMERIC,
  delta_faturamento NUMERIC,
  pedidos_mes1 BIGINT,
  pedidos_mes2 BIGINT
)
LANGUAGE sql STABLE
SET search_path = frv_omie
AS $$
  WITH
  -- Clients that purchased in period 1
  mes1 AS (
    SELECT DISTINCT v.cliente_id, c.administradora,
           SUM(v.valor) AS faturamento, COUNT(*) AS pedidos
    FROM vendas v
    JOIN clientes c ON v.cliente_id = c.id
    WHERE v.ano = p_ano1 AND v.mes = p_mes1 AND v.status = 'faturado'
      AND c.administradora IS NOT NULL
    GROUP BY v.cliente_id, c.administradora
  ),
  -- Clients that purchased in period 2
  mes2 AS (
    SELECT DISTINCT v.cliente_id, c.administradora,
           SUM(v.valor) AS faturamento, COUNT(*) AS pedidos
    FROM vendas v
    JOIN clientes c ON v.cliente_id = c.id
    WHERE v.ano = p_ano2 AND v.mes = p_mes2 AND v.status = 'faturado'
      AND c.administradora IS NOT NULL
    GROUP BY v.cliente_id, c.administradora
  ),
  -- All admins from both periods
  admins AS (
    SELECT DISTINCT administradora FROM mes1
    UNION
    SELECT DISTINCT administradora FROM mes2
  ),
  -- Aggregate per admin
  stats AS (
    SELECT
      a.administradora,
      -- Counts
      COUNT(DISTINCT m1.cliente_id) AS condominios_mes1,
      COUNT(DISTINCT m2.cliente_id) AS condominios_mes2,
      COUNT(DISTINCT CASE WHEN m1.cliente_id IS NOT NULL AND m2.cliente_id IS NOT NULL
                         THEN m1.cliente_id END) AS retidos,
      COUNT(DISTINCT CASE WHEN m1.cliente_id IS NOT NULL AND m2.cliente_id IS NULL
                         THEN m1.cliente_id END) AS perdidos,
      COUNT(DISTINCT CASE WHEN m1.cliente_id IS NULL AND m2.cliente_id IS NOT NULL
                         THEN m2.cliente_id END) AS novos,
      -- Revenue
      COALESCE(SUM(m1.faturamento), 0) AS faturamento_mes1,
      COALESCE(SUM(m2.faturamento), 0) AS faturamento_mes2,
      -- Orders
      COALESCE(SUM(m1.pedidos), 0) AS pedidos_mes1,
      COALESCE(SUM(m2.pedidos), 0) AS pedidos_mes2
    FROM admins a
    LEFT JOIN mes1 m1 ON m1.administradora = a.administradora
    LEFT JOIN mes2 m2 ON m2.administradora = a.administradora
                      AND m2.cliente_id = m1.cliente_id
    GROUP BY a.administradora
  )
  SELECT
    s.administradora,
    s.condominios_mes1,
    s.condominios_mes2,
    s.retidos,
    s.perdidos,
    s.novos,
    CASE WHEN s.condominios_mes1 > 0
         THEN ROUND(s.retidos::NUMERIC / s.condominios_mes1 * 100, 2)
         ELSE 0 END AS taxa_retencao,
    s.faturamento_mes1,
    s.faturamento_mes2,
    s.faturamento_mes2 - s.faturamento_mes1 AS delta_faturamento,
    s.pedidos_mes1,
    s.pedidos_mes2
  FROM stats s
  ORDER BY s.faturamento_mes1 DESC;
$$;

-- =============================================================
-- fn_clientes_churn: Clients that bought in period 1 but NOT 2
-- Replicates "Perdidos_Jan_nao_Fev" spreadsheet tab
-- =============================================================
CREATE OR REPLACE FUNCTION frv_omie.fn_clientes_churn(
  p_ano_ref INT, p_mes_ref INT,    -- Reference period (they DID buy)
  p_ano_atual INT, p_mes_atual INT  -- Current period (they did NOT buy)
)
RETURNS TABLE (
  cliente_id UUID,
  nome TEXT,
  tipo TEXT,
  administradora TEXT,
  vendedor TEXT,
  vendedor_id UUID,
  valor_ref NUMERIC,
  pedidos_ref BIGINT,
  ultima_emissao DATE
)
LANGUAGE sql STABLE
SET search_path = frv_omie
AS $$
  SELECT
    c.id AS cliente_id,
    c.nome,
    c.tipo,
    c.administradora,
    ve.nome AS vendedor,
    ve.id AS vendedor_id,
    SUM(v.valor) AS valor_ref,
    COUNT(v.id) AS pedidos_ref,
    MAX(v.data_venda) AS ultima_emissao
  FROM vendas v
  JOIN clientes c ON v.cliente_id = c.id
  LEFT JOIN vendedores ve ON c.vendedor_id = ve.id
  WHERE v.ano = p_ano_ref AND v.mes = p_mes_ref AND v.status = 'faturado'
    AND NOT EXISTS (
      SELECT 1 FROM vendas v2
      WHERE v2.cliente_id = v.cliente_id
        AND v2.ano = p_ano_atual AND v2.mes = p_mes_atual
        AND v2.status = 'faturado'
    )
  GROUP BY c.id, c.nome, c.tipo, c.administradora, ve.nome, ve.id
  ORDER BY SUM(v.valor) DESC;
$$;

-- =============================================================
-- fn_clientes_novos: Clients that bought in period 2 but NOT 1
-- Replicates "Novos_em_Fev" spreadsheet tab
-- =============================================================
CREATE OR REPLACE FUNCTION frv_omie.fn_clientes_novos(
  p_ano_ref INT, p_mes_ref INT,    -- Reference period (they did NOT buy)
  p_ano_atual INT, p_mes_atual INT  -- Current period (they DID buy)
)
RETURNS TABLE (
  cliente_id UUID,
  nome TEXT,
  tipo TEXT,
  administradora TEXT,
  vendedor TEXT,
  vendedor_id UUID,
  valor_atual NUMERIC,
  pedidos_atual BIGINT
)
LANGUAGE sql STABLE
SET search_path = frv_omie
AS $$
  SELECT
    c.id AS cliente_id,
    c.nome,
    c.tipo,
    c.administradora,
    ve.nome AS vendedor,
    ve.id AS vendedor_id,
    SUM(v.valor) AS valor_atual,
    COUNT(v.id) AS pedidos_atual
  FROM vendas v
  JOIN clientes c ON v.cliente_id = c.id
  LEFT JOIN vendedores ve ON c.vendedor_id = ve.id
  WHERE v.ano = p_ano_atual AND v.mes = p_mes_atual AND v.status = 'faturado'
    AND NOT EXISTS (
      SELECT 1 FROM vendas v2
      WHERE v2.cliente_id = v.cliente_id
        AND v2.ano = p_ano_ref AND v2.mes = p_mes_ref
        AND v2.status = 'faturado'
    )
  GROUP BY c.id, c.nome, c.tipo, c.administradora, ve.nome, ve.id
  ORDER BY SUM(v.valor) DESC;
$$;

-- =============================================================
-- fn_top_quedas: Top N admins with biggest client/revenue drops
-- Replicates "Top3_quedas" spreadsheet
-- =============================================================
CREATE OR REPLACE FUNCTION frv_omie.fn_top_quedas(
  p_ano1 INT, p_mes1 INT,
  p_ano2 INT, p_mes2 INT,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  administradora TEXT,
  condominios_perdidos BIGINT,
  pedidos_perdidos BIGINT,
  valor_perdido NUMERIC
)
LANGUAGE sql STABLE
SET search_path = frv_omie
AS $$
  WITH perdidos AS (
    SELECT
      c.administradora,
      v.cliente_id,
      SUM(v.valor) AS valor,
      COUNT(v.id) AS pedidos
    FROM vendas v
    JOIN clientes c ON v.cliente_id = c.id
    WHERE v.ano = p_ano1 AND v.mes = p_mes1 AND v.status = 'faturado'
      AND c.administradora IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM vendas v2
        WHERE v2.cliente_id = v.cliente_id
          AND v2.ano = p_ano2 AND v2.mes = p_mes2
          AND v2.status = 'faturado'
      )
    GROUP BY c.administradora, v.cliente_id
  )
  SELECT
    p.administradora,
    COUNT(DISTINCT p.cliente_id) AS condominios_perdidos,
    SUM(p.pedidos) AS pedidos_perdidos,
    SUM(p.valor) AS valor_perdido
  FROM perdidos p
  GROUP BY p.administradora
  ORDER BY SUM(p.valor) DESC
  LIMIT p_limit;
$$;

-- =============================================================
-- fn_comparacao_por_vendedor: Compare two periods by vendedor
-- =============================================================
CREATE OR REPLACE FUNCTION frv_omie.fn_comparacao_por_vendedor(
  p_ano1 INT, p_mes1 INT,
  p_ano2 INT, p_mes2 INT
)
RETURNS TABLE (
  vendedor_id UUID,
  vendedor TEXT,
  faturamento_mes1 NUMERIC,
  faturamento_mes2 NUMERIC,
  delta_faturamento NUMERIC,
  clientes_mes1 BIGINT,
  clientes_mes2 BIGINT,
  pedidos_mes1 BIGINT,
  pedidos_mes2 BIGINT
)
LANGUAGE sql STABLE
SET search_path = frv_omie
AS $$
  WITH
  m1 AS (
    SELECT v.vendedor_id,
           SUM(v.valor) AS faturamento,
           COUNT(DISTINCT v.cliente_id) AS clientes,
           COUNT(*) AS pedidos
    FROM vendas v
    WHERE v.ano = p_ano1 AND v.mes = p_mes1 AND v.status = 'faturado'
    GROUP BY v.vendedor_id
  ),
  m2 AS (
    SELECT v.vendedor_id,
           SUM(v.valor) AS faturamento,
           COUNT(DISTINCT v.cliente_id) AS clientes,
           COUNT(*) AS pedidos
    FROM vendas v
    WHERE v.ano = p_ano2 AND v.mes = p_mes2 AND v.status = 'faturado'
    GROUP BY v.vendedor_id
  )
  SELECT
    ve.id AS vendedor_id,
    ve.nome AS vendedor,
    COALESCE(m1.faturamento, 0) AS faturamento_mes1,
    COALESCE(m2.faturamento, 0) AS faturamento_mes2,
    COALESCE(m2.faturamento, 0) - COALESCE(m1.faturamento, 0) AS delta_faturamento,
    COALESCE(m1.clientes, 0) AS clientes_mes1,
    COALESCE(m2.clientes, 0) AS clientes_mes2,
    COALESCE(m1.pedidos, 0) AS pedidos_mes1,
    COALESCE(m2.pedidos, 0) AS pedidos_mes2
  FROM vendedores ve
  LEFT JOIN m1 ON m1.vendedor_id = ve.id
  LEFT JOIN m2 ON m2.vendedor_id = ve.id
  WHERE ve.status = 'ativo'
  ORDER BY COALESCE(m2.faturamento, 0) DESC;
$$;

-- =============================================================
-- fn_comparacao_por_tipo: Compare two periods by tipo_cliente
-- =============================================================
CREATE OR REPLACE FUNCTION frv_omie.fn_comparacao_por_tipo(
  p_ano1 INT, p_mes1 INT,
  p_ano2 INT, p_mes2 INT
)
RETURNS TABLE (
  tipo_cliente TEXT,
  faturamento_mes1 NUMERIC,
  faturamento_mes2 NUMERIC,
  delta_faturamento NUMERIC,
  clientes_mes1 BIGINT,
  clientes_mes2 BIGINT,
  pedidos_mes1 BIGINT,
  pedidos_mes2 BIGINT
)
LANGUAGE sql STABLE
SET search_path = frv_omie
AS $$
  WITH
  tipos AS (
    SELECT DISTINCT tipo_cliente FROM vendas WHERE status = 'faturado'
  ),
  m1 AS (
    SELECT v.tipo_cliente,
           SUM(v.valor) AS faturamento,
           COUNT(DISTINCT v.cliente_id) AS clientes,
           COUNT(*) AS pedidos
    FROM vendas v
    WHERE v.ano = p_ano1 AND v.mes = p_mes1 AND v.status = 'faturado'
    GROUP BY v.tipo_cliente
  ),
  m2 AS (
    SELECT v.tipo_cliente,
           SUM(v.valor) AS faturamento,
           COUNT(DISTINCT v.cliente_id) AS clientes,
           COUNT(*) AS pedidos
    FROM vendas v
    WHERE v.ano = p_ano2 AND v.mes = p_mes2 AND v.status = 'faturado'
    GROUP BY v.tipo_cliente
  )
  SELECT
    t.tipo_cliente,
    COALESCE(m1.faturamento, 0) AS faturamento_mes1,
    COALESCE(m2.faturamento, 0) AS faturamento_mes2,
    COALESCE(m2.faturamento, 0) - COALESCE(m1.faturamento, 0) AS delta_faturamento,
    COALESCE(m1.clientes, 0) AS clientes_mes1,
    COALESCE(m2.clientes, 0) AS clientes_mes2,
    COALESCE(m1.pedidos, 0) AS pedidos_mes1,
    COALESCE(m2.pedidos, 0) AS pedidos_mes2
  FROM tipos t
  LEFT JOIN m1 ON m1.tipo_cliente = t.tipo_cliente
  LEFT JOIN m2 ON m2.tipo_cliente = t.tipo_cliente
  ORDER BY COALESCE(m2.faturamento, 0) DESC;
$$;

-- =============================================================
-- fn_clientes_comparacao: All clients from both periods with status
-- Replicates "Condominios_por_Admin" spreadsheet tab
-- =============================================================
CREATE OR REPLACE FUNCTION frv_omie.fn_clientes_comparacao(
  p_ano1 INT, p_mes1 INT,
  p_ano2 INT, p_mes2 INT
)
RETURNS TABLE (
  cliente_id UUID,
  nome TEXT,
  tipo TEXT,
  administradora TEXT,
  vendedor TEXT,
  vendedor_id UUID,
  faturamento_mes1 NUMERIC,
  faturamento_mes2 NUMERIC,
  pedidos_mes1 BIGINT,
  pedidos_mes2 BIGINT,
  delta_faturamento NUMERIC,
  status TEXT
)
LANGUAGE sql STABLE
SET search_path = frv_omie
AS $$
  WITH
  m1 AS (
    SELECT v.cliente_id,
           SUM(v.valor) AS faturamento,
           COUNT(*) AS pedidos
    FROM vendas v
    WHERE v.ano = p_ano1 AND v.mes = p_mes1 AND v.status = 'faturado'
    GROUP BY v.cliente_id
  ),
  m2 AS (
    SELECT v.cliente_id,
           SUM(v.valor) AS faturamento,
           COUNT(*) AS pedidos
    FROM vendas v
    WHERE v.ano = p_ano2 AND v.mes = p_mes2 AND v.status = 'faturado'
    GROUP BY v.cliente_id
  ),
  all_clients AS (
    SELECT cliente_id FROM m1
    UNION
    SELECT cliente_id FROM m2
  )
  SELECT
    c.id AS cliente_id,
    c.nome,
    c.tipo,
    c.administradora,
    ve.nome AS vendedor,
    ve.id AS vendedor_id,
    COALESCE(m1.faturamento, 0) AS faturamento_mes1,
    COALESCE(m2.faturamento, 0) AS faturamento_mes2,
    COALESCE(m1.pedidos, 0) AS pedidos_mes1,
    COALESCE(m2.pedidos, 0) AS pedidos_mes2,
    COALESCE(m2.faturamento, 0) - COALESCE(m1.faturamento, 0) AS delta_faturamento,
    CASE
      WHEN m1.cliente_id IS NOT NULL AND m2.cliente_id IS NULL THEN 'Perdido'
      WHEN m1.cliente_id IS NULL AND m2.cliente_id IS NOT NULL THEN 'Novo'
      ELSE 'Retido'
    END AS status
  FROM all_clients ac
  JOIN clientes c ON c.id = ac.cliente_id
  LEFT JOIN vendedores ve ON c.vendedor_id = ve.id
  LEFT JOIN m1 ON m1.cliente_id = ac.cliente_id
  LEFT JOIN m2 ON m2.cliente_id = ac.cliente_id
  ORDER BY COALESCE(m1.faturamento, 0) + COALESCE(m2.faturamento, 0) DESC;
$$;
