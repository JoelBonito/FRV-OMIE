# Changelog

Todas as mudanças notáveis deste projeto serão documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [1.0.0] - 2026-02-25

### Primeiro Release de Produção — MVP completo com 9 Epics (41 Stories)

---

### Added

**Epic 1 — Scaffold & Setup**
- Setup Vite 7 + React 19 + TypeScript strict mode
- Tailwind CSS v4 + shadcn/ui (16 componentes instalados)
- Estrutura de pastas modular (pages, components, services, hooks, lib)
- React Router v7 com rotas protegidas por role
- MainLayout com Sidebar responsivo e Header contextual
- Supabase JS v2.97 configurado com schema customizado `frv_omie`

**Epic 2 — SQL Migrations**
- Schema PostgreSQL completo no schema `frv_omie`
- Tabelas: `vendedores`, `clientes`, `vendas`, `carteira_historico`, `config_omie`, `sync_logs`
- Views SQL: `v_resumo_global`, `v_vendas_por_vendedor`, `v_carteira_detalhada`, `v_administradoras_mensal`, `v_clientes_inativos`
- Índices de performance em campos de filtro e lookup frequente
- RLS policies por role: admin (full), gerente (read), vendedor (própria carteira)

**Epic 3 — Autenticação & RBAC**
- AuthContext com Supabase Auth (JWT + session persistence)
- Hook `useRole` com detecção automática de papel (admin/gerente/vendedor)
- ProtectedRoute para bloqueio de rotas sem autenticação
- RoleGuard para controle granular de permissões por componente
- LoginPage com validação de formulário (react-hook-form + Zod)

**Epic 4 — Frontend Pages (8 páginas)**
- **DashboardPage**: KPIs em tempo real, line chart evolutivo, donut por tipo, stacked bar por vendedor, top performers, filtro de período
- **ClientesPage**: DataTable com paginação + 4 filtros + ClienteFormDialog (CRUD completo)
- **ClienteDetalhePage**: Histórico de vendas por cliente, KPIs individuais (rota `/clientes/:id`)
- **VendedoresPage**: Cards grid + painel de estatísticas + mini bar chart + VendedorFormDialog
- **VendasPage**: DataTable com 5 filtros simultâneos + VendaFormDialog + alerta de pendências
- **CarteirasPage**: Pivot table (cliente × mês) + tabs por vendedor + stats resumo + TransferModal
- **SyncPage**: Monitor de sincronização Omie com logs em tempo real, indicador de fase e tipo de sync
- **ConfigPage**: Gestão de credenciais Omie, intervalo de auto-sync, seção de usuários (admin-only)

**Epic 5 — Seed Data**
- Seed SQL com 5 vendedores, 41 clientes (40+ administradoras), 8 meses de histórico (Jun/25–Jan/26)
- Validação de seed contra métricas reais do PRD (~R$200k/mês)

**Epic 6 — Otimização & Resiliência**
- Code splitting com `React.lazy` + `Suspense` em todas as rotas (1300KB → 435KB)
- `manualChunks` Vite para separação de vendor chunks (recharts, tanstack, shadcn)
- Error boundaries globais (App) + por página (SuspenseWrapper)

**Epic 7 — Migração de Dados**
- Script TypeScript `scripts/migrate-excel.ts` para migração da planilha XLSX
- Leitura automática de múltiplas abas, normalização de dados e upsert via Supabase

**Epic 8 — Integração Omie CRM**
- Edge Function `omie-proxy` v3: proxy genérico para API Omie
- Edge Function `omie-sync` v5: sync completo/incremental com reconciliação de vendedores por nome
- Edge Function `omie-webhook` v3: listener para eventos real-time do Omie
- Módulos compartilhados: `_shared/omie-client.ts` e `supabase-admin.ts`
- Hook `useTriggerSync` com execução sequencial (vendedores → clientes → vendas) para evitar timeout de 60s
- Hook `useAutoSync` em MainLayout com trigger automático por intervalo configurável
- Migration pg_cron para sync incremental a cada 6h (ativa em Supabase Pro+)
- Mapeamento de tags Omie → tipo de cliente (sindico/empresa/consumidor/admin)

**Epic 9 — Redesign Premium V2.0**
- Design System completo documentado em `docs/DESIGN_SYSTEM.md`
- Paleta Omie Blue & Teal com variáveis CSS para light/dark mode
- Tipografia: Space Grotesk (display), Noto Sans (body), JetBrains Mono (valores numéricos)
- KPI Cards com gradient icons, glow blur e animação hover
- Sidebar com gradient nav active (cyan→blue) e avatar de usuário
- Botões com gradient primary (cyan→blue), base `rounded-lg`
- Refinamento de proporções, escala global e contexto temporal em todas as páginas

---

### Stack Técnico

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, TypeScript strict, Vite 7 |
| Styling | Tailwind CSS v4, shadcn/ui |
| Routing | React Router v7 |
| Data Fetching | TanStack Query v5 |
| Forms | react-hook-form + Zod v4 |
| Charts | Recharts |
| Tables | TanStack Table |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| Deploy | Vercel (frontend) + Supabase (backend) |

---

*Para próximas versões, ver seção "Próximos Passos" nas Release Notes.*
