import {
  ArrowLeftRight,
  BarChart3,
  FileText,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react'

export interface HelpMapping {
  id: string
  spreadsheet: string
  tab: string
  description: string
  systemPage: string
  systemSection: string
  route: string
  extras?: string
}

export interface SystemPageGroup {
  key: string
  label: string
  icon: LucideIcon
  items: HelpMapping[]
}

const HELP_MAPPINGS: HelpMapping[] = [
  // Relatorio_Administradoras
  {
    id: 'admin-resumo',
    spreadsheet: 'Relatorio_Administradoras',
    tab: 'Resumo_Administradoras',
    description: 'Tabela com 39 administradoras comparando dois meses — condominios, retidos, perdidos, novos, taxa de retencao, faturamento e deltas.',
    systemPage: 'comparacao',
    systemSection: 'Administradoras',
    route: '/comparacao?tab=administradoras',
  },
  {
    id: 'admin-detalhe',
    spreadsheet: 'Relatorio_Administradoras',
    tab: 'Admin_Mes_Detalhe',
    description: 'Faturamento, pedidos e condominios por administradora por mes.',
    systemPage: 'comparacao',
    systemSection: 'Administradoras',
    route: '/comparacao?tab=administradoras',
    extras: 'Defina Periodo A = Periodo B para ver um mes isolado.',
  },
  {
    id: 'admin-condominios',
    spreadsheet: 'Relatorio_Administradoras',
    tab: 'Condominios_por_Admin',
    description: 'Lista de todos os clientes com faturamento, pedidos dos dois meses, delta e status (Retido/Perdido/Novo).',
    systemPage: 'comparacao',
    systemSection: 'Condominios',
    route: '/comparacao?tab=condominios',
  },
  {
    id: 'admin-perdidos',
    spreadsheet: 'Relatorio_Administradoras',
    tab: 'Perdidos_Jan_nao_Fev',
    description: 'Clientes que compraram no mes A mas nao compraram no mes B.',
    systemPage: 'comparacao',
    systemSection: 'Perdidos',
    route: '/comparacao?tab=perdidos',
    extras: 'Inclui Tipo de cliente, Vendedor e Ultima Emissao.',
  },
  {
    id: 'admin-novos',
    spreadsheet: 'Relatorio_Administradoras',
    tab: 'Novos_em_Fev',
    description: 'Clientes novos que compraram no mes B mas nao no mes A.',
    systemPage: 'comparacao',
    systemSection: 'Novos',
    route: '/comparacao?tab=novos',
    extras: 'Inclui Tipo de cliente e Vendedor.',
  },

  // Top3_quedas
  {
    id: 'top3-resumo',
    spreadsheet: 'Top3_quedas_condominios_perdidos',
    tab: 'Resumo',
    description: 'Top administradoras com maior queda — condominios perdidos, pedidos perdidos e valor perdido.',
    systemPage: 'dashboard',
    systemSection: 'Card Top Quedas',
    route: '/',
  },
  {
    id: 'top3-lista',
    spreadsheet: 'Top3_quedas_condominios_perdidos',
    tab: 'Lista_perdidos',
    description: 'Lista detalhada dos clientes perdidos das top administradoras com vendedor, pedidos, valor e ultima emissao.',
    systemPage: 'comparacao',
    systemSection: 'Perdidos',
    route: '/comparacao?tab=perdidos',
  },

  // Curva ABC
  {
    id: 'abc-valor',
    spreadsheet: 'pivot (51)',
    tab: 'Curva ABC por Valor',
    description: 'Classificacao ABC de produtos ordenados por valor faturado, com percentual de participacao e acumulado.',
    systemPage: 'curva-abc',
    systemSection: 'Por Valor',
    route: '/curva-abc?tab=valor',
  },
  {
    id: 'abc-qtd',
    spreadsheet: 'pivot (52)',
    tab: 'Curva ABC por Quantidade',
    description: 'Classificacao ABC de produtos ordenados por quantidade vendida.',
    systemPage: 'curva-abc',
    systemSection: 'Por Quantidade',
    route: '/curva-abc?tab=quantidade',
  },

  // Pedidos
  {
    id: 'pedidos-todos',
    spreadsheet: 'pivot (50)',
    tab: 'Pedidos por Previsao (todos)',
    description: 'Lista de pedidos agrupados por data de previsao de faturamento, com cliente, vendedor, etapa, tags e valor.',
    systemPage: 'orcamentos',
    systemSection: 'Todos',
    route: '/orcamentos?preset=todos',
  },
  {
    id: 'pedidos-execucao',
    spreadsheet: 'pivot (53)',
    tab: 'Pedidos em Execucao',
    description: 'Pedidos filtrados apenas para etapas em execucao (exclui orcamentos).',
    systemPage: 'orcamentos',
    systemSection: 'Em Execucao',
    route: '/orcamentos?preset=execucao',
  },
]

const PAGE_CONFIG: Record<string, { label: string; icon: LucideIcon }> = {
  comparacao: { label: 'Comparacao de Periodos', icon: ArrowLeftRight },
  dashboard: { label: 'Dashboard', icon: LayoutDashboard },
  'curva-abc': { label: 'Curva ABC', icon: BarChart3 },
  orcamentos: { label: 'Pedidos & Orcamentos', icon: FileText },
}

export function getHelpMappingsGrouped(): SystemPageGroup[] {
  const grouped = new Map<string, HelpMapping[]>()
  for (const item of HELP_MAPPINGS) {
    const list = grouped.get(item.systemPage) ?? []
    list.push(item)
    grouped.set(item.systemPage, list)
  }

  const order = ['comparacao', 'dashboard', 'curva-abc', 'orcamentos']
  return order
    .filter((key) => grouped.has(key))
    .map((key) => ({
      key,
      label: PAGE_CONFIG[key]?.label ?? key,
      icon: PAGE_CONFIG[key]?.icon ?? FileText,
      items: grouped.get(key)!,
    }))
}

export function filterHelpMappings(query: string): SystemPageGroup[] {
  if (!query.trim()) return getHelpMappingsGrouped()

  const q = query.toLowerCase()
  const filtered = HELP_MAPPINGS.filter(
    (item) =>
      item.spreadsheet.toLowerCase().includes(q) ||
      item.tab.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.systemSection.toLowerCase().includes(q),
  )

  const grouped = new Map<string, HelpMapping[]>()
  for (const item of filtered) {
    const list = grouped.get(item.systemPage) ?? []
    list.push(item)
    grouped.set(item.systemPage, list)
  }

  const order = ['comparacao', 'dashboard', 'curva-abc', 'orcamentos']
  return order
    .filter((key) => grouped.has(key))
    .map((key) => ({
      key,
      label: PAGE_CONFIG[key]?.label ?? key,
      icon: PAGE_CONFIG[key]?.icon ?? FileText,
      items: grouped.get(key)!,
    }))
}
