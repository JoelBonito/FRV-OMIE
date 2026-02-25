import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClientes,
  getCliente,
  createCliente,
  updateCliente,
  deleteCliente,
} from '@/services/api/clientes'
import { getVendedores } from '@/services/api/vendedores'
import type { InsertTables, UpdateTables } from '@/lib/types/database'

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: getClientes,
  })
}

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: () => getCliente(id!),
    enabled: !!id,
  })
}

export function useVendedoresForSelect() {
  return useQuery({
    queryKey: ['vendedores'],
    queryFn: getVendedores,
  })
}

export function useCreateCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: InsertTables<'clientes'>) => createCliente(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}

export function useUpdateCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTables<'clientes'> }) =>
      updateCliente(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['cliente'] })
    },
  })
}

export function useDeleteCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCliente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}
