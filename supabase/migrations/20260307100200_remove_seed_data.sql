-- =============================================================
-- Migration: Remove seed/fictitious data
-- Clears test data inserted by 20260223174000_seed_data.sql
-- Order: vendas -> clientes -> vendedores (respect FKs)
-- =============================================================

-- Delete seed vendas (all vendas linked to seed clientes with UUID prefix c2000000-)
DELETE FROM frv_omie.vendas
WHERE cliente_id IN (
  SELECT id FROM frv_omie.clientes WHERE id::text LIKE 'c2000000-%'
);

-- Delete seed clientes (UUID prefix c2000000-)
DELETE FROM frv_omie.clientes WHERE id::text LIKE 'c2000000-%';

-- Delete seed vendedores (UUID prefix a1000000-)
-- BUT preserve any that were reconciled with real Omie data (have omie_id set)
DELETE FROM frv_omie.vendedores
WHERE id::text LIKE 'a1000000-%' AND omie_id IS NULL;
