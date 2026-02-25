# Plano de Refatoração: Carteiras Page V2.0

## Objetivo
Transformar a página de Carteiras em uma interface premium, intuitiva e que suporte grandes volumes de dados sem quebra de layout.

## Mudanças Estruturais

### 1. Filtros e Navegação
- [ ] Remover `Tabs` horizontais para vendedores.
- [ ] Implementar um `VendedorSelector` (Select estilizado com Avatares).
- [ ] Adicionar um `AnoSelector` (Multi-select) para filtrar as colunas da tabela.
- [ ] Agrupar filtros em uma `Card` de controles refinada.

### 2. Tabela de Carteiras (Pivot por Ano)
- [ ] Alterar a lógica do Pivot: Colunas = Anos selecionados.
- [ ] Adicionar coluna de "Status" (Ativo/Inativo) para o cliente na linha.
- [ ] Implementar `font-mono` em todos os valores monetários.
- [ ] Melhorar a coluna fixa de "Cliente" para melhor legibilidade em telas menores.

### 3. KPIs e Resumo
- [ ] Refatorar cards de KPI para usar a nova paleta V2.0.
- [ ] Adicionar um mini-gráfico (Sparkline) de tendência anual por cliente se possível.

## Tecnologias
- `shadcn/ui` (Select, Multi-select, Command, Popover)
- `lucide-react` para iconografia premium.
- `font-mono` para dados financeiros.

## Cronograma
1. **Fase 1**: Refatoração da lógica de dados (Pivot por Ano).
2. **Fase 2**: Implementação dos novos componentes de filtragem.
3. **Fase 3**: Polimento visual e responsividade.
