# Backlog — FRV-OMIE Dashboard de Vendas

## Epic 1: Scaffold & Setup [OWNER: claude_code] [MODEL: opus-4-6]
- [x] Story 1.1: Setup Vite + React 19 + TypeScript strict
- [x] Story 1.2: Configurar Tailwind CSS v4 + shadcn/ui
- [x] Story 1.3: Estrutura de pastas (pages, components, services, hooks, lib)
- [x] Story 1.4: Rotas com react-router-dom v7
- [x] Story 1.5: MainLayout + Sidebar + Header
- [x] Story 1.6: Supabase client (schema frv_omie)

## Epic 2: SQL Migrations [OWNER: claude_code] [MODEL: opus-4-6]
- [x] Story 2.1: Schema + tabela vendedores
- [x] Story 2.2: Tabela clientes + indexes
- [x] Story 2.3: Tabelas vendas, carteira_historico, config_omie, sync_logs
- [x] Story 2.4: Views SQL (v_resumo_global, v_vendas_por_vendedor, v_carteira_detalhada, v_administradoras_mensal, v_clientes_inativos)
- [x] Story 2.5: RLS policies (admin, gerente, vendedor)

## Epic 3: Autenticação & RBAC [OWNER: claude_code] [MODEL: opus-4-6]
- [x] Story 3.1: AuthContext + Supabase Auth
- [x] Story 3.2: useRole hook (admin, gerente, vendedor)
- [x] Story 3.3: ProtectedRoute + RoleGuard
- [x] Story 3.4: LoginPage

## Epic 4: Frontend Pages [OWNER: claude_code] [MODEL: opus-4-6]
- [x] Story 4.1: DashboardPage (KPIs, line chart, donut, stacked bar, top vendedores, period filter)
- [x] Story 4.2: ClientesPage (DataTable + filters + ClienteFormDialog)
- [x] Story 4.3: ClienteDetalhePage (route /clientes/:id)
- [x] Story 4.4: VendedoresPage (cards grid + stats + VendedorFormDialog)
- [x] Story 4.5: VendasPage (DataTable + 5 filters + VendaFormDialog + pending alert)
- [x] Story 4.6: CarteirasPage (pivot table + vendedor tabs + TransferModal)
- [x] Story 4.7: SyncPage (monitor de sincronização Omie)
- [x] Story 4.8: ConfigPage (credenciais Omie + gestão usuários, admin-only)

## Epic 5: Seed Data & Testes [OWNER: claude_code] [MODEL: opus-4-6]
- [x] Story 5.1: Seed data SQL (vendedores, clientes, vendas Jun/25-Jan/26)
- [x] Story 5.2: Validar seed contra métricas do PRD

## Epic 6: Otimização & Resiliência [OWNER: claude_code] [MODEL: opus-4-6]
- [x] Story 6.1: Code splitting (React.lazy + Suspense nas rotas)
- [x] Story 6.2: Error boundaries globais

## Epic 7: Migração de Dados [OWNER: claude_code] [MODEL: opus-4-6]
- [x] Story 7.1: Script de migração Excel → Supabase (leitura XLSX + normalização + upsert)

## Epic 8: Integração Omie [OWNER: claude_code] [MODEL: opus-4-6]
- [x] Story 8.1: Edge Function omie-proxy (generic API proxy)
- [x] Story 8.2: Edge Function omie-sync (clientes + vendas)
- [x] Story 8.3: Shared modules (_shared/omie-client.ts, supabase-admin.ts)
- [x] Story 8.4: Frontend trigger sync (SyncPage button + useTriggerSync hook)
- [x] Story 8.5: Webhook listener (Edge Function para eventos real-time)
- [x] Story 8.6: pg_cron sync incremental (6h)
- [x] Story 8.7: Deploy Edge Functions ao Supabase

## Epic 9: Redesign Premium V2.0 [OWNER: antigravity] [MODEL: gemini-2.0-flash-exp]
- [x] Story 9.1: Paleta de Cores Omie Blue & Teal (VITE_THEME)
- [x] Story 9.2: Tipografia Digital/Mono para valores numéricos
- [x] Story 9.3: Refatoração SyncPage e Monitoramento (V2.0)
- [x] Story 9.4: Refatoração Vendas e Pivot Tables (V2.0)
- [x] Story 9.5: Refatoração Clientes, Vendedores e Login (V2.0)
- [x] Story 9.6: Refinamento de Proporções, Escala Global e Contexto Temporal (V2.0)
