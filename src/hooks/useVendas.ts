import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getVendas,
  createVenda,
  updateVenda,
  deleteVenda,
} from '@/services/api/vendas'
import { getClientes } from '@/services/api/clientes'
import { getVendedores } from '@/services/api/vendedores'
import type { InsertTables, UpdateTables } from '@/lib/types/database'

export function useVendas(filters?: {
  ano?: number
  mes?: number
  vendedor_id?: string
  tipo_cliente?: string
  status?: string
}) {
  return useQuery({
    queryKey: ['vendas', filters],
    queryFn: () => getVendas(filters),
  })
}

export function useClientesForSelect() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: getClientes,
  })
}

export function useVendedoresForSelect() {
  return useQuery({
    queryKey: ['vendedores'],
    queryFn: getVendedores,
  })
}

export function useCreateVenda() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: InsertTables<'vendas'>) => createVenda(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] })
      queryClient.invalidateQueries({ queryKey: ['resumo-global'] })
      queryClient.invalidateQueries({ queryKey: ['vendas-por-vendedor'] })
      queryClient.invalidateQueries({ queryKey: ['vendas-mes-count'] })
    },
  })
}

export function useUpdateVenda() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateTables<'vendas'>
    }) => updateVenda(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] })
      queryClient.invalidateQueries({ queryKey: ['resumo-global'] })
    },
  })
}

export function useDeleteVenda() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteVenda(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] })
      queryClient.invalidateQueries({ queryKey: ['resumo-global'] })
    },
  })
}
