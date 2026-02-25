-- =============================================================
-- Migration 004: SQL Views (replace spreadsheet tabs)
-- All views use security_invoker for RLS compliance
-- =============================================================

-- View: v_resumo_global (replaces "RESUMO GLOBAL" tab)
CREATE VIEW frv_omie.v_resumo_global
WITH (security_invoker = true) AS
SELECT
  ano, mes,
  SUM(valor) AS total_geral,
  SUM(CASE WHEN tipo_cliente = 'administradora' THEN valor END) AS total_adm,
  SUM(CASE WHEN tipo_cliente = 'empresa' THEN valor END) AS total_empresas,
  SUM(CASE WHEN tipo_cliente = 'sindico' THEN valor END) AS total_sindicos,
  SUM(CASE WHEN tipo_cliente = 'consumidor_final' THEN valor END) AS total_cf
FROM frv_omie.vendas
WHERE status = 'faturado'
GROUP BY ano, mes
ORDER BY ano DESC, mes DESC;

-- View: v_vendas_por_vendedor (replaces vendor columns)
CREATE VIEW frv_omie.v_vendas_por_vendedor
WITH (security_invoker = true) AS
SELECT
  v.ano, v.mes, ve.id AS vendedor_id, ve.nome AS vendedor,
  SUM(v.valor) AS total,
  COUNT(DISTINCT v.cliente_id) AS clientes_atendidos
FROM frv_omie.vendas v
JOIN frv_omie.vendedores ve ON v.vendedor_id = ve.id
WHERE v.status = 'faturado'
GROUP BY v.ano, v.mes, ve.id, ve.nome;

-- View: v_carteira_detalhada (replaces CARTEIRA tabs)
CREATE VIEW frv_omie.v_carteira_detalhada
WITH (security_invoker = true) AS
SELECT
  ve.id AS vendedor_id, ve.nome AS vendedor,
  cl.id AS cliente_id, cl.nome AS cliente, cl.tipo,
  v.ano, v.mes, v.valor,
  AVG(v.valor) OVER (PARTITION BY cl.id) AS media_cliente
FROM frv_omie.vendas v
JOIN frv_omie.clientes cl ON v.cliente_id = cl.id
JOIN frv_omie.vendedores ve ON v.vendedor_id = ve.id
WHERE v.status = 'faturado'
ORDER BY ve.nome, cl.nome, v.ano, v.mes;

-- View: v_administradoras_mensal (replaces "VALOR POR ADM" tab)
CREATE VIEW frv_omie.v_administradoras_mensal
WITH (security_invoker = true) AS
SELECT
  cl.id AS cliente_id, cl.nome AS administradora,
  v.ano, v.mes, SUM(v.valor) AS valor,
  LAG(SUM(v.valor)) OVER (PARTITION BY cl.id ORDER BY v.ano, v.mes)
    AS valor_mes_anterior,
  CASE
    WHEN SUM(v.valor) = 0
      AND LAG(SUM(v.valor)) OVER (PARTITION BY cl.id ORDER BY v.ano, v.mes) = 0
    THEN true
    ELSE false
  END AS possivel_inativo
FROM frv_omie.vendas v
JOIN frv_omie.clientes cl ON v.cliente_id = cl.id
WHERE cl.tipo = 'administradora' AND v.status = 'faturado'
GROUP BY cl.id, cl.nome, v.ano, v.mes
ORDER BY cl.nome, v.ano, v.mes;

-- View: v_clientes_inativos (auto-detection of inactive clients)
CREATE VIEW frv_omie.v_clientes_inativos
WITH (security_invoker = true) AS
SELECT
  cl.id, cl.nome, cl.tipo, ve.nome AS vendedor,
  MAX(v.ano * 100 + v.mes) AS ultimo_periodo,
  MAX(v.data_venda) AS ultima_compra
FROM frv_omie.clientes cl
LEFT JOIN frv_omie.vendas v ON cl.id = v.cliente_id AND v.status = 'faturado'
LEFT JOIN frv_omie.vendedores ve ON cl.vendedor_id = ve.id
WHERE cl.status = 'ativo'
GROUP BY cl.id, cl.nome, cl.tipo, ve.nome
HAVING MAX(v.data_venda) < CURRENT_DATE - INTERVAL '60 days'
   OR MAX(v.data_venda) IS NULL;
