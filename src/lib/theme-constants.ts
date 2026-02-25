/**
 * Constantes de tema centralizadas para o Redesign V2.0
 * Alinhado ao ecossistema "Omie-Connected Premium"
 */

export const CHART_COLORS = {
    primary: '#0066FF',
    teal: '#00C896',
    amber: '#F59E0B',
    orange: '#FF6B35',
    gray: '#94A3B8',
} as const

export const TYPE_COLORS: Record<string, string> = {
    administradora: CHART_COLORS.primary,
    sindico: CHART_COLORS.teal,
    empresa: CHART_COLORS.amber,
    consumidor_final: CHART_COLORS.gray,
}

export const TYPE_BADGE_COLORS: Record<string, string> = {
    administradora: 'blue',
    sindico: 'amber',
    empresa: 'teal',
    consumidor_final: 'muted',
}

export const TYPE_LABEL: Record<string, string> = {
    administradora: 'Administradora',
    sindico: 'Síndico',
    empresa: 'Empresa',
    consumidor_final: 'Consumidor Final',
}

export const TYPE_LABELS_PLURAL: Record<string, string> = {
    administradora: 'Administradoras',
    sindico: 'Síndicos',
    empresa: 'Empresas',
    consumidor_final: 'Consumidor Final',
}

export const STATUS_BADGE: Record<string, string> = {
    faturado: 'success',
    pendente: 'warning',
    cancelado: 'destructive',
}

export const ROLE_BADGE_CLASSES: Record<string, string> = {
    admin: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    gerente: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800',
    vendedor: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
}
