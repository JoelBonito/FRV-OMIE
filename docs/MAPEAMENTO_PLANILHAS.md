# Mapeamento Planilhas Excel → Sistema FRV-OMIE

> Guia de correspondencia entre cada aba das planilhas originais e onde encontrar os mesmos dados no frontend do sistema.

---

## 1. Relatorio_Administradoras_Jan_Fev_TopLimp.xlsx

### Aba "Resumo_Administradoras"

**O que mostra:** Tabela com 39 administradoras comparando dois meses — condominios, retidos, perdidos, novos, taxa de retencao, faturamento, pedidos e deltas.

**No sistema:** Pagina **Comparacao de Periodos** → Tab **Administradoras**

- Acesse pelo menu lateral: **Comparacao**
- Selecione Periodo A (ex: Jan/2026) e Periodo B (ex: Fev/2026) nos seletores do topo
- A tabela exibe todas as colunas da planilha: Condominios A/B, Retidos, Perdidos, Novos, Retencao %, Fat. A/B, Delta Fat., % Fat., Delta Pedidos, Delta Condominios
- Botao **Export** (PDF/Excel) acima da tabela exporta todos os dados incluindo os 3 campos delta

| Coluna da planilha | Coluna no sistema |
|---|---|
| Administradora | Administradora |
| Condominios_Jan / _Fev | Condominios {Periodo A} / {Periodo B} |
| Retidos_(Jan∩Fev) | Retidos |
| Perdidos_(Jan-Fev) | Perdidos |
| Novos_(Fev-Jan) | Novos |
| Taxa_Retencao | Retencao |
| faturamento_Jan / _Fev | Fat. {A} / Fat. {B} |
| Delta_faturamento | Delta Fat. |
| %_faturamento | % Fat. |
| Delta_pedidos | Delta Ped. |
| Delta_condominios | Delta Cond. |

---

### Aba "Admin_Mes_Detalhe"

**O que mostra:** Tabela intermediaria com faturamento, pedidos e condominios por administradora por mes (um registro por admin/mes).

**No sistema:** Os mesmos dados sao derivados da tab **Administradoras** na pagina Comparacao. Cada linha ja mostra os valores de ambos os meses lado a lado. Para ver um mes isolado, basta definir Periodo A = Periodo B no seletor.

---

### Aba "Condominios_por_Admin"

**O que mostra:** Lista de **todos** os clientes (315 registros) com faturamento e pedidos dos dois meses, delta de faturamento e status (Retido / Perdido em Fev / Novo em Fev).

**No sistema:** Pagina **Comparacao de Periodos** → Tab **Condominios**

- Tabela completa com todos os clientes de ambos os periodos
- Colunas: Administradora, Cliente, Fat. A, Fat. B, Ped. A, Ped. B, Delta, Status
- Status exibido como badge colorido: verde (Retido), vermelho (Perdido), azul (Novo)
- Resumo no topo: X clientes total, Y retidos, Z perdidos, W novos

| Coluna da planilha | Coluna no sistema |
|---|---|
| Administradora | Administradora |
| Cliente (Razao Social) | Cliente |
| faturamento_Jan / _Fev | Fat. {A} / Fat. {B} |
| pedidos_Jan / _Fev | Ped. {A} / Ped. {B} |
| Delta_faturamento | Delta |
| Status | Status (badge) |

---

### Aba "Perdidos_Jan_nao_Fev"

**O que mostra:** Lista de 129 clientes que compraram no mes A mas nao compraram no mes B, com administradora, pedidos e faturamento do periodo de referencia.

**No sistema:** Pagina **Comparacao de Periodos** → Tab **Perdidos**

- Tabela com todos os clientes perdidos
- Informacao adicional que a planilha nao tem: Tipo de cliente, Vendedor responsavel e Ultima Emissao (data do ultimo pedido)
- Resumo no topo: quantidade de perdidos e impacto total em R$

| Coluna da planilha | Coluna no sistema |
|---|---|
| Administradora | Administradora |
| Cliente (Razao Social) | Cliente |
| pedidos_Jan | Pedidos {A} |
| faturamento_Jan | Valor {A} |
| — | Tipo (extra) |
| — | Vendedor (extra) |
| — | Ultima Emissao (extra) |

---

### Aba "Novos_em_Fev"

**O que mostra:** Lista de 93 clientes novos que compraram no mes B mas nao no mes A, com administradora, pedidos e faturamento.

**No sistema:** Pagina **Comparacao de Periodos** → Tab **Novos**

- Tabela com todos os clientes novos
- Informacao adicional: Tipo de cliente e Vendedor responsavel
- Resumo no topo: quantidade de novos e valor total

| Coluna da planilha | Coluna no sistema |
|---|---|
| Administradora | Administradora |
| Cliente (Razao Social) | Cliente |
| pedidos_Fev | Pedidos {B} |
| faturamento_Fev | Valor {B} |
| — | Tipo (extra) |
| — | Vendedor (extra) |

---

## 2. Top3_quedas_condominios_perdidos_Jan_nao_Fev.xlsx

### Aba "Resumo"

**O que mostra:** Top 3 administradoras com maior queda — condominios perdidos, pedidos perdidos e valor perdido.

**No sistema:** Pagina **Dashboard** → Card de alerta **Top Quedas** (parte inferior)

- O Dashboard exibe automaticamente as top 5 administradoras com maiores quedas (configuravel)
- Dados tambem disponiveis na pagina **Comparacao** → Tab **Administradoras** (ordenar por coluna "Perdidos")

| Coluna da planilha | Coluna no sistema |
|---|---|
| Administradora | Administradora |
| condominios_perdidos | Condominios perdidos |
| pedidos_perdidos | Pedidos perdidos |
| valor_perdido_jan | Valor perdido |

---

### Aba "Lista_perdidos"

**O que mostra:** Lista detalhada dos 69 clientes perdidos das top 3 administradoras, com vendedor, pedidos, valor e ultima emissao.

**No sistema:** Pagina **Comparacao de Periodos** → Tab **Perdidos**

- A mesma tab de Perdidos ja descrita acima mostra todos os clientes perdidos (nao apenas top 3)
- Para filtrar apenas as top 3 admins, use a tab **Condominios** e ordene por administradora
- Coluna "Ultima Emissao" incluida na tab Perdidos

| Coluna da planilha | Coluna no sistema |
|---|---|
| Administradora | Administradora |
| Cliente (Razao Social) | Cliente |
| Vendedor | Vendedor |
| pedidos_jan | Pedidos {A} |
| valor_jan | Valor {A} |
| ultima_emissao | Ultima Emissao |

---

## 3. pivot (51).xlsx — Curva ABC por Valor

**O que mostra:** Classificacao ABC de 613 produtos ordenados por valor faturado, com percentual de participacao e acumulado.

**No sistema:** Pagina **Curva ABC** → Tab **Por Valor**

- Acesse pelo menu lateral: **Curva ABC**
- Grafico Pareto (barras + linha acumulada) com os top 30 produtos
- Tabela completa com busca por produto
- KPIs: Total de produtos, Classe A (80%), Classe B (15%), Classe C (5%)
- Botao Export (PDF/Excel) com todos os dados

| Coluna da planilha | Coluna no sistema |
|---|---|
| ABC | ABC (badge A/B/C) |
| Ordem | # |
| Descricao (completa) | Produto |
| Valor Faturado | Faturado |
| % Participacao | % Part. |
| Valor Acumulado | (no grafico: eixo direito) |
| % Acumulado | % Acum. |

---

## 4. pivot (52).xlsx — Curva ABC por Quantidade

**O que mostra:** Classificacao ABC de 613 produtos ordenados por quantidade vendida.

**No sistema:** Pagina **Curva ABC** → Tab **Por Quantidade**

- Mesma pagina, basta clicar na tab "Por Quantidade"
- Grafico Pareto e tabela se atualizam automaticamente
- Export disponivel para esta view tambem

| Coluna da planilha | Coluna no sistema |
|---|---|
| ABC | ABC (badge A/B/C) |
| Ordem | # |
| Descricao (completa) | Produto |
| Quantidade Faturada | Qtd |
| % Participacao | % Part. |
| Quantidade Acumulada | (no grafico: eixo direito) |
| % Acumulado | % Acum. |

---

## 5. pivot (50).xlsx — Pedidos por Previsao de Faturamento (todos)

**O que mostra:** Lista de 58 pedidos agrupados por data de previsao de faturamento, com cliente, numero do pedido, vendedor, etapa, tags e valor.

**No sistema:** Pagina **Pedidos & Orcamentos** → Botao **Todos**

- Acesse pelo menu lateral: **Orcamentos**
- Tabela com todas as colunas: Pedido, Cliente, Vendedor, Valor, Etapa, Data, Previsao
- Filtros por etapa, vendedor e busca textual
- KPIs: Total pedidos, Valor pipeline, Media por pedido, Etapas distintas
- Cards de resumo por etapa (clicaveis para filtrar)
- Clique em qualquer linha para ver detalhes do pedido + itens
- Export PDF/Excel disponivel

| Coluna da planilha | Coluna no sistema |
|---|---|
| Previsao de Faturamento | Previsao |
| Cliente (Nome Fantasia) | Cliente |
| Pedido de Venda | Pedido (# numero) |
| Vendedor | Vendedor |
| Etapa | Etapa (badge colorido) |
| Tags | (visivel no detalhe do pedido) |
| Total da Nota Fiscal | Valor |

---

## 6. pivot (53).xlsx — Pedidos em Execucao (filtrado)

**O que mostra:** Mesmos pedidos do pivot (50) mas pre-filtrados apenas para etapas em execucao: PEDIDO ENTREGUE, Separar Estoque, Pedido de Venda, EM ROTA DE ENTREGA (exclui orcamentos).

**No sistema:** Pagina **Pedidos & Orcamentos** → Botao **Em Execucao**

- Clique no botao "Em Execucao" no topo da pagina
- A tabela filtra automaticamente removendo pedidos com etapa ORCAMENTO
- Total recalculado no rodape da tabela

---

## Resumo Rapido

| Quero ver... | Vou em... |
|---|---|
| Churn por administradora | Comparacao → Administradoras |
| Todos os clientes dos 2 meses | Comparacao → Condominios |
| Clientes perdidos | Comparacao → Perdidos |
| Clientes novos | Comparacao → Novos |
| Comparacao por vendedor | Comparacao → Vendedores |
| Comparacao por tipo | Comparacao → Tipo Cliente |
| Top administradoras com queda | Dashboard → Card Top Quedas |
| Curva ABC por valor | Curva ABC → Por Valor |
| Curva ABC por quantidade | Curva ABC → Por Quantidade |
| Pipeline de pedidos (todos) | Orcamentos → Todos |
| Pedidos em execucao | Orcamentos → Em Execucao |
| Exportar qualquer dado | Botao Export (PDF/Excel) presente em todas as paginas |
