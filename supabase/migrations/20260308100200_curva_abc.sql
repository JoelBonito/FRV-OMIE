-- Curva ABC views (valor + quantidade) based on pedido_itens
-- Prerequisite: pedido_itens populated via omie-sync

-- View: ABC by revenue (valor)
CREATE OR REPLACE VIEW frv_omie.v_curva_abc_valor AS
WITH ranked AS (
  SELECT
    pi.descricao,
    SUM(pi.valor_total) AS valor,
    SUM(pi.quantidade) AS quantidade,
    COUNT(DISTINCT pi.pedido_id) AS pedidos,
    ROW_NUMBER() OVER (ORDER BY SUM(pi.valor_total) DESC) AS ordem
  FROM frv_omie.pedido_itens pi
  JOIN frv_omie.pedidos p ON pi.pedido_id = p.id
  WHERE p.status != 'cancelado'
  GROUP BY pi.descricao
),
total AS (SELECT SUM(valor) AS soma FROM ranked)
SELECT
  r.ordem::int,
  COALESCE(r.descricao, 'SEM DESCRICAO') AS descricao,
  r.valor::numeric,
  r.quantidade::numeric,
  r.pedidos::int,
  ROUND(r.valor / NULLIF(t.soma, 0) * 100, 4)::numeric AS pct_participacao,
  SUM(r.valor) OVER (ORDER BY r.ordem)::numeric AS valor_acumulado,
  ROUND(SUM(r.valor) OVER (ORDER BY r.ordem) / NULLIF(t.soma, 0) * 100, 2)::numeric AS pct_acumulado,
  CASE
    WHEN SUM(r.valor) OVER (ORDER BY r.ordem) / NULLIF(t.soma, 0) <= 0.8 THEN 'A'
    WHEN SUM(r.valor) OVER (ORDER BY r.ordem) / NULLIF(t.soma, 0) <= 0.95 THEN 'B'
    ELSE 'C'
  END AS abc
FROM ranked r, total t
ORDER BY r.ordem;

-- View: ABC by quantity
CREATE OR REPLACE VIEW frv_omie.v_curva_abc_quantidade AS
WITH ranked AS (
  SELECT
    pi.descricao,
    SUM(pi.quantidade) AS quantidade,
    SUM(pi.valor_total) AS valor,
    COUNT(DISTINCT pi.pedido_id) AS pedidos,
    ROW_NUMBER() OVER (ORDER BY SUM(pi.quantidade) DESC) AS ordem
  FROM frv_omie.pedido_itens pi
  JOIN frv_omie.pedidos p ON pi.pedido_id = p.id
  WHERE p.status != 'cancelado'
  GROUP BY pi.descricao
),
total AS (SELECT SUM(quantidade) AS soma FROM ranked)
SELECT
  r.ordem::int,
  COALESCE(r.descricao, 'SEM DESCRICAO') AS descricao,
  r.quantidade::numeric,
  r.valor::numeric,
  r.pedidos::int,
  ROUND(r.quantidade / NULLIF(t.soma, 0) * 100, 4)::numeric AS pct_participacao,
  SUM(r.quantidade) OVER (ORDER BY r.ordem)::numeric AS qtd_acumulada,
  ROUND(SUM(r.quantidade) OVER (ORDER BY r.ordem) / NULLIF(t.soma, 0) * 100, 2)::numeric AS pct_acumulado,
  CASE
    WHEN SUM(r.quantidade) OVER (ORDER BY r.ordem) / NULLIF(t.soma, 0) <= 0.8 THEN 'A'
    WHEN SUM(r.quantidade) OVER (ORDER BY r.ordem) / NULLIF(t.soma, 0) <= 0.95 THEN 'B'
    ELSE 'C'
  END AS abc
FROM ranked r, total t
ORDER BY r.ordem;

-- RLS: views inherit from pedidos/pedido_itens (already has RLS)
-- Grant access
GRANT SELECT ON frv_omie.v_curva_abc_valor TO authenticated;
GRANT SELECT ON frv_omie.v_curva_abc_quantidade TO authenticated;
