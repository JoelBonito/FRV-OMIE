# PRD - Product Requirements Document
## Sistema de Gestão de Vendas | Integração Omie CRM
### Supabase + Vercel | v2.0

| Campo | Valor |
|-------|-------|
| **Cliente** | Inove AI |
| **Versão** | 2.0 |
| **Data** | 22/02/2026 |
| **Autor** | Joel - Inove AI |
| **Status** | Draft |
| **Stack** | React/TS + Supabase + Vercel |

---

# 1. Visão Geral do Projeto

## 1.1 Problema Atual

A empresa utiliza uma planilha Excel (RELATORIO_COMPLETO_VENDAS.xlsx) com 7 abas para controlar todo o faturamento de vendas. A planilha rastreia vendas mensais por tipo de cliente (Administradoras, Empresas, Síndicos, Consumidor Final), por vendedor (Thalia, Gabriel, Mateus, Fabia e outros), e por administradora individual (mais de 40 administradoras ativas). O faturamento mensal gira em torno de R$ 200.000.

### Problemas identificados:

- Dados duplicados entre abas (mesma administradora aparece em múltiplas abas com valores diferentes)
- Entrada manual propensa a erros (valores como 'INATIVOU', '-', NaN misturados com dados numéricos)
- Sem integração com o ERP Omie — dados precisam ser copiados manualmente
- Sem histórico de alterações ou auditoria de quem mudou o quê
- Impossível gerar relatórios dinâmicos ou fazer drill-down nos dados
- Carteiras de vendedores gerenciadas em abas separadas sem consolidação em tempo real
- Anotações informais nas células (ex: "COMPROU EM DEZEMBRO E NÃO COMPROU EM JANEIRO")
- Sem alertas automáticos para clientes inativos ou queda de faturamento

## 1.2 Solução Proposta

Sistema web que substitua completamente a planilha, integrando-se à API do Omie CRM para sincronização automática de dados de vendas, clientes e faturamento. Arquitetura: React/TypeScript no frontend (Vercel), Supabase como backend (Postgres + Auth + Edge Functions + Realtime).

## 1.3 Métricas-Chave da Planilha Atual

| Métrica | Valor (Jan/26) | % do Total |
|---------|---------------|------------|
| Vendas Totais Mensais | R$ 200.292,58 | 100% |
| Administradoras | R$ 138.924,00 | 69,4% — principal receita |
| Síndicos | R$ 35.235,00 | 17,6% |
| Empresas | R$ 25.494,00 | 12,7% |
| Consumidor Final | R$ 455,67 | 0,2% |
| ⚠️ Vendas sem Nome | R$ 494,58 | Requer classificação |
| ✅ Vendedores Ativos | 4 | Thalia, Mateus, Gabriel, Fabia |
| Administradoras Ativas | 40+ | Algumas marcadas INATIVOU |

## 1.4 Estrutura da Planilha Mapeada

| Aba | Conteúdo | Métricas | Período |
|-----|----------|----------|---------|
| RESUMO GLOBAL | Vendas por tipo + vendedor | Totais mensais consolidados | Jun/25 a Jan/26 |
| VALOR POR ADM | 40+ administradoras | Faturamento mensal individual | Jun/25 a Jan/26 |
| CARTEIRA FERNANDA | 6 administradoras | Valores + Média | Jun a Nov (inativada) |
| MATEUS | Empresas + Síndicos + ADMs | Subtotais por tipo | Jun/25 a Jan/26 |
| CARTEIRA GABRIEL | 15+ administradoras | Faturamento + remanejamentos | Jun/25 a Jan/26 |
| CARTEIRA THALIA | 30+ administradoras | Faturamento detalhado | Jun/25 a Jan/26 |
| NOVA THALIA | Versão atualizada | Inclui status INATIVOU | Jun/25 a Jan/26 |

---

# 2. Arquitetura Técnica — Supabase + Vercel

## 2.1 Por que Supabase ao invés de Firebase

A natureza dos dados deste projeto é fundamentalmente relacional: clientes pertencem a vendedores, vendas pertencem a clientes e meses, administradoras se cruzam com períodos. As queries analíticas que substituem a planilha (totais por tipo, agrupamentos por mês, rankings de vendedores) são triviais em SQL e complexas em bancos de documentos.

| Critério | Supabase (Postgres) | Firebase (Firestore) |
|----------|-------------------|---------------------|
| Queries analíticas | ✅ SQL nativo: JOIN, GROUP BY, SUM, window functions | ⚠️ Requer desnormalização ou múltiplas queries client-side |
| Integridade referencial | ✅ Foreign keys nativas | ❌ Sem FK, consistência manual |
| Dados da API Omie | ✅ Mapeia direto: nCodCliente = FK | ⚠️ IDs viram strings em documentos |
| Row Level Security | ✅ Nativo via policies SQL | ✅ Security Rules (sintaxe própria) |
| Realtime | ✅ Supabase Realtime (Postgres changes) | ✅ Firestore onSnapshot |
| Cron jobs | ✅ **pg_cron nativo no banco** | ⚠️ Cloud Scheduler (serviço extra) |
| Edge Functions | ✅ Deno (TypeScript nativo) | ✅ Cloud Functions (Node.js) |
| Custo base | ✅ Free tier generoso, Pro $25/mês | ⚠️ Pay-as-you-go, reads caros em escala |

## 2.2 Stack Definitivo

| Camada | Tecnologia | Função |
|--------|-----------|--------|
| Frontend | React + TypeScript + Vite | SPA com deploy na Vercel |
| UI | Tailwind CSS + shadcn/ui | Design system com componentes prontos |
| Charts | Recharts | Gráficos de vendas interativos |
| Tabelas | TanStack Table | Tabelas com sort, filtro, paginação |
| Banco de Dados | Supabase (Postgres) | Dados relacionais + RLS + Realtime |
| Autenticação | Supabase Auth | Email/senha + roles via custom claims |
| API Omie Proxy | Supabase Edge Functions | Proxy seguro, credenciais server-side |
| Sync Engine | Edge Functions + pg_cron | Sync automático a cada 6h |
| Webhook Listener | Edge Function (HTTP) | Recebe eventos do Omie em real-time |
| Hosting | Vercel | CDN global, preview deploys, CI/CD |

## 2.3 Diagrama de Arquitetura

```
[ Omie ERP ] --webhook--> [ Edge Function: webhook-listener ]
    |                              |
    |                              v
    |                     [ Supabase Postgres ]
    |                              |
    |<--api-call--- [ Edge Function: omie-sync ] <--pg_cron (6h)
                                   |
                          [ Supabase Realtime ]
                                   |
                                   v
                    [ React Dashboard (Vercel) ]
```

---

# 3. Schema do Banco de Dados (Postgres)

## 3.1 Tabelas Principais

### vendedores

```sql
CREATE TABLE vendedores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  omie_id       BIGINT UNIQUE,
  auth_user_id  UUID REFERENCES auth.users(id),
  nome          TEXT NOT NULL,
  email         TEXT,
  status        TEXT DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  meta_mensal   NUMERIC(12,2),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
```

### clientes

```sql
CREATE TABLE clientes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  omie_id       BIGINT UNIQUE,
  nome          TEXT NOT NULL,
  tipo          TEXT NOT NULL CHECK (tipo IN
    ('administradora','empresa','sindico','consumidor_final')),
  status        TEXT DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  vendedor_id   UUID REFERENCES vendedores(id),
  cnpj          TEXT,
  telefone      TEXT,
  email         TEXT,
  notas         TEXT,
  data_inativacao  DATE,
  motivo_inativacao TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clientes_vendedor ON clientes(vendedor_id);
CREATE INDEX idx_clientes_tipo ON clientes(tipo);
CREATE INDEX idx_clientes_status ON clientes(status);
```

### vendas

```sql
CREATE TABLE vendas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  omie_id       BIGINT UNIQUE,
  cliente_id    UUID NOT NULL REFERENCES clientes(id),
  vendedor_id   UUID NOT NULL REFERENCES vendedores(id),
  valor         NUMERIC(12,2) NOT NULL,
  mes           INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano           INTEGER NOT NULL CHECK (ano BETWEEN 2020 AND 2100),
  data_venda    DATE,
  tipo_cliente  TEXT NOT NULL,
  status        TEXT DEFAULT 'faturado' CHECK (status IN
    ('faturado','pendente','cancelado')),
  nota_fiscal   TEXT,
  pedido_omie_id BIGINT,
  observacao    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vendas_periodo ON vendas(ano, mes);
CREATE INDEX idx_vendas_cliente ON vendas(cliente_id);
CREATE INDEX idx_vendas_vendedor ON vendas(vendedor_id);
CREATE INDEX idx_vendas_tipo ON vendas(tipo_cliente);
```

### carteira_historico

```sql
CREATE TABLE carteira_historico (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id          UUID NOT NULL REFERENCES clientes(id),
  vendedor_anterior_id UUID REFERENCES vendedores(id),
  vendedor_novo_id    UUID NOT NULL REFERENCES vendedores(id),
  data_transferencia  TIMESTAMPTZ DEFAULT now(),
  motivo              TEXT,
  aprovado_por        UUID REFERENCES auth.users(id)
);
```

### config_omie

```sql
CREATE TABLE config_omie (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key       TEXT NOT NULL,
  app_secret    TEXT NOT NULL, -- vault encrypted
  webhook_secret TEXT,
  ultimo_sync   TIMESTAMPTZ,
  status_sync   TEXT DEFAULT 'idle',
  sync_interval_hours INTEGER DEFAULT 6
);
```

### sync_logs (Observabilidade)

```sql
CREATE TABLE sync_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          TEXT NOT NULL,    -- 'full_sync','incremental','webhook'
  endpoint      TEXT NOT NULL,    -- '/api/v1/financas/contareceber/'
  call_method   TEXT,             -- 'ListarContasReceber'
  status        TEXT NOT NULL,    -- 'success','error','partial'
  registros_processados INTEGER DEFAULT 0,
  registros_criados     INTEGER DEFAULT 0,
  registros_atualizados INTEGER DEFAULT 0,
  erros         JSONB,
  duracao_ms    INTEGER,
  payload_resumo JSONB,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_logs_created ON sync_logs(created_at DESC);
```

## 3.2 Views SQL (Substituem a Planilha)

### v_resumo_global — substitui aba RESUMO GLOBAL

```sql
CREATE VIEW v_resumo_global AS
SELECT
  ano, mes,
  SUM(valor) AS total_geral,
  SUM(CASE WHEN tipo_cliente = 'administradora' THEN valor END) AS total_adm,
  SUM(CASE WHEN tipo_cliente = 'empresa' THEN valor END) AS total_empresas,
  SUM(CASE WHEN tipo_cliente = 'sindico' THEN valor END) AS total_sindicos,
  SUM(CASE WHEN tipo_cliente = 'consumidor_final' THEN valor END) AS total_cf
FROM vendas
WHERE status = 'faturado'
GROUP BY ano, mes
ORDER BY ano DESC, mes DESC;
```

### v_vendas_por_vendedor — substitui colunas VENDEDORES

```sql
CREATE VIEW v_vendas_por_vendedor AS
SELECT
  v.ano, v.mes, ve.nome AS vendedor,
  SUM(v.valor) AS total,
  COUNT(DISTINCT v.cliente_id) AS clientes_atendidos
FROM vendas v
JOIN vendedores ve ON v.vendedor_id = ve.id
WHERE v.status = 'faturado'
GROUP BY v.ano, v.mes, ve.nome;
```

### v_carteira_detalhada — substitui abas CARTEIRA GABRIEL, THALIA, etc.

```sql
CREATE VIEW v_carteira_detalhada AS
SELECT
  ve.nome AS vendedor, cl.nome AS cliente, cl.tipo,
  v.ano, v.mes, v.valor,
  AVG(v.valor) OVER (PARTITION BY cl.id) AS media_cliente
FROM vendas v
JOIN clientes cl ON v.cliente_id = cl.id
JOIN vendedores ve ON v.vendedor_id = ve.id
WHERE v.status = 'faturado'
ORDER BY ve.nome, cl.nome, v.ano, v.mes;
```

### v_administradoras_mensal — substitui aba VALOR POR ADMINISTRADORA

```sql
CREATE VIEW v_administradoras_mensal AS
SELECT
  cl.nome AS administradora, v.ano, v.mes, v.valor,
  LAG(v.valor) OVER (PARTITION BY cl.id ORDER BY v.ano, v.mes)
    AS valor_mes_anterior,
  CASE WHEN v.valor = 0 AND LAG(v.valor)
    OVER (PARTITION BY cl.id ORDER BY v.ano, v.mes) = 0
    THEN true ELSE false END AS possivel_inativo
FROM vendas v
JOIN clientes cl ON v.cliente_id = cl.id
WHERE cl.tipo = 'administradora'
ORDER BY cl.nome, v.ano, v.mes;
```

### v_clientes_inativos — detecção automática

```sql
CREATE VIEW v_clientes_inativos AS
SELECT
  cl.id, cl.nome, cl.tipo, ve.nome AS vendedor,
  MAX(v.ano * 100 + v.mes) AS ultimo_periodo,
  MAX(v.data_venda) AS ultima_compra
FROM clientes cl
LEFT JOIN vendas v ON cl.id = v.cliente_id AND v.status = 'faturado'
LEFT JOIN vendedores ve ON cl.vendedor_id = ve.id
WHERE cl.status = 'ativo'
GROUP BY cl.id, cl.nome, cl.tipo, ve.nome
HAVING MAX(v.data_venda) < CURRENT_DATE - INTERVAL '60 days'
   OR MAX(v.data_venda) IS NULL;
```

## 3.3 Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Admins e Gerentes veem tudo
CREATE POLICY admin_all ON vendas FOR ALL
  USING (auth.jwt()->>'role' IN ('admin','gerente'));

-- Vendedores veem apenas sua carteira
CREATE POLICY vendedor_own ON vendas FOR SELECT
  USING (vendedor_id = (
    SELECT id FROM vendedores
    WHERE auth_user_id = auth.uid()
  ));

-- Mesma lógica para clientes
CREATE POLICY admin_all_clientes ON clientes FOR ALL
  USING (auth.jwt()->>'role' IN ('admin','gerente'));

CREATE POLICY vendedor_own_clientes ON clientes FOR SELECT
  USING (vendedor_id = (
    SELECT id FROM vendedores
    WHERE auth_user_id = auth.uid()
  ));
```

---

# 4. Integração com API Omie

## 4.1 Visão Geral

A API Omie usa JSON-RPC via POST. Todas as requisições seguem o mesmo formato: POST para o endpoint com app_key, app_secret, call (nome do método) e param (parâmetros) no body. As credenciais ficam criptografadas na tabela config_omie e são acessadas apenas pelas Edge Functions server-side.

### Formato padrão de requisição:

```json
POST https://app.omie.com.br/api/v1/{modulo}/{servico}/

{
  "app_key": "XXXXX",
  "app_secret": "XXXXX",
  "call": "NomeDoMetodo",
  "param": [{ "pagina": 1, "registros_por_pagina": 50 }]
}
```

## 4.2 Endpoints Utilizados

### Prioridade Alta — Core do Sistema

| Serviço | Endpoint | Método | Dados para o Sistema |
|---------|----------|--------|---------------------|
| Clientes | `/geral/clientes/` | ListarClientes | Base de clientes: ADMs, Empresas, Síndicos |
| Contas CRM | `/crm/contas/` | contaListar | Contas comerciais e oportunidades |
| Vendedores | `/crm/usuarios/` | Listar | Thalia, Gabriel, Mateus, Fabia... |
| Contas Receber | `/financas/contareceber/` | ListarContasReceber | Faturamento real: valor, cliente, mês |
| Pesq. Títulos | `/financas/pesquisartitulos/` | PesquisarLancamentos | Busca avançada por período/status |
| Tags | `/geral/clientetag/` | ListarTags | Classificar tipo de cliente |

### Prioridade Média — CRM e Pipeline

| Serviço | Endpoint | Método | Dados para o Sistema |
|---------|----------|--------|---------------------|
| Oportunidades | `/crm/oportunidades/` | opListar | Pipeline de vendas por vendedor |
| Op. Resumo | `/crm/oportunidades-resumo/` | Listar | Visão consolidada do funil |
| Fases | `/crm/fases/` | fasesListar | Etapas do pipeline |
| Mov. Financ. | `/financas/mf/` | ListarMovimentos | Pagamentos e baixas reais |
| Pedidos Venda | `/produtos/pedido/` | ListarPedidos | Pedidos vinculados a clientes |

## 4.3 Estratégia de Sincronização

| Tipo | Frequência | Detalhes |
|------|-----------|----------|
| Full Sync | Sob demanda | Importa todos dados dos últimos 12 meses. Configuração inicial e reconciliações. |
| Incremental | A cada 6h (pg_cron) | Edge Function consulta apenas registros alterados desde último sync. |
| Webhook | Tempo real | Omie envia POST para Edge Function quando venda/cliente é criado ou alterado. |
| Reconciliação | Diária (madrugada) | Compara totais Supabase vs Omie para detectar divergências. Grava em sync_logs. |

## 4.4 Edge Function: omie-proxy (exemplo)

```typescript
// supabase/functions/omie-proxy/index.ts
import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const { endpoint, call, params } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Buscar credenciais da tabela config_omie
  const { data: config } = await supabase
    .from('config_omie').select('*').single()

  const startTime = Date.now()

  // Chamar API Omie
  const response = await fetch(
    `https://app.omie.com.br/api/v1/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_key: config.app_key,
      app_secret: config.app_secret,
      call,
      param: [params]
    })
  })

  const data = await response.json()
  const duracao = Date.now() - startTime

  // Logar sync
  await supabase.from('sync_logs').insert({
    tipo: 'api_call',
    endpoint,
    call_method: call,
    status: response.ok ? 'success' : 'error',
    duracao_ms: duracao,
    erros: response.ok ? null : data,
    payload_resumo: { total_registros: data?.total_de_registros }
  })

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

## 4.5 Edge Function: omie-sync-clientes (exemplo)

```typescript
// supabase/functions/omie-sync-clientes/index.ts
import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from '@supabase/supabase-js'

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: config } = await supabase
    .from('config_omie').select('*').single()

  let pagina = 1
  let totalPages = 1
  let criados = 0
  let atualizados = 0

  while (pagina <= totalPages) {
    const response = await fetch(
      'https://app.omie.com.br/api/v1/geral/clientes/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_key: config.app_key,
        app_secret: config.app_secret,
        call: 'ListarClientes',
        param: [{
          pagina,
          registros_por_pagina: 50,
          clientesFiltro: { inativo: 'N' }
        }]
      })
    })

    const data = await response.json()
    totalPages = data.total_de_paginas || 1

    for (const cli of data.clientes_cadastro || []) {
      const { error } = await supabase.from('clientes').upsert({
        omie_id: cli.codigo_cliente_omie,
        nome: cli.razao_social,
        cnpj: cli.cnpj_cpf,
        telefone: cli.telefone1_numero,
        email: cli.email,
        updated_at: new Date().toISOString()
      }, { onConflict: 'omie_id' })

      if (!error) {
        // Check if insert or update based on response
        criados++ // simplified
      }
    }

    pagina++
  }

  // Log resultado
  await supabase.from('sync_logs').insert({
    tipo: 'incremental',
    endpoint: '/geral/clientes/',
    call_method: 'ListarClientes',
    status: 'success',
    registros_criados: criados,
    registros_atualizados: atualizados
  })

  return new Response(JSON.stringify({ criados, atualizados }))
})
```

---

# 5. Funcionalidades do Sistema

## 5.1 Dashboard Principal (substitui aba RESUMO GLOBAL)

- Cards KPI no topo: Vendas Totais, Variação % vs mês anterior, Meta vs Realizado, Ticket Médio
- Gráfico de linhas: Evolução mensal de vendas (últimos 12 meses) — dados via `v_resumo_global`
- Gráfico de barras empilhadas: Vendas por tipo de cliente por mês
- Gráfico donut: Distribuição % por tipo (ADM 69%, Síndicos 18%, Empresas 13%)
- Ranking de vendedores com sparklines de tendência
- Filtros: Período, Vendedor, Tipo de Cliente, Administradora
- Alerta visual: Clientes que deixaram de comprar (badge vermelho)

**Query base:** `SELECT * FROM v_resumo_global WHERE ano = $1`

## 5.2 Gestão de Carteiras (substitui abas por vendedor)

- Visão por vendedor com administradoras e clientes atribuídos
- Tabela pivotada: Administradora x Meses com valores (replica visual da planilha)
- Cálculo automático de médias via window function (`AVG OVER PARTITION`)
- Indicadores visuais: setas verde/vermelho para variação mensal
- Drag-and-drop para transferência entre carteiras (grava em `carteira_historico`)
- Timeline de transferências com auditoria completa

**Query base:** `SELECT * FROM v_carteira_detalhada WHERE vendedor = $1`

## 5.3 Gestão de Administradoras (substitui aba VALOR POR ADM)

- Lista de 40+ administradoras com status ativo/inativo em tempo real
- Heatmap: administradoras x meses (cores por intensidade de faturamento)
- Detecção automática de inativação: `v_clientes_inativos` identifica 2+ meses sem venda
- Click para expandir: mostra pedidos individuais (dados do Omie)
- Campo de notas por administradora (substitui anotações informais da planilha)

**Query base:** `SELECT * FROM v_administradoras_mensal`

## 5.4 Painel de Observabilidade (Sync Monitor)

- Status da última sincronização com Omie (timestamp, duração, registros)
- Lista de `sync_logs` com filtro por tipo, status e período
- Indicadores: registros criados, atualizados, erros por sync
- Botão de sync manual com progresso em tempo real (Realtime do Supabase)
- Alertas automáticos quando sync falha ou detecta divergência
- Detalhamento de erros com payload do Omie para debug rápido

## 5.5 Relatórios e Exportações

- Relatório mensal em PDF (layout similar à planilha para transição suave)
- Exportação Excel com formatação profissional via SheetJS
- Relatório de clientes inativos com último mês de compra
- Comparativo período a período configurável

## 5.6 Gestão de Vendas Avulsas

- Registro manual para vendas sem correspondência no Omie ("VENDAS SEM NOME")
- Workflow de classificação: vendas não atribuídas aparecem em fila de revisão
- Atribuição a vendedor e tipo de cliente com um click

---

# 6. Perfis de Acesso

| Perfil | Permissões | Telas | Usuários |
|--------|-----------|-------|----------|
| **Admin** | Tudo + config Omie + gestão de usuários + RLS bypass | Todas + Config + Sync | Dono/Gestor |
| **Gerente** | Dashboard global, todas as carteiras, transferências, relatórios | Todas exceto Config | Gerente Comercial |
| **Vendedor** | Apenas sua carteira e KPIs próprios (filtrado via RLS) | Dashboard filtrado + Minha Carteira | Thalia, Gabriel, Mateus, Fabia |

A segurança é implementada em duas camadas: Supabase Auth para autenticação e Row Level Security para autorização granular a nível de linha no banco.

---

# 7. Fases de Desenvolvimento

## Fase 1 — MVP (4-5 semanas)

**Objetivo:** Substituir a planilha + primeira integração Omie

- Setup: projeto React/TS + Supabase + Vercel + CI/CD
- Rodar migrations SQL: tabelas, views, indexes, RLS policies
- Supabase Auth com 3 roles via custom claims
- Dashboard principal com KPIs e gráficos (Recharts)
- CRUD de clientes (tipo + status + carteira)
- CRUD de vendedores e atribuição de carteiras
- Registro manual de vendas mensais
- Edge Function: omie-proxy para chamadas à API
- Sync básico: importar clientes e vendedores do Omie
- Script de migração: importar dados históricos da planilha Excel

## Fase 2 — Sync Completo (3-4 semanas)

**Objetivo:** Automatizar dados, eliminar entrada manual

- Sync de Contas a Receber (faturamento automático mensal)
- Webhook listener para atualizações em tempo real
- pg_cron: sync incremental a cada 6 horas
- Reconciliação diária com detecção de divergências
- Painel de Observabilidade: sync_logs, status, re-execução manual
- Detecção automática de clientes inativos com alertas
- Integração CRM: oportunidades e pipeline de vendas

## Fase 3 — Relatórios e Polish (2-3 semanas)

**Objetivo:** Relatórios avançados, UX refinada, adoção total

1. Exportação PDF e Excel com formatação profissional
2. Heatmap de administradoras por mês
3. Drag-and-drop para transferência de carteiras
4. Notificações por email para alertas de vendas e inativação
5. Metas de vendas por vendedor com acompanhamento visual
6. Comparativos avançados período a período

---

# 8. Regras de Negócio

## 8.1 Classificação de Clientes

- Todo cliente em exatamente um tipo: `administradora`, `empresa`, `sindico`, `consumidor_final`
- Tipo é definido por tag no Omie ou manualmente no sistema
- Vendas sem classificação entram em fila de revisão

## 8.2 Inativação Automática

- Cliente INATIVO = 2 meses consecutivos sem faturamento (view `v_clientes_inativos`)
- Alerta automático para vendedor responsável quando cliente entra na view
- Status muda para `inativo` com data e motivo registrados

## 8.3 Carteiras

- Cada cliente pertence a exatamente um vendedor (FK `vendedor_id`)
- Transferência requer motivo e aprovação (grava em `carteira_historico`)
- Vendedor inativo tem carteira redistribuída obrigatoriamente

## 8.4 Cálculos

- Totais mensais = `SUM(valor)` agrupado por ano/mes
- ADM + Síndicos = métrica combinada (69% + 18% = 87% da receita)
- Variação = `(atual - anterior) / anterior * 100`
- Média por administradora = `AVG` via window function no SQL

---

# 9. Migração de Dados

## 9.1 Dados da Planilha

8 meses de histórico (Jun/25 — Jan/26), 40+ administradoras, 8 vendedores, ~R$ 200k/mês.

## 9.2 Processo

- Script TypeScript lê XLSX via SheetJS, normaliza dados (`INATIVOU` → status + data)
- Desduplicar administradoras que aparecem em múltiplas abas
- Inserir em lote via Supabase client (upsert por nome de administradora)
- Validar totais: query `v_resumo_global` deve bater com planilha

## 9.3 Validações Pós-Migração

| Métrica | Valor Esperado |
|---------|---------------|
| Total Jan/26 | R$ 200.292,58 |
| Total Administradoras Jan/26 | R$ 138.924,00 |
| Vendas Gabriel Jan/26 | R$ 76.701,00 |
| Vendas Mateus Jan/26 | R$ 69.437,00 |
| Vendas Thalia Jan/26 | R$ 53.576,00 |

---

# 10. Riscos e Mitigações

| Risco | Impacto | Prob. | Mitigação |
|-------|---------|-------|-----------|
| API Omie fora do ar | Alto | Baixa | Dados no Supabase funcionam offline. Dashboard sempre acessível. |
| Rate limit Omie | Médio | Média | Queue com retry exponencial na Edge Function. Sync incremental reduz volume. |
| Dados divergentes | Alto | Alta | Reconciliação diária compara totais. sync_logs rastreia cada operação. |
| Resistência dos vendedores | Médio | Média | UI simples, manter export Excel, período paralelo com planilha. |
| Supabase free tier insuficiente | Baixo | Baixa | Volume estimado: ~500 vendas/mês, ~50 clientes. Cabe fácil no free tier. |

---

# 11. Métricas de Sucesso

- Planilha Excel eliminada em até 60 dias após launch
- Redução de 80% no tempo de geração de relatórios mensais
- Zero discrepância entre dados Omie e dashboard após sync
- 100% das vendas classificadas (eliminar "VENDAS SEM NOME")
- Detecção automática de inativação em < 24h
- Adoção por 100% dos vendedores em até 30 dias

---

# 12. Próximos Passos

- [ ] Validar PRD com stakeholders e equipe de vendas
- [ ] Obter credenciais API Omie (app_key, app_secret) e testar endpoints
- [ ] Criar projeto Supabase e rodar migrations do schema SQL (Seção 3)
- [ ] Setup projeto React/TS com Vite + Tailwind + shadcn/ui na Vercel
- [ ] Implementar Edge Function omie-proxy e testar chamadas
- [ ] Rodar script de migração da planilha para popular dados históricos
- [ ] Iniciar Fase 1 com Claude Code: scaffold completo + dashboard + CRUD
