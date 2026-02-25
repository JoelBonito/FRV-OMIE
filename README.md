# FRV-OMIE — Dashboard de Vendas

Sistema web de gestão de vendas integrado ao Omie CRM, desenvolvido para substituir planilha Excel com ~R$200k/mês de faturamento gerenciado.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript strict + Vite 7 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Routing | React Router v7 |
| Data Fetching | TanStack Query v5 |
| Forms | react-hook-form + Zod v4 |
| Charts | Recharts |
| Tables | TanStack Table |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| Deploy | Vercel + Supabase |

---

## Funcionalidades

- **Dashboard** — KPIs em tempo real, gráficos evolutivos, filtro de período
- **Clientes** — CRUD completo, histórico de vendas por cliente, detalhamento
- **Vendedores** — Cards de performance, stats, transferência de carteira
- **Vendas** — Registro e acompanhamento com 5 filtros simultâneos
- **Carteiras** — Pivot table cliente × mês por vendedor com TransferModal
- **Sync Omie** — Monitor de sincronização em tempo real com logs
- **Config** — Credenciais Omie, intervalo de sync, gestão de usuários

---

## Pré-requisitos

- Node.js 20+
- Conta Supabase com projeto configurado
- Credenciais Omie CRM (App Key + App Secret)

---

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### 3. Executar migrações no Supabase

Execute os arquivos em `supabase/migrations/` em ordem:

```
001_create_schema.sql
002_tables_vendedores_clientes.sql
003_tables_vendas_historico_config.sql
004_views.sql
005_rls_policies.sql
```

### 4. Popular dados iniciais (opcional)

```sql
-- Executar no SQL Editor do Supabase
\i supabase/seed.sql
```

### 5. Deploy das Edge Functions

```bash
supabase functions deploy omie-proxy
supabase functions deploy omie-sync
supabase functions deploy omie-webhook
```

### 6. Iniciar em desenvolvimento

```bash
npm run dev
```

---

## Estrutura do Projeto

```
src/
├── components/
│   ├── charts/         # Recharts wrappers
│   ├── layout/         # Sidebar, Header, MainLayout
│   ├── tables/         # TanStack Table wrappers
│   └── ui/             # shadcn/ui components
├── hooks/              # TanStack Query hooks por domínio
│   ├── useCarteiras.ts
│   ├── useClientes.ts
│   ├── useDashboard.ts
│   ├── useSync.ts
│   ├── useVendas.ts
│   └── useVendedores.ts
├── pages/              # Páginas da aplicação
│   ├── carteiras/
│   ├── clientes/
│   ├── config/
│   ├── dashboard/
│   ├── login/
│   ├── sync/
│   ├── vendas/
│   └── vendedores/
├── services/
│   ├── api/            # Funções de acesso ao Supabase
│   └── export/         # Exportação de dados
├── lib/
│   └── supabase.ts     # Cliente Supabase configurado
└── contexts/
    └── AuthContext.tsx  # Auth + RBAC

supabase/
├── functions/
│   ├── omie-proxy/     # Proxy genérico para API Omie
│   ├── omie-sync/      # Sync completo/incremental
│   └── omie-webhook/   # Webhook listener real-time
└── migrations/         # 5 arquivos SQL em ordem

scripts/
└── migrate-excel.ts    # Migração de planilha XLSX
```

---

## Roles & Permissões

| Role | Acesso |
|------|--------|
| `admin` | Full access — todas as páginas + Config |
| `gerente` | Leitura de todos os dados, sem Config |
| `vendedor` | Apenas própria carteira de clientes |

---

## Integração Omie

A sincronização com o Omie CRM ocorre em 3 fases sequenciais:

1. **Vendedores** — reconcilia por nome com dados seeded
2. **Clientes** — importa com mapeamento de tags → tipo
3. **Vendas** — importa contas receber e pedidos com associação de vendedor

Auto-sync configurável por intervalo (padrão: 6h via pg_cron no Supabase Pro+).

Webhook disponível em: `https://seu-projeto.supabase.co/functions/v1/omie-webhook`

---

## Migração de Dados (Excel → Supabase)

```bash
npx tsx scripts/migrate-excel.ts ./RELATORIO_COMPLETO_VENDAS.xlsx
```

O script lê múltiplas abas, normaliza dados numéricos e executa upsert no Supabase.

---

## Build

```bash
npm run build
```

O build gera chunks otimizados (~435KB total vs 1300KB pré-otimização):
- `vendor-react` — React + Router
- `vendor-ui` — shadcn/ui + Tailwind
- `vendor-charts` — Recharts
- `vendor-query` — TanStack Query + Table

---

## Deploy

### Vercel (Frontend)

```bash
vercel --prod
```

Variáveis de ambiente necessárias no painel Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Supabase (Backend)

Edge Functions já deployadas. Para re-deploy:

```bash
supabase functions deploy --project-ref seu-project-ref
```

---

## Documentação Adicional

- `docs/PRD_VENDAS_OMIE_SUPABASE_v2.md` — Product Requirements
- `docs/DESIGN_SYSTEM.md` — Design System V2.0
- `docs/BACKLOG.md` — Histórico completo de stories
- `docs/CADERNO_DE_TESTES.md` — Caderno de testes (118 casos)
- `CHANGELOG.md` — Histórico de versões

---

**v1.0.0** — Release MVP | 2026-02-25
