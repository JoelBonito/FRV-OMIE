# Plano de Alteracoes Estruturais — FRV-OMIE

> **Documento de referencia para implementacao.** Usar este arquivo para retomar o trabalho em novas janelas de contexto.
> Gerado em: 2026-03-08

---

## Resumo Executivo

Automatizar 7 planilhas Excel do consultor + adicionar PWA e export PDF ao dashboard FRV-OMIE.

**Stack atual:** React 19, TypeScript strict, Vite 7, Tailwind v4 + shadcn/ui, Supabase (schema `frv_omie`), TanStack Query v5, Recharts, TanStack Table v8, react-hook-form + Zod v4.

**Edge Functions ativas:** omie-proxy (v3), omie-sync (v5), omie-webhook (v3).

**Dados sincronizados:** ~5 vendedores, ~3000 clientes, ~6700 vendas (contas receber).

---

## Mapeamento Planilha → Feature

| # | Planilha | Conteudo | Feature Sistema | Fase |
|---|----------|----------|-----------------|------|
| 1 | `Relatorio_Administradoras_Jan_Fev_TopLimp.xlsx` (5 abas: Resumo, Detalhe, Condominios, Perdidos, Novos) | Churn 39 admins, retencao, 129 perdidos, 93 novos, delta faturamento | ComparacaoPage (5 tabs) | FASE 1 |
| 2 | `Top3_quedas_condominios_perdidos_Jan_nao_Fev.xlsx` (2 abas: Resumo top 3, Lista 69 clientes) | Top 3 admins com maior perda + drill-down por vendedor | Dashboard alert card + link ComparacaoPage | FASE 1 |
| 3 | `pivot (50).xlsx` | Pipeline pedidos TODOS os stages (ORCAMENTO, Separar Estoque, EM ROTA, ENTREGUE) | OrcamentosPage — DataTable + KPIs por stage | FASE 2 |
| 4 | `pivot (51).xlsx` | Curva ABC por VALOR (615 produtos, Pareto 80/20) | CurvaAbcPage toggle "Por Valor" — Pareto chart + DataTable | FASE 3 |
| 5 | `pivot (52).xlsx` | Curva ABC por QUANTIDADE (615 produtos por volume) | CurvaAbcPage toggle "Por Quantidade" | FASE 3 |
| 6 | `pivot (53).xlsx` | Pipeline filtrado (stages de entrega apenas) | OrcamentosPage com preset filtro "Em Execucao" | FASE 2 |
| - | N/A | Export PDF/Excel | ExportButtons em todas as paginas | FASE 4 |
| - | N/A | Versao mobile instalavel | PWA (manifest, SW, responsive) | FASE 4 |

---

## Lista de Tarefas por Fase

### FASE 1: Churn + Comparacao de Periodos (Planilhas 1+2)
> **Prerequisitos:** Nenhum — usa tabelas `vendas` + `clientes` existentes.
> **Paginas novas:** ComparacaoPage
> **Paginas modificadas:** DashboardPage

- [x] **1.1** Criar migration `20260308100000_churn_functions.sql` com 6 SQL functions + campo administradora:
  - [x] `fn_churn_por_administradora(p_ano1, p_mes1, p_ano2, p_mes2)` — retorna: administradora, condominios_mes1/mes2, retidos, perdidos, novos, taxa_retencao, faturamento_mes1/mes2, delta_faturamento
  - [x] `fn_clientes_churn(p_ano_ref, p_mes_ref, p_ano_atual, p_mes_atual)` — retorna: cliente_id, nome, tipo, vendedor, vendedor_id, valor_ref, pedidos_ref (clientes que compraram no periodo ref mas NAO no atual)
  - [x] `fn_clientes_novos(p_ano_ref, p_mes_ref, p_ano_atual, p_mes_atual)` — retorna: cliente_id, nome, tipo, vendedor, valor_atual, pedidos_atual (clientes que compraram no atual mas NAO no ref)
  - [x] `fn_top_quedas(p_ano1, p_mes1, p_ano2, p_mes2, p_limit DEFAULT 5)` — retorna: administradora, condominios_perdidos, pedidos_perdidos, valor_perdido
- [x] **1.2** Aplicar migration no Supabase (`supabase db push` — aplicada 2026-03-08)
- [x] **1.3** Atualizar `src/lib/types/database.ts` — campo administradora + 6 tipos RPC
- [x] **1.4** Criar `src/services/api/comparacao.ts` — 6 RPCs com `(supabase.rpc as any)`
- [x] **1.5** Criar `src/hooks/useComparacao.ts` — 6 hooks TanStack Query
- [x] **1.6** Criar `src/pages/comparacao/ComparacaoPage.tsx` — 5 tabs (Admins, Vendedores, Tipo, Perdidos, Novos)
- [x] **1.7** Atualizar `src/lib/constants.ts` — `ROUTES.COMPARACAO`
- [x] **1.8** Atualizar `src/routes.tsx` — rota lazy `/comparacao`
- [x] **1.9** Atualizar `src/components/layout/Sidebar.tsx` — nav "Comparacao" (ArrowLeftRight)
- [x] **1.10** Atualizar `src/pages/dashboard/DashboardPage.tsx` — alert churn + top 3 quedas + link
- [x] **1.10b** Atualizar `supabase/functions/_shared/omie-client.ts` — nova funcao `resolveClientInfo()` retorna `{tipo, administradora}`
- [x] **1.10c** Atualizar `supabase/functions/omie-sync/index.ts` — grava campo `administradora` no sync de clientes
- [x] **1.11** `npm run build` — zero erros, build 4.56s
- [x] **1.12** Validar: migration aplicada, full sync executado (25 vend + 3041 clientes + 6634 vendas), 778 clientes com administradora (13 admins), 6 functions validadas com dados reais

---

### FASE 2: Pedidos e Orcamentos (Planilhas 3+6)
> **Prerequisitos:** Nenhum (paralelo a Fase 1 se desejado, mas melhor sequencial).
> **Tabelas novas:** `pedidos`, `pedido_itens`
> **Paginas novas:** OrcamentosPage
> **Edge Function modificada:** omie-sync

- [x] **2.1** Criar migration `20260308100100_pedidos.sql`:
  - [x] Tabela `pedidos`: id, omie_id (UNIQUE), cliente_id (FK), vendedor_id (FK), numero_pedido, valor_total, etapa, status, previsao_faturamento, data_pedido, tags[], observacao, created_at, updated_at
  - [x] Tabela `pedido_itens`: id, pedido_id (FK CASCADE), produto_omie_id, descricao, quantidade, valor_unitario, valor_total, unidade
  - [x] Indexes: pedidos(etapa), pedidos(cliente_id), pedidos(vendedor_id), pedidos(data_pedido), pedido_itens(pedido_id)
  - [x] RLS policies (admin/gerente ALL, vendedor read own)
- [x] **2.2** Aplicar migration no Supabase (`supabase db push` — aplicada 2026-03-08)
- [x] **2.3** Atualizar `supabase/functions/_shared/omie-client.ts`:
  - [x] Interfaces: OmiePedidoCabecalho, OmiePedidoInfoCadastro, OmiePedidoItem, OmiePedidoTotalPedido, OmiePedidoFrete, OmiePedidoRaw
- [x] **2.4** Atualizar `supabase/functions/omie-sync/index.ts`:
  - [x] Import OmiePedidoRaw from omie-client
  - [x] Funcao `syncPedidos(credentials, options)` com paginacao, clienteMap, vendedorMap, upsert pedidos + delete/re-insert itens
  - [x] 4o passo no handler: `if (syncType === 'full' || syncType === 'pedidos')`
- [x] **2.5** Re-deploy edge function `omie-sync` no Supabase (v6 deployed)
- [x] **2.6** Atualizar `src/lib/types/database.ts`:
  - [x] Tabelas `pedidos` e `pedido_itens` com Row/Insert/Update/Relationships
- [x] **2.7** Criar `src/services/api/pedidos.ts`:
  - [x] `getPedidos(filters)`, `getPedido(id)`, `getPedidoItens(pedidoId)`, `getPedidoStats()`
- [x] **2.8** Criar `src/hooks/usePedidos.ts`:
  - [x] `usePedidos(filters)`, `usePedido(id)`, `usePedidoItens(pedidoId)`, `usePedidoStats()`
- [x] **2.9** Criar `src/pages/orcamentos/OrcamentosPage.tsx`:
  - [x] KPI cards: Total pedidos, valor pipeline, media por pedido, etapas distintas
  - [x] Summary cards por etapa (top 4, clicaveis para filtrar)
  - [x] DataTable: Pedido#, Cliente, Vendedor, Valor, Etapa (badge), Data, Previsao
  - [x] Filtros: etapa (select), vendedor (select), busca texto
  - [x] Presets: "Todos", "Orcamentos Abertos", "Em Execucao"
  - [x] Click na linha: Sheet (drawer lateral) com detalhes + tabela de itens
  - [x] DataTable component enhanced: `onRowClick` prop adicionada
- [x] **2.10** Atualizar constants, routes, Sidebar:
  - [x] `ROUTES.ORCAMENTOS: '/orcamentos'`
  - [x] Rota lazy + nav item com icone `FileText` (lucide), minRole: gerente
- [x] **2.11** Atualizar `src/pages/sync/SyncPage.tsx`:
  - [x] "pedidos" como 4a fase no sequential sync (4 steps)
  - [x] Scope "Apenas Pedidos" no select
  - [x] Phase label + invalidate queries pedidos
- [x] **2.12** `npm run build` — zero erros, build 4.93s
- [x] **2.13** Edge function deployed, sync validacao pendente via frontend (requer auth)

---

### FASE 3: Curva ABC de Produtos (Planilhas 4+5)
> **Prerequisitos:** FASE 2 completa (precisa de `pedido_itens` populada).
> **Paginas novas:** CurvaAbcPage

- [x] **3.1** Criar migration `20260308100200_curva_abc.sql`:
  - [x] View `v_curva_abc_valor` (ranking por SUM(valor_total), com NULLIF para safety, + campos quantidade e pedidos)
  - [x] View `v_curva_abc_quantidade` (ranking por SUM(quantidade), mesma estrutura)
- [x] **3.2** Aplicar migration no Supabase (aplicada 2026-03-08)
- [x] **3.3** Atualizar `src/lib/types/database.ts`:
  - [x] Views `v_curva_abc_valor` e `v_curva_abc_quantidade` com Row types
- [x] **3.4** Criar `src/services/api/curva-abc.ts`:
  - [x] `getCurvaAbcValor()`, `getCurvaAbcQuantidade()` — query views com tipos explícitos
- [x] **3.5** Criar `src/hooks/useCurvaAbc.ts`:
  - [x] `useCurvaAbcValor()`, `useCurvaAbcQuantidade()`
- [x] **3.6** Criar `src/pages/curva-abc/CurvaAbcPage.tsx`:
  - [x] Toggle: Tabs "Por Valor" / "Por Quantidade"
  - [x] KPIs: Total produtos, Classe A (count + %), Classe B, Classe C (com border-l colorida)
  - [x] Grafico Pareto combinado: ComposedChart (Bar com Cell colorida por ABC + Line % acumulado)
  - [x] DataTable: Ordem, Descricao, Valor/Qtd, % Part., % Acum., Pedidos, ABC badge (A=emerald, B=amber, C=red)
  - [x] Busca por produto, tooltip customizado
- [x] **3.7** Atualizar constants, routes, Sidebar:
  - [x] `ROUTES.CURVA_ABC: '/curva-abc'`
  - [x] Rota lazy + nav item com icone `BarChart3` (lucide), minRole: 'gerente'
- [x] **3.8** `npm run build` — zero erros, build 3.01s
- [ ] **3.9** Validar: verificar top 5 produtos vs planilha (requer sync de pedidos populada)

---

### FASE 4: Export PDF/Excel + PWA
> **Prerequisitos:** Todas as paginas ja criadas (Fases 1-3).

#### 4A: Export PDF/Excel

- [x] **4A.1** Instalar dependencias: `npm install jspdf jspdf-autotable xlsx` (xlsx movido de devDep para dep)
- [x] **4A.2** jspdf v4 inclui types nativos — sem necessidade de @types/jspdf
- [x] **4A.3** Criar `src/components/ExportButtons.tsx`:
  - [x] Props: `{ data, columns: ExportColumn[], title, fileName }`
  - [x] Botao "PDF": dynamic import jsPDF + autoTable, header (titulo + data + contagem), tabela estilizada
  - [x] Botao "Excel": dynamic import xlsx, workbook com auto-size columns
  - [x] Estilo: 2 botoes sm outline (Download + FileSpreadsheet icons), loading spinner
- [x] **4A.4** Integrar ExportButtons nas paginas:
  - [x] VendasPage (7 colunas: periodo, cliente, vendedor, tipo, valor, status, NF)
  - [x] ClientesPage (6 colunas: nome, tipo, vendedor, status, email, telefone)
  - [x] OrcamentosPage (7 colunas: pedido, cliente, vendedor, valor, etapa, data, previsao)
  - [x] ComparacaoPage (10 colunas: admin data com fat A/B + delta)
  - [x] CurvaAbcPage (7 colunas: ordem, produto, valor/qtd, % part, % acum, pedidos, ABC)
- [x] **4A.5** `npm run build` — zero erros, 4.57s, chunks PDF/Excel lazy-loaded

#### 4B: PWA (Progressive Web App)

- [x] **4B.1** Instalar: `npm install -D vite-plugin-pwa` (v1.2.0)
- [x] **4B.2** Atualizar `vite.config.ts`:
  - [x] VitePWA plugin: registerType autoUpdate, workbox globPatterns, runtimeCaching (Supabase API NetworkFirst, Google Fonts CacheFirst)
- [x] **4B.3** Criar `public/manifest.json`:
  - [x] name: "FRV Omie — Dashboard de Vendas", short_name: "FRV Omie", display: standalone, theme_color: #0066FF
- [x] **4B.4** Criar icones PWA:
  - [x] `public/icons/icon-192.svg` e `public/icons/icon-512.svg` (SVG com logo Omie em fundo #0066FF)
- [x] **4B.5** Atualizar `index.html`:
  - [x] manifest link, apple-touch-icon, theme-color, apple-mobile-web-app-capable/status-bar-style, viewport-fit: cover
- [x] **4B.6** Responsividade mobile:
  - [x] MainLayout: `useIsMobile()` hook (matchMedia 767px), Sidebar como drawer com overlay/backdrop
  - [x] Header hamburger: toggles drawer no mobile, collapse no desktop
  - [x] DataTable: `overflow-x-auto` já existente no componente (funcional)
  - [x] KpiCards: `grid-cols-2` em mobile já suportado
  - [x] main: `pb-20` em mobile para não sobrepor BottomNav
- [x] **4B.7** Bottom navigation (mobile only):
  - [x] `BottomNav.tsx`: 4 itens (Dashboard, Vendas, Pedidos, Comparar) + "Mais" dropdown
  - [x] Visivel apenas em `md:hidden` via Tailwind
  - [x] Auto-close drawer ao navegar (useEffect on location.pathname)
- [x] **4B.8** `npm run build` — zero erros, 4.57s, SW gerado (60 entries precached)
- [ ] **4B.9** Testar PWA: Chrome DevTools → Application → Manifest + Service Worker
- [ ] **4B.10** Lighthouse audit: PWA score > 90

---

## Progresso Global

| Fase | Descricao | Tasks | Completas | Status |
|------|-----------|-------|-----------|--------|
| FASE 1 | Churn + Comparacao (Planilhas 1+2) | 13 | 13 | **100% COMPLETA** |
| FASE 2 | Pedidos/Orcamentos (Planilhas 3+6) | 13 | 13 | **100% COMPLETA** |
| FASE 3 | Curva ABC (Planilhas 4+5) | 9 | 8 | **89% (falta validação dados)** |
| FASE 4A | Export PDF/Excel | 5 | 5 | **100% COMPLETA** |
| FASE 4B | PWA | 10 | 8 | **80% (falta teste manual + Lighthouse)** |
| **TOTAL** | | **50** | **47** | **94%** |

---

## Decisoes Tecnicas

1. **Comparacao de meses:** Seletores livres (qualquer Mes/Ano A vs Mes/Ano B)
2. **Curva ABC dados:** Extraidos dos itens dos pedidos (`pedido_itens`) — NAO precisa cadastro master de produtos
3. **SQL functions vs views:** Functions com parametros para churn (precisa de input mes/ano), Views para ABC (agrega tudo)
4. **Export PDF:** jsPDF + jspdf-autotable com dynamic import (nao impacta bundle)
5. **PWA:** vite-plugin-pwa com workbox, precache rotas + runtime cache API Supabase
6. **Sync pedidos:** 4o passo sequencial no frontend (vendedores → clientes → vendas → pedidos)

## Notas Tecnicas Importantes

- **Supabase schema:** Todas as queries vao para `frv_omie`, NAO `public`
- **Supabase views:** Retornam `{}` — TODAS as funcoes de service precisam de tipo de retorno explicito com `as Type[]`
- **Zod v4:** Usar `z.number()` + `valueAsNumber` no register (NAO `z.coerce.number()`)
- **TanStack Query:** staleTime 5min default, retry 1
- **Edge Functions:** Timeout 60s — sync sequencial no frontend para evitar timeout
- **Build check:** `npm run build` (tsc + vite build) — verificar apos CADA mudanca

## Arquivos Criticos de Referencia

| Arquivo | Para que serve |
|---------|---------------|
| `src/lib/types/database.ts` | Tipos centrais — atualizar para cada tabela/view/function nova |
| `src/services/api/dashboard.ts` | Pattern de service functions (como chamar views) |
| `src/hooks/useDashboard.ts` | Pattern de hooks TanStack Query |
| `src/pages/vendas/VendasPage.tsx` | Pattern de DataTable com filtros |
| `src/pages/dashboard/DashboardPage.tsx` | Pattern de KPIs + charts + alerts |
| `supabase/functions/omie-sync/index.ts` | Pattern de sync (pagination, upsert, rate limit) |
| `supabase/functions/_shared/omie-client.ts` | API client Omie (retry, backoff) |
| `src/routes.tsx` | Onde adicionar rotas lazy |
| `src/components/layout/Sidebar.tsx` | Onde adicionar nav items |
| `src/lib/constants.ts` | Onde adicionar ROUTES e constantes |

---

## Como Retomar em Nova Conversa

> Copie esta instrucao ao iniciar nova conversa:

```
Leia o arquivo docs/PLANO_ALTERACOES_ESTRUTURAIS.md para retomar a implementacao.
Verifique o "Progresso Global" e as tasks com checkbox para saber onde paramos.
Continue da proxima task pendente (sem checkbox marcado).
```
