-- =============================================================
-- Hardening: frv_omie security advisor findings
-- Fixes:
--   - security_definer_view
--   - function_search_path_mutable
-- =============================================================

-- -------------------------------------------------------------
-- Functions: fix mutable search_path
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION frv_omie.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION frv_omie.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt()->'user_metadata'->>'user_role',
    (current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'user_role'),
    'vendedor'
  );
END;
$$;

CREATE OR REPLACE FUNCTION frv_omie.get_my_vendedor_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN (
    SELECT id
    FROM frv_omie.vendedores
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION frv_omie.acquire_sync_lock()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id UUID;
  v_status TEXT;
  v_ultimo TIMESTAMPTZ;
BEGIN
  SELECT id, status_sync, ultimo_sync
  INTO v_id, v_status, v_ultimo
  FROM frv_omie.config_omie
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_status = 'running' AND v_ultimo > now() - interval '10 minutes' THEN
    RETURN FALSE;
  END IF;

  UPDATE frv_omie.config_omie
  SET status_sync = 'running'
  WHERE id = v_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION frv_omie.release_sync_lock(p_status TEXT DEFAULT 'idle')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE frv_omie.config_omie
  SET status_sync = p_status,
      ultimo_sync = CASE WHEN p_status IN ('idle', 'success') THEN now() ELSE ultimo_sync END
  WHERE id IS NOT NULL;
END;
$$;

-- -------------------------------------------------------------
-- Views: force security_invoker
-- -------------------------------------------------------------

CREATE OR REPLACE VIEW frv_omie.config_omie_safe
WITH (security_invoker = true) AS
SELECT
  id,
  sync_interval_hours,
  status_sync,
  ultimo_sync,
  (app_key IS NOT NULL AND app_key != '') AS has_credentials,
  (webhook_secret IS NOT NULL AND webhook_secret != '') AS has_webhook_secret
FROM frv_omie.config_omie;

CREATE OR REPLACE VIEW frv_omie.v_curva_abc_valor
WITH (security_invoker = true) AS
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
total AS (
  SELECT SUM(valor) AS soma
  FROM ranked
)
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

CREATE OR REPLACE VIEW frv_omie.v_curva_abc_quantidade
WITH (security_invoker = true) AS
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
total AS (
  SELECT SUM(quantidade) AS soma
  FROM ranked
)
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

GRANT SELECT ON frv_omie.config_omie_safe TO authenticated;
GRANT SELECT ON frv_omie.v_curva_abc_valor TO authenticated;
GRANT SELECT ON frv_omie.v_curva_abc_quantidade TO authenticated;
