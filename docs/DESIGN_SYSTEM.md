# Design System - FRV-Omie Dashboard de Vendas v2.0

> Documento de referencia para o design system do FRV-Omie.
> Versao 2.0 — "Omie-Connected Premium" (atualizado 2026-02-25).
> Todas as decisoes de UI/UX devem seguir estas especificacoes.

---

## Color Palette (CSS Variables)

### Light Mode

| Token               | Value     | Descricao                          |
|----------------------|-----------|------------------------------------|
| `--primary`          | `#0066FF` | Omie Blue - cor principal          |
| `--primary-hover`    | `#0052CC` | Hover da cor principal             |
| `--success`          | `#00C896` | Teal - sucesso, positivo           |
| `--error`            | `#ef4444` | Vermelho - erro, destrutivo        |
| `--warning`          | `#f59e0b` | Amber - aviso, atencao             |
| `--info`             | `#0066FF` | Omie Blue - informativo            |
| `--surface`          | `#F7F8FC` | Fundo principal                    |
| `--surface-elevated` | `#ffffff` | Fundo elevado (cards)              |
| `--text-primary`     | `#111118` | Texto principal                    |
| `--text-secondary`   | `#616189` | Texto secundario, labels           |
| `--border`           | `#dbdbe6` | Bordas e divisores                 |
| `--border-focus`     | `#0066FF` | Borda de foco (igual primary)      |

### Dark Mode

| Token               | Value     | Descricao                          |
|----------------------|-----------|------------------------------------|
| `--primary`          | `#3D8BFF` | Omie Blue claro para contraste     |
| `--primary-hover`    | `#5CA3FF` | Hover em dark mode                 |
| `--success`          | `#00C896` | Teal (sem alteracao)               |
| `--error`            | `#f87171` | Vermelho claro                     |
| `--warning`          | `#fbbf24` | Amber claro                        |
| `--info`             | `#3D8BFF` | Omie Blue claro                    |
| `--surface`          | `#1c1c27` | Fundo dark                         |
| `--surface-elevated` | `#252538` | Fundo elevado dark                 |
| `--text-primary`     | `#f9fafb` | Texto principal dark               |
| `--text-secondary`   | `#94a3b8` | Texto secundario dark              |
| `--border`           | `#334155` | Bordas dark                        |
| `--border-focus`     | `#3D8BFF` | Borda de foco dark                 |

### Sidebar (Premium Dark — fixo, nao varia com tema)

| Token                    | Value     | Descricao                          |
|--------------------------|-----------|------------------------------------|
| `--sidebar`              | `#1A1D26` | Fundo da sidebar                   |
| `--sidebar-foreground`   | `#ffffff` | Texto na sidebar                   |
| `--sidebar-primary`      | `#0066FF` | Item ativo / destaque              |
| `--sidebar-accent`       | `#2d313d` | Hover de item inativo              |
| `--sidebar-border`       | `#2d313d` | Bordas internas                    |

### Chart Colors

Cores usadas em graficos (Recharts). Sempre usar valores hex diretos (nao CSS vars).

| Token      | Valor     | Uso                                 |
|------------|-----------|-------------------------------------|
| `chart-1`  | `#0066FF` | Omie Blue - receita, linha principal |
| `chart-2`  | `#00C896` | Teal - ticket medio, faturas pagas  |
| `chart-3`  | `#F59E0B` | Amber - pendentes, atencao          |
| `chart-4`  | `#FF6B35` | Orange - destaque, administradoras  |
| `chart-5`  | `#94A3B8` | Slate - consumidor final, neutro    |

### Accent Colors (Hardcoded)

Cores de destaque usadas diretamente em componentes (nao variam com tema).

| Elemento                    | Valor / Classes Tailwind                           |
|-----------------------------|-----------------------------------------------------|
| Sidebar logo background     | `bg-[#0066FF]`                                      |
| Sidebar logo shadow         | `shadow-[#0066FF]/30`                               |
| Sidebar nav item ativo      | `bg-[#0066FF]` solid, `shadow-[#0066FF]/20`         |
| Sidebar avatar              | `bg-[#0066FF]`                                      |
| Sidebar online dot          | `bg-[#00C896]`                                      |
| KPI icon - Receita (primary)| `from-[#0066FF] to-[#0052CC]`                       |
| KPI icon - Teal             | `from-[#00C896] to-[#00A37A]`                       |
| KPI icon - Pendentes        | `from-amber-500 to-amber-600`                       |
| Trend badge positivo        | `text-[#0066FF]` sobre `bg-blue-100/60`             |
| Botoes de acao principal    | `bg-[#0066FF] hover:bg-[#0052CC] shadow-[#0066FF]/20` |
| Total Geral row gradient    | `from-[#0066FF]/10 to-transparent border-[#0066FF]/30` |

### Mapeamento Tipo de Cliente → Cor

| Tipo               | Chart color | Badge color |
|--------------------|-------------|-------------|
| administradora     | `#0066FF`   | blue        |
| sindico            | `#00C896`   | amber       |
| empresa            | `#F59E0B`   | teal        |
| consumidor_final   | `#94A3B8`   | muted       |

---

## Typography

### Font Families

| Funcao     | Familia          | Pesos       | Uso                            |
|------------|------------------|-------------|--------------------------------|
| Display    | Space Grotesk    | 300-700     | Headings, titulos de pagina    |
| Body       | Noto Sans        | 300-800     | Texto corrido, labels, tabelas |
| Monospace  | JetBrains Mono   | 400, 500    | Codigo, IDs, **valores numericos** |

> **Regra:** Todo valor monetario, percentual ou numerico relevante usa `font-mono tabular-nums`.

### Google Fonts URL

```
https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Noto+Sans:ital,wght@0,300..800;1,300..800&family=JetBrains+Mono:wght@400;500&display=swap
```

### Typography Scale

| Elemento      | Classes Tailwind                                | Exemplo de uso                |
|---------------|------------------------------------------------|-------------------------------|
| Page title    | `text-3xl md:text-4xl font-extrabold tracking-tight` | Titulo da pagina (h1)   |
| Card title    | `font-bold text-xl`                            | Titulo dentro de cards        |
| KPI value     | `text-3xl font-bold tracking-tight font-mono`  | Numero grande de KPI          |
| KPI label     | `text-sm font-medium`                          | Label abaixo do valor KPI     |
| Table header  | `text-xs font-bold uppercase tracking-wider`   | Cabecalho de tabela           |
| Body          | `text-sm font-medium`                          | Texto geral                   |
| Numeric value | `tabular-nums font-mono`                       | Qualquer valor numerico        |

---

## Spacing

### Base Unit

4px (padrao Tailwind). Todo spacing segue multiplos de 4.

### Spacing Tokens

| Token          | Classes Tailwind  | Valor   | Uso                             |
|----------------|-------------------|---------|---------------------------------|
| Card padding   | `p-6`             | 24px    | Padding padrao de cards         |
| Card padding sm| `p-3`             | 12px    | Cards compactos                 |
| Card padding lg| `p-8`             | 32px    | Cards com mais respiro          |
| Section gap    | `space-y-6`       | 24px    | Espaco entre secoes             |
| Card gap       | `gap-4`           | 16px    | Espaco entre cards no grid      |

---

## Border Radius

| Elemento          | Classes Tailwind | Valor  |
|-------------------|-----------------|--------|
| Cards             | `rounded-xl`    | 12px   |
| Buttons sm        | `rounded-md`    | 6px    |
| Buttons md        | `rounded-lg`    | 8px    |
| Buttons lg        | `rounded-xl`    | 12px   |
| Sidebar nav items | `rounded-xl`    | 12px   |
| Modal             | `rounded-2xl`   | 16px   |
| Avatar            | `rounded-full`  | 9999px |
| Chart bars        | `radius [8,8,8,8]` | 8px (Recharts prop) |

---

## Shadows

### Elevation Scale

| Nivel | Valor CSS                                 | Uso                      |
|-------|-------------------------------------------|--------------------------|
| sm    | `0 1px 2px rgba(0,0,0,0.05)`             | Cards em repouso         |
| md    | `0 4px 6px -1px rgba(0,0,0,0.1)`        | Cards em hover           |
| lg    | `0 10px 15px -3px rgba(0,0,0,0.1)`      | Modais, dropdowns        |

### Colored Shadows

| Cor                        | Uso                                |
|----------------------------|-------------------------------------|
| `shadow-[#0066FF]/20`      | Sidebar nav item ativo             |
| `shadow-[#0066FF]/30`      | Logo icon, botoes primarios        |
| `shadow-[#00C896]/30`      | KPI icon teal                      |
| `shadow-amber-500/30`      | KPI icon pendentes                 |

---

## Component Patterns

### KPI Card

Padrao para cards de indicador-chave (KPIs) no Dashboard.

```
Estrutura:
- Container: rounded-xl, p-6, bg-surface, shadow-sm, hover:scale-[1.02]
- Icon: p-3.5, rounded-2xl, bg-gradient-to-br {color}, text-white, shadow-lg
- Glow: absolute -right-6 -top-6 w-24 h-24, gradient, opacity-10, blur-xl
- Value: text-3xl font-bold tracking-tight font-mono
- Label: text-sm font-medium text-secondary
- Trend: badge com primary/blue (positivo) ou red (negativo)
```

Cada KPI usa uma cor diferente:

| KPI       | Gradient                              | Shadow                   |
|-----------|---------------------------------------|--------------------------|
| Receita   | `from-[#0066FF] to-[#0052CC]`         | `shadow-[#0066FF]/30`    |
| Clientes  | `from-[#00C896] to-[#00A37A]`         | `shadow-[#00C896]/30`    |
| Pendentes | `from-amber-500 to-amber-600`         | `shadow-amber-500/30`    |

### Sidebar

```
Estrutura:
- Background: bg-[#1A1D26] (dark fixo, independente do tema)
- Logo: bg-[#0066FF] + shadow-[#0066FF]/30
- Nav item ativo: bg-[#0066FF] solid, text-white, shadow-[#0066FF]/20
- Nav item inativo: text-sidebar-foreground/70, hover:bg-sidebar-accent
- User section (bottom): avatar bg-[#0066FF] + online dot bg-[#00C896]
- Versao: "Dashboard v2.0"
```

### Charts

```
Recharts config:
- Cores: usar constantes de src/lib/theme-constants.ts (CHART_COLORS)
- Bar radius: [8, 8, 8, 8] (totalmente arredondado)
- Tooltip: borderRadius 16px, boxShadow "0 10px 30px rgba(0,0,0,0.1)"
- CartesianGrid: strokeDasharray="3 3", vertical={false}
- XAxis / YAxis: axisLine={false}, tickLine={false}
```

---

## Custom Scrollbar

```css
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 102, 255, 0.3); /* #0066FF */
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 102, 255, 0.6);
}

::selection {
  background: #0066FF;
  color: white;
}
```

---

## Transition Patterns

| Elemento       | Classes / Config                                  | Descricao                     |
|----------------|---------------------------------------------------|-------------------------------|
| Card hover     | `hover:scale-[1.02] transition-transform duration-300` | Leve zoom no hover       |
| Glow hover     | `group-hover:opacity-20 transition-opacity`       | Glow aparece no hover         |
| Nav items      | `transition-all duration-200`                     | Transicao suave na sidebar    |
| Sidebar slide  | `duration-300 ease-in-out`                        | Abertura/fechamento sidebar   |

---

## Implementation Notes

### Constantes Centralizadas

Todas as cores de UI devem ser importadas de `src/lib/theme-constants.ts`:

```typescript
import {
  CHART_COLORS,      // { primary, teal, amber, orange, gray }
  TYPE_COLORS,       // mapeamento tipo -> hex
  TYPE_BADGE_COLORS, // mapeamento tipo -> variant name
  TYPE_LABEL,        // mapeamento tipo -> label PT
  TYPE_LABELS_PLURAL,// mapeamento tipo -> label PT plural
  STATUS_BADGE,      // mapeamento status venda -> variant
  ROLE_BADGE_CLASSES,// mapeamento role -> classes Tailwind
} from '@/lib/theme-constants'
```

> **Nunca** definir essas constantes localmente em cada componente.

### CSS Variables em `index.css`

O arquivo `src/index.css` define as variaveis via `@theme inline` (Tailwind v4) e `:root` / `.dark`.

```
--primary       -> #0066FF (Omie Blue)
--success       -> #00C896 (Teal)
--destructive   -> #ef4444
--warning       -> #f59e0b
--background    -> #F7F8FC
--card          -> #ffffff
--foreground    -> #111118
--muted-foreground -> #616189
--border        -> #dbdbe6
--ring          -> #0066FF
--chart-1..5    -> #0066FF / #00C896 / #F59E0B / #FF6B35 / #94A3B8
--sidebar       -> #1A1D26 (dark fixo)
```

### Recharts: Usar Hex

Recharts nao interpreta variaveis CSS. Sempre usar valores hex diretos via `CHART_COLORS`:

```typescript
import { CHART_COLORS } from '@/lib/theme-constants'

// Correto:
stroke={CHART_COLORS.primary}   // '#0066FF'
fill={CHART_COLORS.teal}        // '#00C896'
fill={CHART_COLORS.amber}       // '#F59E0B'
fill={CHART_COLORS.orange}      // '#FF6B35'
fill={CHART_COLORS.gray}        // '#94A3B8'
```

### Font Loading

Configurado via `@import` no topo de `src/index.css` (nao precisa de tag `<link>` separada):

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Noto+Sans:ital,wght@0,300..800;1,300..800&family=JetBrains+Mono:wght@400;500&display=swap');
```

Variaveis CSS configuradas em `@theme inline`:
```css
--font-display: 'Space Grotesk', sans-serif;
--font-body:    'Noto Sans', sans-serif;
--font-mono:    'JetBrains Mono', monospace;
```

---

## Source

Design system V2.0 "Omie-Connected Premium" — FRV-Omie Dashboard de Vendas.
Implementado em 2026-02-25. Baseado no ecossistema de cores do Omie CRM (#0066FF).
