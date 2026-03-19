import { useQuery } from '@tanstack/react-query'
import {
  getResumoGlobal,
  getVendasPorVendedor,
  getClientesInativos,
} from '@/services/api/dashboard'
import { getVendedores } from '@/services/api/vendedores'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/types/database'

export function useResumoGlobal(ano?: number) {
  return useQuery({
    queryKey: ['resumo-global', ano],
    queryFn: () => getResumoGlobal(ano),
  })
}

export function useResumoGlobalAll() {
  return useQuery({
    queryKey: ['resumo-global-all'],
    queryFn: () => getResumoGlobal(),
  })
}

export function useVendasPorVendedor(ano?: number, mes?: number) {
  return useQuery({
    queryKey: ['vendas-por-vendedor', ano, mes],
    queryFn: () => getVendasPorVendedor(ano, mes),
  })
}

export function useClientesInativos() {
  return useQuery({
    queryKey: ['clientes-inativos'],
    queryFn: getClientesInativos,
  })
}

export function useVendedores() {
  return useQuery({
    queryKey: ['vendedores'],
    queryFn: getVendedores,
  })
}

export function useClientesAtivosCount() {
  return useQuery({
    queryKey: ['clientes-ativos-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo')
      if (error) throw error
      return count ?? 0
    },
  })
}

export function useVendasMesCount(ano: number, mes: number) {
  return useQuery({
    queryKey: ['vendas-mes-count', ano, mes],
    queryFn: async (): Promise<number> => {
      // Count pedidos (sales orders) by previsao_faturamento month/year
      // Matches Omie pivot logic: "Pedidos por Previsão de Faturamento"
      const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`
      const endDate = mes === 12
        ? `${ano + 1}-01-01`
        : `${ano}-${String(mes + 1).padStart(2, '0')}-01`

      const { count, error } = await supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true })
        .gte('previsao_faturamento', startDate)
        .lt('previsao_faturamento', endDate)
        .neq('status', 'cancelado')
      if (error) throw error
      return count ?? 0
    },
  })
}

// Re-export type for convenience
export type { Tables }
