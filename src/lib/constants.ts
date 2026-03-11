export const APP_NAME = 'FRV Omie'
export const APP_DESCRIPTION = 'Dashboard de Vendas'

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  CLIENTES: '/clientes',
  VENDEDORES: '/vendedores',
  VENDAS: '/vendas',
  COMPARACAO: '/comparacao',
  ORCAMENTOS: '/orcamentos',
  CURVA_ABC: '/curva-abc',
  CARTEIRAS: '/carteiras',
  SYNC: '/sync',
  CONFIG: '/config',
  CONFIG_USERS: '/config/usuarios',
} as const

export const CLIENT_TYPES = [
  { value: 'administradora', label: 'Administradora' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'sindico', label: 'Síndico' },
  { value: 'consumidor_final', label: 'Consumidor Final' },
] as const

export const SALE_STATUSES = [
  { value: 'faturado', label: 'Faturado' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'cancelado', label: 'Cancelado' },
] as const

export const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
] as const
