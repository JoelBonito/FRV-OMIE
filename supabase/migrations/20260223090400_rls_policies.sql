-- =============================================================
-- Migration 005: Row Level Security policies
-- 3 roles: admin, gerente, vendedor
-- =============================================================

-- Helper function to get user role from JWT
CREATE OR REPLACE FUNCTION frv_omie.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'user_role',
    'vendedor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to get vendedor_id for current user
CREATE OR REPLACE FUNCTION frv_omie.get_my_vendedor_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM frv_omie.vendedores
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================
-- RLS: vendedores
-- =============================================================
ALTER TABLE frv_omie.vendedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendedores_admin_all ON frv_omie.vendedores
  FOR ALL USING (frv_omie.get_user_role() IN ('admin', 'gerente'));

CREATE POLICY vendedores_self_read ON frv_omie.vendedores
  FOR SELECT USING (auth_user_id = auth.uid());

-- =============================================================
-- RLS: clientes
-- =============================================================
ALTER TABLE frv_omie.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY clientes_admin_all ON frv_omie.clientes
  FOR ALL USING (frv_omie.get_user_role() IN ('admin', 'gerente'));

CREATE POLICY clientes_vendedor_read ON frv_omie.clientes
  FOR SELECT USING (vendedor_id = frv_omie.get_my_vendedor_id());

-- =============================================================
-- RLS: vendas
-- =============================================================
ALTER TABLE frv_omie.vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendas_admin_all ON frv_omie.vendas
  FOR ALL USING (frv_omie.get_user_role() IN ('admin', 'gerente'));

CREATE POLICY vendas_vendedor_read ON frv_omie.vendas
  FOR SELECT USING (vendedor_id = frv_omie.get_my_vendedor_id());

-- =============================================================
-- RLS: carteira_historico
-- =============================================================
ALTER TABLE frv_omie.carteira_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY carteira_admin_all ON frv_omie.carteira_historico
  FOR ALL USING (frv_omie.get_user_role() IN ('admin', 'gerente'));

CREATE POLICY carteira_vendedor_read ON frv_omie.carteira_historico
  FOR SELECT USING (
    vendedor_anterior_id = frv_omie.get_my_vendedor_id()
    OR vendedor_novo_id = frv_omie.get_my_vendedor_id()
  );

-- =============================================================
-- RLS: config_omie (admin only)
-- =============================================================
ALTER TABLE frv_omie.config_omie ENABLE ROW LEVEL SECURITY;

CREATE POLICY config_admin_only ON frv_omie.config_omie
  FOR ALL USING (frv_omie.get_user_role() = 'admin');

-- =============================================================
-- RLS: sync_logs (admin and gerente only)
-- =============================================================
ALTER TABLE frv_omie.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY sync_logs_admin_gerente ON frv_omie.sync_logs
  FOR ALL USING (frv_omie.get_user_role() IN ('admin', 'gerente'));

-- =============================================================
-- GRANTs for views
-- =============================================================
GRANT SELECT ON frv_omie.v_resumo_global TO authenticated;
GRANT SELECT ON frv_omie.v_vendas_por_vendedor TO authenticated;
GRANT SELECT ON frv_omie.v_carteira_detalhada TO authenticated;
GRANT SELECT ON frv_omie.v_administradoras_mensal TO authenticated;
GRANT SELECT ON frv_omie.v_clientes_inativos TO authenticated;
