import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getVendedores,
  getVendedor,
  createVendedor,
  updateVendedor,
} from '@/services/api/vendedores'
import { getVendasPorVendedor } from '@/services/api/dashboard'
import type { InsertTables, UpdateTables } from '@/lib/types/database'

export function useVendedores() {
  return useQuery({
    queryKey: ['vendedores'],
    queryFn: getVendedores,
  })
}

export function useVendedor(id: string | undefined) {
  return useQuery({
    queryKey: ['vendedor', id],
    queryFn: () => getVendedor(id!),
    enabled: !!id,
  })
}

export function useVendedorPerformance(ano: number) {
  return useQuery({
    queryKey: ['vendas-por-vendedor', ano],
    queryFn: () => getVendasPorVendedor(ano),
  })
}

export function useCreateVendedor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: InsertTables<'vendedores'>) => createVendedor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendedores'] })
    },
  })
}

export function useUpdateVendedor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateTables<'vendedores'>
    }) => updateVendedor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendedores'] })
      queryClient.invalidateQueries({ queryKey: ['vendedor'] })
    },
  })
}
