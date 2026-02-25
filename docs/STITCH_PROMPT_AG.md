# Prompt para Antigravity — Gerar Telas no Stitch MCP

> **Instruções completas e auto-suficientes.** Execute do início ao fim sem parar.

---

## CONTEXTO DO PROJETO

**Produto:** FRV Omie — Dashboard de Vendas
**Descrição:** Sistema web corporativo que substitui uma planilha Excel de controle de vendas (~R$200k/mês). Gestão de clientes (40+ administradoras), 4 vendedores, faturamento mensal por tipo (Administradoras 69%, Síndicos 18%, Empresas 13%, Consumidor Final 0.2%).
**Público-alvo:** Gestor comercial e vendedores de uma empresa B2B.
**Tom:** Profissional, limpo, data-driven. Nada lúdico.
**Stack visual:** Tailwind CSS v4 + shadcn/ui + Recharts + TanStack Table.

---

## DESIGN TOKENS (do index.css do projeto — OBRIGATÓRIO usar estes valores)

| Token | Valor | Uso |
|-------|-------|-----|
| **Primary** | Deep blue `#1e40af` (oklch 0.451 0.189 256.13) | Botões, links, sidebar ativa, ring |
| **Background** | White `#ffffff` | Fundo geral |
| **Foreground** | Near-black `#171717` (oklch 0.145) | Texto principal |
| **Card** | White `#ffffff` | Fundo de cards |
| **Muted** | Light gray `#f5f5f5` (oklch 0.97) | Fundo secundário |
| **Muted foreground** | Medium gray (oklch 0.556) | Texto secundário, labels |
| **Destructive** | Red `#dc2626` | Erros, exclusão |
| **Success** | Green `#16a34a` | Positivo, crescimento |
| **Warning** | Yellow `#eab308` | Alertas |
| **Border** | Light gray (oklch 0.922) | Bordas |
| **Chart 1** | Orange `#ea580c` | Gráfico cor 1 |
| **Chart 2** | Teal `#0d9488` | Gráfico cor 2 |
| **Chart 3** | Slate `#475569` | Gráfico cor 3 |
| **Chart 4** | Amber `#facc15` | Gráfico cor 4 |
| **Chart 5** | Yellow `#eab308` | Gráfico cor 5 |
| **Border radius** | 10px (0.625rem) | Cantos arredondados padrão |
| **Font** | system-ui, -apple-system, sans-serif | Tipografia |

---

## NAVEGAÇÃO DO SISTEMA (Sidebar existente)

```
Sidebar (fixa à esquerda, 256px expandida / 64px colapsada):
├── Logo "FRV Omie" (header 64px)
├── Dashboard (LayoutDashboard icon) — rota "/"
├── Clientes (Users icon) — rota "/clientes"
├── Vendedores (UserCheck icon) — somente gerente/admin
├── Vendas (ShoppingCart icon) — rota "/vendas"
├── Carteiras (Briefcase icon) — rota "/carteiras"
├── Sync Omie (RefreshCw icon) — somente admin
└── Configurações (Settings icon) — somente admin

Header (topo, à direita da sidebar):
├── Email do usuário
├── Badge com role (admin/gerente/vendedor)
└── Botão Logout
```

---

## INSTRUÇÕES DE EXECUÇÃO

### Passo 1: Criar o projeto Stitch

Chame `mcp__stitch__create_project` com:
- **title:** `FRV Omie - Dashboard de Vendas`

Guarde o `projectId` retornado. Use-o em TODAS as telas.

### Passo 2: Gerar as 9 telas abaixo, na ordem

Para cada tela, use `mcp__stitch__generate_screen_from_text` com:
- **projectId:** o ID do passo 1
- **deviceType:** `DESKTOP` (TODAS as telas são DESKTOP)
- **modelId:** conforme indicado em cada tela abaixo

**IMPORTANTE:** Não pare entre telas. Gere todas em sequência. Se uma falhar por timeout, NÃO regenere — use `mcp__stitch__get_screen` depois para verificar.

### Passo 3: Após gerar todas, liste as telas

Chame `mcp__stitch__list_screens` com o projectId para obter todos os IDs.

### Passo 4: Documente os resultados

Ao final, liste todas as telas com seus IDs neste formato:
```
| # | Tela | Screen ID | Model | Status |
|---|------|-----------|-------|--------|
```

---

## TELA 1: Dashboard Principal
**modelId:** `GEMINI_3_PRO`

**Prompt:**
```
Sales management dashboard for "FRV Omie", a B2B corporate tool targeting commercial managers and sales reps who track ~R$200k/month across 40+ client accounts and 4 salespeople. Clean professional style with 10px border radius (rounded-lg). Color palette: white (#ffffff) background, deep blue (#1e40af) for primary actions and sidebar active state, near-black (#171717) for headings, medium gray for secondary text, light gray (#f5f5f5) for card backgrounds and muted areas. Chart colors: orange (#ea580c), teal (#0d9488), slate (#475569), amber (#facc15), yellow (#eab308).

Layout: Fixed 256px left sidebar with dark-on-white navigation (logo "FRV Omie" at top, nav items: Dashboard active with blue highlight, Clientes, Vendedores, Vendas, Carteiras, Sync Omie, Configurações — each with a small icon). Top header bar with user email, role badge "admin", and logout button on the right.

Main content area:
1. TOP ROW: Period filter bar (month/year dropdowns + "Filtrar" blue button) aligned right.
2. KPI ROW: 4 stat cards in a horizontal row, each with: icon, label, big number, and small percentage badge (green up or red down).
   - Card 1: "Faturamento Total" = "R$ 200.292" with green "+12.5%" badge
   - Card 2: "Administradoras" = "R$ 138.924" with green "+8.2%" badge
   - Card 3: "Clientes Ativos" = "42" with red "-3" badge
   - Card 4: "Vendas no Mês" = "87" with green "+15%" badge
3. CHART ROW (2 columns):
   - Left (60%): Line chart "Evolução Mensal" showing 8 months (Jun-Jan) with 2 lines (Faturamento Total in blue, Administradoras in teal). X-axis: month names. Y-axis: R$ values. Clean grid lines.
   - Right (40%): Donut/pie chart "Distribuição por Tipo" with 4 segments: Administradoras 69% (blue), Síndicos 18% (teal), Empresas 13% (orange), Consumidor Final 0.2% (amber). Legend below the chart.
4. BOTTOM ROW (2 columns):
   - Left (60%): Stacked bar chart "Vendas por Tipo (Mensal)" — 8 months, each bar stacked with 4 colors for the 4 client types. Horizontal bars or vertical bars.
   - Right (40%): Ranking table "Top Vendedores" with columns: Position (#), Nome, Total (R$), Meta (%). Rows: 1. Thalia R$82.450 (110%), 2. Gabriel R$55.320 (92%), 3. Mateus R$38.200 (76%), 4. Fabia R$24.322 (61%). Each row has a small progress bar for meta percentage.
5. ALERT BANNER at bottom: Yellow warning stripe "⚠ 5 clientes sem compras há 60+ dias" with "Ver detalhes" link.

Typography: system-ui sans-serif. Headings bold, data in tabular/monospace-style numbers. All monetary values formatted as Brazilian Real (R$ X.XXX,XX).

Mood: professional, data-rich, corporate. Like a Bloomberg terminal meets modern SaaS dashboard.
No purple, no glassmorphism, no gradient backgrounds, no decorative illustrations.
```

---

## TELA 2: Login Page
**modelId:** `GEMINI_3_PRO`

**Prompt:**
```
Login screen for "FRV Omie", a B2B sales management tool for commercial teams. Clean professional style with 10px border radius. Color: light gray (#f5f5f5) full-page background, white card centered, deep blue (#1e40af) for the sign-in button, near-black (#171717) for text.

Layout: Vertically and horizontally centered card (max-width 420px) on a light gray background. Card contents from top to bottom:
1. App name "FRV Omie" in bold 24px, centered
2. Subtitle "Faça login para acessar o sistema" in gray, centered
3. Separator line
4. Email field with label "Email" and placeholder "seu@email.com"
5. Password field with label "Senha" and placeholder "••••••"
6. Full-width deep blue button "Entrar" with white text
7. Optional "Esqueci minha senha" link in blue below the button

No sidebar, no header — this is a standalone full-page login. Inputs have light gray borders with 10px radius. Focus state shows blue ring. Clean, minimal, corporate.

Typography: system-ui sans-serif.
Mood: trustworthy, secure, simple. A corporate internal tool login — not a consumer app.
No purple, no glassmorphism, no split-screen layout, no decorative illustrations or stock photos.
```

---

## TELA 3: Lista de Clientes
**modelId:** `GEMINI_3_FLASH`

**Prompt:**
```
Client list page for "FRV Omie" sales management dashboard. Clean professional style with 10px border radius. Color: white background, deep blue (#1e40af) primary, near-black text, light gray borders. Chart/badge colors: orange (#ea580c), teal (#0d9488).

Layout: Same sidebar (256px, "FRV Omie" logo, nav items with "Clientes" highlighted in blue) and header (user email, role badge, logout) as the main dashboard.

Main content:
1. PAGE HEADER: "Clientes" title (24px bold) on the left. "Novo Cliente" blue button with plus icon on the right.
2. FILTER BAR: Horizontal row with:
   - Search input (magnifying glass icon, placeholder "Buscar por nome, CNPJ...")
   - Dropdown "Tipo" (Administradora, Empresa, Síndico, Consumidor Final, Todos)
   - Dropdown "Status" (Ativo, Inativo, Todos)
   - Dropdown "Vendedor" (Thalia, Gabriel, Mateus, Fabia, Todos)
3. DATA TABLE: Full-width table with columns:
   - Nome (sortable, bold text)
   - Tipo (colored badge: blue for Administradora, teal for Síndico, orange for Empresa, gray for Consumidor Final)
   - Vendedor (text)
   - Status (green "Ativo" or red "Inativo" badge)
   - Último Valor (R$ formatted)
   - Ações (3-dot menu icon)

   Show 8-10 rows of realistic Brazilian company names like "ADM Predial Souza", "Cond. Solar das Palmeiras", "TechBuild Engenharia", etc.

   Table features: alternating row backgrounds (white/light gray), hover highlight, sort arrows on column headers.
4. PAGINATION: Bottom right — "Mostrando 1-10 de 42" with Previous/Next buttons and page numbers.

Typography: system-ui sans-serif. Table uses tabular numbers for monetary values.
Mood: organized, efficient, data-focused.
No purple, no glassmorphism, no decorative elements.
```

---

## TELA 4: Form Cliente (Create/Edit)
**modelId:** `GEMINI_3_FLASH`

**Prompt:**
```
Client create/edit form for "FRV Omie" sales management dashboard. Clean professional style with 10px border radius. Color: white background, deep blue (#1e40af) primary, near-black text, light gray borders. Red (#dc2626) for required field errors.

Layout: Same sidebar (256px, "Clientes" highlighted) and header as other pages.

Main content:
1. PAGE HEADER: "Novo Cliente" title (24px bold), with breadcrumb "Clientes > Novo Cliente" above in gray. "Voltar" text link on the right.
2. FORM CARD: White card with subtle border, max-width 720px.
   - Section "Dados Gerais":
     - Nome* (full-width text input, required)
     - Tipo* (select dropdown: Administradora, Empresa, Síndico, Consumidor Final)
     - CNPJ (text input with mask hint)
     - Vendedor Responsável* (select dropdown: Thalia, Gabriel, Mateus, Fabia)
   - Section "Contato":
     - Email (text input)
     - Telefone (text input)
   - Section "Observações":
     - Notas (textarea, 3 rows, placeholder "Informações adicionais sobre o cliente...")
   - ACTIONS ROW: "Cancelar" gray outlined button on left. "Salvar Cliente" blue filled button on right.

Show one field with a validation error state: "Nome" field with red border and "Nome é obrigatório" error message below it in red.

Inputs: light gray border, 10px radius, blue ring on focus. Labels above inputs in medium weight.
Typography: system-ui sans-serif.
Mood: clean, functional form. Easy to fill out quickly.
No purple, no glassmorphism, no unnecessary decoration.
```

---

## TELA 5: Detalhe do Cliente
**modelId:** `GEMINI_3_FLASH`

**Prompt:**
```
Client detail page for "FRV Omie" sales management dashboard. Clean professional style with 10px border radius. Color: white background, deep blue (#1e40af) primary, near-black text, teal (#0d9488) and orange (#ea580c) for charts.

Layout: Same sidebar (256px, "Clientes" highlighted) and header.

Main content:
1. PAGE HEADER: Client name "ADM Predial Souza" (24px bold), with breadcrumb "Clientes > ADM Predial Souza" in gray. Right side: "Editar" blue outlined button, "Excluir" red text button.
2. INFO CARD (top): White card with 2-column grid showing:
   - Tipo: "Administradora" (blue badge)
   - Status: "Ativo" (green badge)
   - Vendedor: "Thalia"
   - CNPJ: "12.345.678/0001-90"
   - Email: "contato@admpredial.com"
   - Telefone: "(11) 98765-4321"
   - Notas: "Cliente desde Jun/2025. Pagamento regular."
3. TABS below the info card: "Histórico de Vendas" (active) | "Transferências"
4. TAB CONTENT — Histórico de Vendas:
   - Small line chart showing this client's monthly values over 8 months (Jun-Jan), single teal line.
   - Below: table with columns: Mês/Ano, Valor (R$), Status (green "Faturado" badge), NF. Show 6 rows of data: Jan/26 R$3.850, Dez/25 R$3.200, Nov/25 R$3.850, etc.
   - Total row at bottom: "Média: R$3.540 | Total: R$25.200"

Typography: system-ui sans-serif. Tabular numbers for values.
Mood: informative detail view, clean data presentation.
No purple, no glassmorphism.
```

---

## TELA 6: Lista e Form de Vendedores
**modelId:** `GEMINI_3_FLASH`

**Prompt:**
```
Salespeople management page for "FRV Omie" sales dashboard. Clean professional style with 10px border radius. Color: white background, deep blue (#1e40af) primary, near-black text, green (#16a34a) for positive metrics.

Layout: Same sidebar (256px, "Vendedores" highlighted) and header.

Main content split into two areas:

LEFT SIDE (60%) — Vendedores List:
1. "Vendedores" title (24px bold). "Novo Vendedor" blue button top-right.
2. Cards layout (2-column grid of cards, not a table). Each card shows:
   - Avatar circle with initials (TH, GA, MA, FA) in blue background
   - Name bold (Thalia, Gabriel, Mateus, Fabia)
   - Email in gray below name
   - Status badge (green "Ativo")
   - "Meta mensal: R$ 75.000" in small gray text
   - "Clientes: 15" small text
   - 3-dot actions menu icon in top-right corner

RIGHT SIDE (40%) — Quick Stats Panel (or shown when a card is selected):
1. Selected vendedor: "Thalia" header
2. Performance card:
   - "Faturamento Mês: R$ 82.450" (green badge "+10.2%")
   - "Meta: 110%" with a progress bar (green, filled beyond 100%)
   - "Clientes Ativos: 15"
   - "Ticket Médio: R$ 5.497"
3. Mini bar chart: Last 6 months performance (small bars, blue color)

Typography: system-ui sans-serif.
Mood: team management overview, clean and scannable.
No purple, no glassmorphism.
```

---

## TELA 7: Registro de Vendas + Fila Sem Nome
**modelId:** `GEMINI_3_FLASH`

**Prompt:**
```
Sales registry page for "FRV Omie" dashboard. Clean professional style with 10px border radius. Color: white background, deep blue (#1e40af) primary, near-black text, yellow (#eab308) for warnings, orange (#ea580c) for attention items.

Layout: Same sidebar (256px, "Vendas" highlighted) and header.

Main content:
1. PAGE HEADER: "Vendas" title (24px bold). Right side: "Registrar Venda" blue button, "Exportar" gray outlined button.
2. FILTER BAR: Month/Year selectors, Vendedor dropdown, Tipo dropdown, Status dropdown, Search input.
3. MAIN TABLE: Full-width data table with columns:
   - Data (DD/MM/YYYY, sortable)
   - Cliente (bold name)
   - Vendedor (text)
   - Tipo (colored badge)
   - Valor (R$ formatted, right-aligned, tabular numbers)
   - Status (green "Faturado", yellow "Pendente", or red "Cancelado" badge)
   - NF (nota fiscal number or "—")
   - Ações (3-dot menu)

   Show 8 rows of realistic data. One or two rows should have "Pendente" yellow status.

4. ALERT SECTION below the table — "Vendas Sem Classificação" panel:
   - Orange left-border card with warning icon
   - Title: "⚠ 3 vendas aguardando classificação"
   - Description: "Vendas importadas do Omie sem cliente associado"
   - Small table inside: Data, Valor, Pedido Omie, "Classificar" blue text link for each
   - Show 3 rows: "15/01/2026 R$245,00 #8834 Classificar", etc.

5. PAGINATION at bottom.

Typography: system-ui sans-serif. Tabular numbers.
Mood: operational, transactional, clear status indicators.
No purple, no glassmorphism.
```

---

## TELA 8: Carteiras — Tabela Pivot por Vendedor
**modelId:** `GEMINI_3_FLASH`

**Prompt:**
```
Portfolio pivot table page for "FRV Omie" sales dashboard. Clean professional style with 10px border radius. Color: white background, deep blue (#1e40af) primary, near-black text, green (#16a34a) for positive values, red (#dc2626) for negative changes, light gray (#f5f5f5) for alternating rows.

Layout: Same sidebar (256px, "Carteiras" highlighted) and header.

Main content:
1. PAGE HEADER: "Carteiras" title (24px bold). "Transferir Cliente" blue outlined button on right.
2. VENDEDOR TABS: Horizontal tab bar with tabs: "Thalia" (active), "Gabriel", "Mateus", "Fabia", "Visão Geral".
3. VENDEDOR SUMMARY (below tabs): Card with 3 inline stats:
   - "Total Clientes: 15" | "Faturamento Mês: R$ 82.450" | "Média/Cliente: R$ 5.497"

4. PIVOT TABLE: This is the key element — a wide table showing each client (administradora) vs monthly values.
   - COLUMNS: Cliente (frozen first column, bold), Jun/25, Jul/25, Ago/25, Set/25, Out/25, Nov/25, Dez/25, Jan/26, Média
   - ROWS: 12-15 administradora names (e.g., "ADM Predial Souza", "Nova Lar ADM", "Cond. Solar das Palmeiras", etc.)
   - CELL VALUES: R$ amounts (e.g., "3.850", "4.200", "—" for no sale). Green text for values above average, red for below.
   - One row should show "INATIVOU" in red spanning the last 3 months (to represent an inactive client).
   - TOTAL ROW at bottom: Bold row with monthly totals.
   - AVERAGE COLUMN: Last column with each client's average.

5. FOOTER NOTE: Small gray text "Valores em R$. Células vazias (—) indicam meses sem faturamento."

The table should have horizontal scroll if needed, with the first column (Cliente) sticky/frozen. Alternating row backgrounds.

Typography: system-ui sans-serif. Strict tabular/monospace numbers in cells.
Mood: spreadsheet-like, analytical, dense data. This replaces an Excel sheet so it should feel like a power-user tool.
No purple, no glassmorphism, no rounded blob shapes.
```

---

## TELA 9: Modal Transferência de Carteira
**modelId:** `GEMINI_3_FLASH`

**Prompt:**
```
Portfolio transfer modal dialog for "FRV Omie" sales dashboard. Clean professional style with 10px border radius. Color: white modal card on semi-transparent dark overlay, deep blue (#1e40af) primary, near-black text, yellow (#eab308) for warning notice.

Layout: The background shows the Carteiras page (dimmed/blurred). On top, a centered modal dialog (max-width 520px).

Modal content:
1. HEADER: "Transferir Cliente" title (18px bold). X close button on the right.
2. FORM FIELDS:
   - "Cliente" — select dropdown showing "ADM Predial Souza" selected, with search capability hint
   - "Vendedor Atual" — read-only field showing "Thalia" with gray background (disabled)
   - "Novo Vendedor" — select dropdown with options (Gabriel, Mateus, Fabia)
   - "Motivo" — textarea (2 rows), placeholder "Descreva o motivo da transferência..."
3. WARNING BOX: Yellow-bordered card with warning icon:
   - "Esta ação transfere o histórico completo do cliente para o novo vendedor. A transferência será registrada no log de auditoria."
4. ACTION BUTTONS at bottom:
   - "Cancelar" gray outlined button on left
   - "Confirmar Transferência" blue filled button on right

The modal has a subtle drop shadow. The background behind the overlay should show a hint of the Carteiras pivot table (blurred).

Typography: system-ui sans-serif.
Mood: careful, confirmatory — this is an important action that affects data ownership.
No purple, no glassmorphism.
```

---

## APÓS GERAR TODAS AS TELAS

1. Chame `mcp__stitch__list_screens` para obter o inventário completo
2. Para cada tela, chame `mcp__stitch__get_screen` para verificar o status e obter URLs/previews
3. Documente todos os resultados numa tabela:

```
## Resultado da Geração

| # | Tela | Screen ID | Model | Device | Status |
|---|------|-----------|-------|--------|--------|
| 1 | Dashboard Principal | {id} | PRO | DESKTOP | ✅/❌ |
| 2 | Login | {id} | PRO | DESKTOP | ✅/❌ |
| 3 | Lista Clientes | {id} | FLASH | DESKTOP | ✅/❌ |
| 4 | Form Cliente | {id} | FLASH | DESKTOP | ✅/❌ |
| 5 | Detalhe Cliente | {id} | FLASH | DESKTOP | ✅/❌ |
| 6 | Vendedores | {id} | FLASH | DESKTOP | ✅/❌ |
| 7 | Registro Vendas | {id} | FLASH | DESKTOP | ✅/❌ |
| 8 | Carteiras Pivot | {id} | FLASH | DESKTOP | ✅/❌ |
| 9 | Modal Transferência | {id} | FLASH | DESKTOP | ✅/❌ |

**Stitch Project ID:** {project_id}
**Stitch Project Name:** FRV Omie - Dashboard de Vendas
```

4. Se alguma tela falhou, indique qual e o erro.

---

## REGRAS IMPORTANTES

- **TODAS as telas são DESKTOP** (deviceType: `DESKTOP`)
- **Dashboard e Login usam GEMINI_3_PRO** (qualidade máxima)
- **Demais telas usam GEMINI_3_FLASH** (mais rápido)
- **NÃO pare para perguntar** — gere todas as 9 telas em sequência
- **NÃO regenere em caso de timeout** — verifique com `get_screen` depois
- **Use os design tokens exatos** descritos acima (cores, radius, fonts)
- **Dados realistas brasileiros** — nomes de empresas BR, valores em R$, formatação PT-BR
